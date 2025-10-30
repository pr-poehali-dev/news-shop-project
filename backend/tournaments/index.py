'''
Business: Управление регистрациями на турниры
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict
'''

import json
import os
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, ValidationError
import psycopg2
from psycopg2.extras import RealDictCursor


class TournamentRegistration(BaseModel):
    tournament_id: int = Field(..., gt=0)
    steam_id: str = Field(..., min_length=1)
    persona_name: str = Field(..., min_length=1)
    avatar_url: Optional[str] = None


def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(database_url)


def generate_bracket(tournament_id: int, conn) -> bool:
    '''Генерирует турнирную сетку из подтвержденных участников'''
    import random
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Получить подтвержденных участников
    cursor.execute('''
        SELECT steam_id FROM tournament_registrations
        WHERE tournament_id = %s AND confirmed_at IS NOT NULL
        ORDER BY confirmed_at ASC
    ''', (tournament_id,))
    
    participants = [row['steam_id'] for row in cursor.fetchall()]
    
    if len(participants) < 2:
        return False
    
    # Проверить, не создана ли уже сетка
    cursor.execute('''
        SELECT COUNT(*) as count FROM tournament_brackets
        WHERE tournament_id = %s
    ''', (tournament_id,))
    
    if cursor.fetchone()['count'] > 0:
        return True
    
    # Перемешать участников случайным образом
    random.shuffle(participants)
    
    # Рассчитать количество раундов (для single elimination)
    import math
    num_rounds = math.ceil(math.log2(len(participants)))
    total_matches = 2 ** num_rounds - 1
    first_round_matches = len(participants) // 2
    
    # Создать первый раунд
    match_number = 0
    for i in range(0, len(participants) - 1, 2):
        player1 = participants[i]
        player2 = participants[i + 1] if i + 1 < len(participants) else None
        
        cursor.execute('''
            INSERT INTO tournament_brackets 
            (tournament_id, round_number, match_number, player1_steam_id, player2_steam_id, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (tournament_id, 1, match_number, player1, player2, 'pending'))
        
        match_number += 1
    
    # Если нечетное количество участников, последний проходит автоматически
    if len(participants) % 2 == 1:
        last_player = participants[-1]
        cursor.execute('''
            INSERT INTO tournament_brackets 
            (tournament_id, round_number, match_number, player1_steam_id, winner_steam_id, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (tournament_id, 1, match_number, last_player, last_player, 'completed'))
    
    conn.commit()
    return True


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Admin-Steam-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # GET: Получить список турниров с количеством участников или детали одного турнира
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            steam_id = params.get('steam_id')
            tournament_id = params.get('tournament_id')
            
            # Получить детали турнира с участниками
            if tournament_id:
                cursor.execute('''
                    SELECT 
                        t.id,
                        t.name,
                        t.description,
                        t.prize_pool,
                        t.max_participants,
                        t.status,
                        t.tournament_type,
                        t.game,
                        to_char(t.start_date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"') as start_date,
                        COUNT(tr.id) as participants_count
                    FROM tournaments t
                    LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
                    WHERE t.id = %s
                    GROUP BY t.id
                ''', (tournament_id,))
                
                tournament = cursor.fetchone()
                if not tournament:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Турнир не найден'})
                    }
                
                # Проверить, не пора ли начать турнир и сгенерировать сетку
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc)
                start_date_str = tournament['start_date']
                
                # Парсим строку в datetime если это строка
                if isinstance(start_date_str, str):
                    start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                else:
                    start_date = start_date_str
                    if start_date.tzinfo is None:
                        start_date = start_date.replace(tzinfo=timezone.utc)
                
                if tournament['status'] == 'upcoming' and now >= start_date:
                    # Обновить статус на 'ongoing'
                    cursor.execute('''
                        UPDATE tournaments SET status = 'ongoing'
                        WHERE id = %s
                    ''', (tournament_id,))
                    conn.commit()
                    
                    # Сгенерировать сетку
                    generate_bracket(tournament_id, conn)
                    
                    # Обновить данные турнира
                    tournament = dict(tournament)
                    tournament['status'] = 'ongoing'
                
                # Получить участников турнира
                cursor.execute('''
                    SELECT 
                        tr.steam_id,
                        COALESCE(u.nickname, tr.persona_name) as persona_name,
                        tr.avatar_url,
                        to_char(tr.registered_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"') as registered_at,
                        to_char(tr.confirmed_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"') as confirmed_at,
                        COALESCE(u.is_admin, false) as is_admin,
                        COALESCE(u.is_moderator, false) as is_moderator
                    FROM tournament_registrations tr
                    LEFT JOIN t_p15345778_news_shop_project.users u ON tr.steam_id = u.steam_id
                    WHERE tr.tournament_id = %s
                    ORDER BY tr.registered_at ASC
                ''', (tournament_id,))
                
                participants = cursor.fetchall()
                
                result = dict(tournament)
                result['participants'] = [dict(p) for p in participants]
                
                # Получить турнирную сетку если турнир начался
                if tournament['status'] == 'ongoing':
                    cursor.execute('''
                        SELECT 
                            tb.id,
                            tb.round_number,
                            tb.match_number,
                            tb.player1_steam_id,
                            tb.player2_steam_id,
                            tb.winner_steam_id,
                            tb.player1_score,
                            tb.player2_score,
                            tb.status,
                            p1.persona_name as player1_name,
                            p1.avatar_url as player1_avatar,
                            p2.persona_name as player2_name,
                            p2.avatar_url as player2_avatar
                        FROM tournament_brackets tb
                        LEFT JOIN tournament_registrations p1 ON tb.player1_steam_id = p1.steam_id AND tb.tournament_id = p1.tournament_id
                        LEFT JOIN tournament_registrations p2 ON tb.player2_steam_id = p2.steam_id AND tb.tournament_id = p2.tournament_id
                        WHERE tb.tournament_id = %s
                        ORDER BY tb.round_number, tb.match_number
                    ''', (tournament_id,))
                    
                    bracket = cursor.fetchall()
                    result['bracket'] = [dict(b) for b in bracket]
                else:
                    result['bracket'] = []
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps(result)
                }
            
            # Получить список турниров
            if steam_id:
                # Получить турниры с информацией о регистрации пользователя
                cursor.execute('''
                    SELECT 
                        t.id,
                        t.name,
                        t.description,
                        t.prize_pool,
                        t.max_participants,
                        t.status,
                        t.tournament_type,
                        t.game,
                        to_char(t.start_date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"') as start_date,
                        COUNT(tr.id) as participants_count,
                        EXISTS(
                            SELECT 1 FROM tournament_registrations 
                            WHERE tournament_id = t.id AND steam_id = %s
                        ) as is_registered,
                        (
                            SELECT to_char(confirmed_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"')
                            FROM tournament_registrations 
                            WHERE tournament_id = t.id AND steam_id = %s
                        ) as confirmed_at
                    FROM tournaments t
                    LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
                    GROUP BY t.id
                    ORDER BY t.start_date
                ''', (steam_id, steam_id))
            else:
                # Получить все турниры с количеством участников
                cursor.execute('''
                    SELECT 
                        t.id,
                        t.name,
                        t.description,
                        t.prize_pool,
                        t.max_participants,
                        t.status,
                        t.tournament_type,
                        t.game,
                        to_char(t.start_date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"') as start_date,
                        COUNT(tr.id) as participants_count
                    FROM tournaments t
                    LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
                    GROUP BY t.id
                    ORDER BY t.start_date
                ''')
            
            tournaments = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'tournaments': [dict(row) for row in tournaments]})
            }
        
        # POST: Создать турнир (админ) или зарегистрироваться на турнир (пользователь)
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            print(f"POST body_data: {body_data}")
            admin_steam_id = event.get('headers', {}).get('X-Admin-Steam-Id')
            print(f"Admin Steam ID: {admin_steam_id}")
            
            # Админ создает турнир
            if admin_steam_id and 'name' in body_data:
                escaped_steam_id = admin_steam_id.replace("'", "''")
                cursor.execute(f"SELECT is_admin FROM users WHERE steam_id = '{escaped_steam_id}'")
                result = cursor.fetchone()
                is_admin = result['is_admin'] if result else False
                
                if not is_admin:
                    return {
                        'statusCode': 403,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Admin rights required'})
                    }
                
                name = body_data.get('name', '').strip()
                description = body_data.get('description', '').strip()
                prize_pool = body_data.get('prize_pool')
                max_participants = body_data.get('max_participants')
                tournament_type = body_data.get('tournament_type', 'solo')
                start_date = body_data.get('start_date')
                status = body_data.get('status', 'upcoming')
                game = body_data.get('game', 'CS2')
                
                if not name or prize_pool is None or max_participants is None or not start_date:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'name, prize_pool, max_participants, start_date are required'})
                    }
                
                escaped_name = name.replace("'", "''")
                escaped_description = description.replace("'", "''")
                escaped_start_date = start_date.replace("'", "''")
                escaped_game = game.replace("'", "''")
                
                cursor.execute(f"""
                    INSERT INTO tournaments (name, description, prize_pool, max_participants, tournament_type, start_date, status, game)
                    VALUES ('{escaped_name}', '{escaped_description}', {int(prize_pool)}, {int(max_participants)}, '{tournament_type}', '{escaped_start_date}', '{status}', '{escaped_game}')
                    RETURNING id, name, description, prize_pool, max_participants, tournament_type, start_date, status, game
                """)
                
                tournament = cursor.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps(dict(tournament), default=str)
                }
            
            # Пользователь регистрируется на турнир
            registration = TournamentRegistration(**body_data)
            
            # Проверить, не зарегистрирован ли уже пользователь
            cursor.execute('''
                SELECT id FROM tournament_registrations 
                WHERE tournament_id = %s AND steam_id = %s
            ''', (registration.tournament_id, registration.steam_id))
            
            if cursor.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Вы уже зарегистрированы на этот турнир'})
                }
            
            # Проверить, есть ли свободные места и время до начала
            cursor.execute('''
                SELECT 
                    t.max_participants,
                    t.start_date,
                    COUNT(tr.id) as participants_count
                FROM tournaments t
                LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
                WHERE t.id = %s
                GROUP BY t.id, t.max_participants, t.start_date
            ''', (registration.tournament_id,))
            
            tournament_info = cursor.fetchone()
            if not tournament_info:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Турнир не найден'})
                }
            
            # Проверить, не осталось ли меньше часа до начала турнира
            from datetime import datetime, timezone, timedelta
            start_date = tournament_info['start_date']
            
            # Убедимся, что start_date имеет timezone
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            
            now = datetime.now(timezone.utc)
            one_hour_before = start_date - timedelta(hours=1)
            
            if now >= one_hour_before:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Регистрация закрыта. До начала турнира осталось менее часа.'})
                }
            
            if tournament_info['participants_count'] >= tournament_info['max_participants']:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Нет свободных мест на турнир'})
                }
            
            # Зарегистрировать пользователя
            cursor.execute('''
                INSERT INTO tournament_registrations 
                (tournament_id, steam_id, persona_name, avatar_url)
                VALUES (%s, %s, %s, %s)
                RETURNING id, registered_at
            ''', (
                registration.tournament_id,
                registration.steam_id,
                registration.persona_name,
                registration.avatar_url
            ))
            
            result = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'id': result['id'],
                    'registered_at': str(result['registered_at']),
                    'message': 'Регистрация успешна'
                })
            }
        
        # PUT: Обновить турнир (только админ)
        if method == 'PUT':
            admin_steam_id = event.get('headers', {}).get('X-Admin-Steam-Id')
            
            if not admin_steam_id:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Admin authentication required'})
                }
            
            escaped_steam_id = admin_steam_id.replace("'", "''")
            cursor.execute(f"SELECT is_admin FROM users WHERE steam_id = '{escaped_steam_id}'")
            result = cursor.fetchone()
            is_admin = result['is_admin'] if result else False
            
            if not is_admin:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Admin rights required'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            tournament_id = body_data.get('id')
            
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'id is required'})
                }
            
            update_fields = []
            
            if 'name' in body_data:
                name = body_data['name'].strip()
                escaped_name = name.replace("'", "''")
                update_fields.append(f"name = '{escaped_name}'")
            
            if 'description' in body_data:
                description = body_data['description'].strip()
                escaped_description = description.replace("'", "''")
                update_fields.append(f"description = '{escaped_description}'")
            
            if 'prize_pool' in body_data:
                update_fields.append(f"prize_pool = {int(body_data['prize_pool'])}")
            
            if 'max_participants' in body_data:
                update_fields.append(f"max_participants = {int(body_data['max_participants'])}")
            
            if 'tournament_type' in body_data:
                update_fields.append(f"tournament_type = '{body_data['tournament_type']}'")
            
            if 'start_date' in body_data:
                escaped_date = body_data['start_date'].replace("'", "''")
                update_fields.append(f"start_date = '{escaped_date}'")
            
            if 'status' in body_data:
                update_fields.append(f"status = '{body_data['status']}'")
            
            if 'game' in body_data:
                game = body_data['game']
                escaped_game = game.replace("'", "''")
                update_fields.append(f"game = '{escaped_game}'")
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'No fields to update'})
                }
            
            cursor.execute(f"""
                UPDATE tournaments 
                SET {', '.join(update_fields)}
                WHERE id = {int(tournament_id)}
                RETURNING id, name, description, prize_pool, max_participants, tournament_type, start_date, status, game
            """)
            
            tournament = cursor.fetchone()
            
            if not tournament:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Tournament not found'})
                }
            
            conn.commit()
            
            # Если статус изменился на 'ongoing', генерируем сетку
            if 'status' in body_data and body_data['status'] == 'ongoing':
                generate_bracket(tournament_id, conn)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps(dict(tournament), default=str)
            }
        
        # DELETE: Отменить регистрацию или удалить турнир (админ)
        if method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            tournament_id = body_data.get('tournament_id') or body_data.get('id')
            steam_id = body_data.get('steam_id')
            
            # Отмена регистрации пользователя
            if tournament_id and steam_id:
                escaped_steam_id = steam_id.replace("'", "''")
                
                cursor.execute(
                    f"DELETE FROM tournament_registrations WHERE tournament_id = {int(tournament_id)} AND steam_id = '{escaped_steam_id}' RETURNING id"
                )
                
                deleted = cursor.fetchone()
                
                if not deleted:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Регистрация не найдена'})
                    }
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'message': 'Регистрация отменена'})
                }
            
            # Удаление турнира (только админ)
            admin_steam_id = event.get('headers', {}).get('X-Admin-Steam-Id')
            
            if not admin_steam_id:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Admin authentication required'})
                }
            
            escaped_steam_id = admin_steam_id.replace("'", "''")
            cursor.execute(f"SELECT is_admin FROM users WHERE steam_id = '{escaped_steam_id}'")
            result = cursor.fetchone()
            is_admin = result['is_admin'] if result else False
            
            if not is_admin:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Admin rights required'})
                }
            
            if not tournament_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'id is required'})
                }
            
            cursor.execute(f"DELETE FROM tournament_registrations WHERE tournament_id = {int(tournament_id)}")
            cursor.execute(f"DELETE FROM tournaments WHERE id = {int(tournament_id)}")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'message': 'Tournament deleted successfully'})
            }
        
        # PATCH: Подтвердить участие в турнире
        if method == 'PATCH':
            body_data = json.loads(event.get('body', '{}'))
            tournament_id = body_data.get('tournament_id')
            steam_id = body_data.get('steam_id')
            
            if not tournament_id or not steam_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'tournament_id and steam_id required'})
                }
            
            escaped_steam_id = steam_id.replace("'", "''")
            
            # Проверяем, что регистрация существует
            cursor.execute(
                f"SELECT * FROM tournament_registrations WHERE tournament_id = {int(tournament_id)} AND steam_id = '{escaped_steam_id}'"
            )
            registration = cursor.fetchone()
            
            if not registration:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Регистрация не найдена'})
                }
            
            # Обновляем время подтверждения
            cursor.execute(
                f"UPDATE tournament_registrations SET confirmed_at = NOW() WHERE tournament_id = {int(tournament_id)} AND steam_id = '{escaped_steam_id}'"
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'message': 'Участие подтверждено'})
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        if conn:
            conn.close()