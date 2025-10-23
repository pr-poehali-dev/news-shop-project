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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
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
                        t.start_date,
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
                        steam_id,
                        persona_name,
                        avatar_url,
                        registered_at
                    FROM tournament_registrations
                    WHERE tournament_id = %s
                    ORDER BY registered_at ASC
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
                    'body': json.dumps(result, default=str)
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
                        t.start_date,
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
                        t.start_date,
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
                'body': json.dumps([dict(row) for row in tournaments], default=str)
            }
        
        # POST: Зарегистрироваться на турнир
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
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