import json
import os
import psycopg2
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление комментариями к новостям с лайками и ответами
    Args: event с httpMethod, body, queryStringParameters; context с request_id
    Returns: HTTP ответ с комментариями или статусом создания
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Steam-Id',
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
            
            steam_id = params.get('steam_id')
            
            cur.execute('''
                SELECT id, news_id, author, text, avatar, steam_id, avatar_url,
                       to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"') as created_at,
                       parent_comment_id
                FROM t_p15345778_news_shop_project.comments
                WHERE news_id = %s
                ORDER BY created_at DESC
            ''', (int(news_id),))
            
            rows = cur.fetchall()
            comments: List[Dict[str, Any]] = []
            
            for row in rows:
                created_at = row[7]
                comment_id = row[0]
                
                cur.execute('''
                    SELECT COUNT(*) FROM t_p15345778_news_shop_project.comment_likes
                    WHERE comment_id = %s
                ''', (comment_id,))
                likes_count = cur.fetchone()[0]
                
                is_liked = False
                if steam_id:
                    cur.execute('''
                        SELECT COUNT(*) FROM t_p15345778_news_shop_project.comment_likes
                        WHERE comment_id = %s AND steam_id = %s
                    ''', (comment_id, steam_id))
                    is_liked = cur.fetchone()[0] > 0
                
                comments.append({
                    'id': row[0],
                    'news_id': row[1],
                    'author': row[2],
                    'text': row[3],
                    'avatar': row[4],
                    'steam_id': row[5],
                    'avatar_url': row[6],
                    'date': created_at,
                    'parent_comment_id': row[8],
                    'likes_count': likes_count,
                    'is_liked': is_liked
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
            steam_id = body_data.get('steam_id')
            avatar_url = body_data.get('avatar_url')
            parent_comment_id = body_data.get('parent_comment_id')
            
            if not news_id or not text:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'news_id and text required'})
                }
            
            if not author:
                author = 'Аноним'
            
            cur.execute('''
                INSERT INTO t_p15345778_news_shop_project.comments 
                (news_id, author, text, avatar, steam_id, avatar_url, parent_comment_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, news_id, author, text, avatar, steam_id, avatar_url, parent_comment_id,
                          to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"+00:00"') as created_at
            ''', (int(news_id), author, text, avatar, steam_id, avatar_url, parent_comment_id))
            
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
                        'steam_id': row[5],
                        'avatar_url': row[6],
                        'date': row[8],
                        'parent_comment_id': row[7],
                        'likes_count': 0,
                        'is_liked': False
                    }
                })
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            comment_id = body_data.get('comment_id')
            steam_id = body_data.get('steam_id')
            
            if action == 'like':
                if not comment_id or not steam_id:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'comment_id and steam_id required'})
                    }
                
                cur.execute('''
                    SELECT COUNT(*) FROM t_p15345778_news_shop_project.comment_likes
                    WHERE comment_id = %s AND steam_id = %s
                ''', (comment_id, steam_id))
                
                if cur.fetchone()[0] > 0:
                    cur.execute('''
                        DELETE FROM t_p15345778_news_shop_project.comment_likes
                        WHERE comment_id = %s AND steam_id = %s
                    ''', (comment_id, steam_id))
                    is_liked = False
                else:
                    cur.execute('''
                        INSERT INTO t_p15345778_news_shop_project.comment_likes
                        (comment_id, steam_id)
                        VALUES (%s, %s)
                    ''', (comment_id, steam_id))
                    is_liked = True
                
                conn.commit()
                
                cur.execute('''
                    SELECT COUNT(*) FROM t_p15345778_news_shop_project.comment_likes
                    WHERE comment_id = %s
                ''', (comment_id,))
                likes_count = cur.fetchone()[0]
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'is_liked': is_liked,
                        'likes_count': likes_count
                    })
                }
        
        elif method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            comment_id = body_data.get('comment_id')
            steam_id = body_data.get('steam_id')
            
            if not comment_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'comment_id required'})
                }
            
            if not steam_id:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'steam_id required'})
                }
            
            cur.execute('''
                SELECT steam_id FROM t_p15345778_news_shop_project.comments 
                WHERE id = %s
            ''', (comment_id,))
            result = cur.fetchone()
            
            if not result:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Comment not found'})
                }
            
            comment_owner_steam_id = result[0]
            
            escaped_steam_id = steam_id.replace("'", "''")
            cur.execute(f"SELECT COUNT(*) FROM admins WHERE steam_id = '{escaped_steam_id}'")
            is_admin = cur.fetchone()[0] > 0
            
            if comment_owner_steam_id != steam_id and not is_admin:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'You can only delete your own comments'})
                }
            
            cur.execute('''
                DELETE FROM t_p15345778_news_shop_project.comments 
                WHERE id = %s
            ''', (comment_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'Comment deleted'})
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