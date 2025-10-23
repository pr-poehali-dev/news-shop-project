import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: CRUD operations for news management
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with news data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            news_id = params.get('id')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if news_id:
                    cur.execute(
                        "SELECT * FROM news WHERE id = %s",
                        (int(news_id),)
                    )
                    news_item = cur.fetchone()
                    if news_item:
                        news_item['date'] = news_item['date'].strftime('%d.%m.%Y')
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'news': dict(news_item) if news_item else None})
                    }
                else:
                    cur.execute("SELECT * FROM news ORDER BY date DESC")
                    news_list = cur.fetchall()
                    for item in news_list:
                        item['date'] = item['date'].strftime('%d.%m.%Y')
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'news': [dict(item) for item in news_list]})
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO news (title, category, image_url, content, badge)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        body_data['title'],
                        body_data['category'],
                        body_data.get('image_url'),
                        body_data['content'],
                        body_data.get('badge')
                    )
                )
                new_news = cur.fetchone()
                conn.commit()
                
                new_news['date'] = new_news['date'].strftime('%d.%m.%Y')
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'news': dict(new_news)})
                }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            news_id = body_data.get('id')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    UPDATE news 
                    SET title = %s, category = %s, image_url = %s, 
                        content = %s, badge = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING *
                    """,
                    (
                        body_data['title'],
                        body_data['category'],
                        body_data.get('image_url'),
                        body_data['content'],
                        body_data.get('badge'),
                        news_id
                    )
                )
                updated_news = cur.fetchone()
                conn.commit()
                
                if updated_news:
                    updated_news['date'] = updated_news['date'].strftime('%d.%m.%Y')
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'news': dict(updated_news) if updated_news else None})
                }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            news_id = params.get('id')
            
            with conn.cursor() as cur:
                cur.execute("DELETE FROM news WHERE id = %s", (int(news_id),))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        conn.close()
