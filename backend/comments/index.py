import json
import os
import psycopg2
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление комментариями к новостям (получение и создание)
    Args: event с httpMethod, body, queryStringParameters; context с request_id
    Returns: HTTP ответ с комментариями или статусом создания
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            news_id = params.get('news_id')
            
            if not news_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'news_id required'})
                }
            
            cur.execute('''
                SELECT id, news_id, author, text, avatar, 
                       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) as seconds_ago
                FROM t_p15345778_news_shop_project.comments
                WHERE news_id = %s
                ORDER BY created_at DESC
            ''', (int(news_id),))
            
            rows = cur.fetchall()
            comments: List[Dict[str, Any]] = []
            
            for row in rows:
                seconds_ago = row[5]
                if seconds_ago < 60:
                    time_str = 'Только что'
                elif seconds_ago < 3600:
                    minutes = int(seconds_ago / 60)
                    time_str = f'{minutes} {"минута" if minutes == 1 else "минут"} назад'
                elif seconds_ago < 86400:
                    hours = int(seconds_ago / 3600)
                    time_str = f'{hours} {"час" if hours == 1 else "часов"} назад'
                else:
                    days = int(seconds_ago / 86400)
                    time_str = f'{days} {"день" if days == 1 else "дней"} назад'
                
                comments.append({
                    'id': row[0],
                    'news_id': row[1],
                    'author': row[2],
                    'text': row[3],
                    'avatar': row[4],
                    'date': time_str
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'comments': comments})
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            news_id = body_data.get('news_id')
            author = body_data.get('author', '').strip()
            text = body_data.get('text', '').strip()
            avatar = body_data.get('avatar', '👤')
            
            if not news_id or not author or not text:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'news_id, author and text required'})
                }
            
            cur.execute('''
                INSERT INTO t_p15345778_news_shop_project.comments 
                (news_id, author, text, avatar)
                VALUES (%s, %s, %s, %s)
                RETURNING id, news_id, author, text, avatar
            ''', (int(news_id), author, text, avatar))
            
            row = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'comment': {
                        'id': row[0],
                        'news_id': row[1],
                        'author': row[2],
                        'text': row[3],
                        'avatar': row[4],
                        'date': 'Только что'
                    }
                })
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
