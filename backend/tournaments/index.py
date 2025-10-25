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


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
                
                # Получить участников турнира
                cursor.execute('''
                    SELECT 
                        tr.steam_id,
                        tr.persona_name,
                        tr.avatar_url,
                        to_char(tr.registered_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"') as registered_at,
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
                        to_char(t.start_date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"') as start_date,
                        COUNT(tr.id) as participants_count,
                        EXISTS(
                            SELECT 1 FROM tournament_registrations 
                            WHERE tournament_id = t.id AND steam_id = %s
                        ) as is_registered
                    FROM tournaments t
                    LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
                    GROUP BY t.id
                    ORDER BY t.start_date
                ''', (steam_id,))
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
            admin_steam_id = event.get('headers', {}).get('X-Admin-Steam-Id')
            
            # Админ создает турнир
            if admin_steam_id and 'name' in body_data:
                escaped_steam_id = admin_steam_id.replace("'", "''")
                cursor.execute(f"SELECT COUNT(*) as count FROM admins WHERE steam_id = '{escaped_steam_id}'")
                result = cursor.fetchone()
                is_admin = result['count'] > 0 if result else False
                
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
                
                cursor.execute(f"""
                    INSERT INTO tournaments (name, description, prize_pool, max_participants, tournament_type, start_date, status)
                    VALUES ('{escaped_name}', '{escaped_description}', {int(prize_pool)}, {int(max_participants)}, '{tournament_type}', '{escaped_start_date}', '{status}')
                    RETURNING id, name, description, prize_pool, max_participants, tournament_type, start_date, status
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
            
            # Проверить, есть ли свободные места
            cursor.execute('''
                SELECT 
                    t.max_participants,
                    COUNT(tr.id) as participants_count
                FROM tournaments t
                LEFT JOIN tournament_registrations tr ON t.id = tr.tournament_id
                WHERE t.id = %s
                GROUP BY t.id, t.max_participants
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
            cursor.execute(f"SELECT COUNT(*) as count FROM admins WHERE steam_id = '{escaped_steam_id}'")
            result = cursor.fetchone()
            is_admin = result['count'] > 0 if result else False
            
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
                RETURNING id, name, description, prize_pool, max_participants, tournament_type, start_date, status
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
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps(dict(tournament), default=str)
            }
        
        # DELETE: Удалить турнир (только админ)
        if method == 'DELETE':
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
            cursor.execute(f"SELECT COUNT(*) as count FROM admins WHERE steam_id = '{escaped_steam_id}'")
            result = cursor.fetchone()
            is_admin = result['count'] > 0 if result else False
            
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