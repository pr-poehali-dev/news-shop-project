'''
Business: Update user nickname in profile
Args: event - dict with httpMethod, body containing steam_id and new nickname
      context - object with request_id
Returns: HTTP response with success status
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Steam-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        steam_id = body.get('steam_id')
        nickname = body.get('nickname', '').strip()
        
        if not steam_id or not nickname:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Steam ID and nickname are required'}),
                'isBase64Encoded': False
            }
        
        if len(nickname) < 3 or len(nickname) > 30:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Nickname must be between 3 and 30 characters'}),
                'isBase64Encoded': False
            }
        
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Database not configured'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            escaped_steam_id = steam_id.replace("'", "''")
            escaped_nickname = nickname.replace("'", "''")
            
            cursor.execute(f"""
                UPDATE t_p15345778_news_shop_project.users
                SET nickname = '{escaped_nickname}',
                    updated_at = NOW()
                WHERE steam_id = '{escaped_steam_id}'
                RETURNING id
            """)
            
            result = cursor.fetchone()
            
            if not result:
                conn.rollback()
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'nickname': nickname}),
                'isBase64Encoded': False
            }
            
        except Exception as e:
            conn.rollback()
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
        finally:
            cursor.close()
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
