'''
Business: Получение данных профиля пользователя
Args: event - dict с httpMethod, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными профиля
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


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
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    conn = None
    
    try:
        params = event.get('queryStringParameters', {}) or {}
        steam_id = params.get('steam_id')
        
        if not steam_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'steam_id is required'})
            }
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получить турниры пользователя
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
                tr.registered_at,
                (
                    SELECT COUNT(*) 
                    FROM tournament_registrations 
                    WHERE tournament_id = t.id AND registered_at < tr.registered_at
                ) + 1 as registration_position
            FROM tournament_registrations tr
            JOIN tournaments t ON tr.tournament_id = t.id
            WHERE tr.steam_id = %s
            ORDER BY tr.registered_at DESC
        ''', (steam_id,))
        
        tournaments = cursor.fetchall()
        
        # Проверить существование таблицы purchases
        cursor.execute('''
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'purchases'
            )
        ''')
        
        purchases_table_exists = cursor.fetchone()['exists']
        
        purchases_count = 0
        total_spent = 0
        
        if purchases_table_exists:
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_purchases,
                    COALESCE(SUM(amount), 0) as total_spent
                FROM purchases
                WHERE steam_id = %s
            ''', (steam_id,))
            
            purchases_stats = cursor.fetchone()
            if purchases_stats:
                purchases_count = purchases_stats['total_purchases']
                total_spent = float(purchases_stats['total_spent'])
        
        result = {
            'tournaments': [dict(row) for row in tournaments],
            'statistics': {
                'tournaments_count': len(tournaments),
                'purchases_count': purchases_count,
                'total_spent': total_spent
            }
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps(result, default=str)
        }
    
    finally:
        if conn:
            conn.close()