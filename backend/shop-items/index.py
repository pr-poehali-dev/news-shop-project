import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage shop items (CRUD operations)
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with shop items or operation status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Steam-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            include_inactive = params.get('include_inactive') == 'true'
            
            if include_inactive:
                query = "SELECT id, name, amount, price, is_active FROM t_p15345778_news_shop_project.shop_items ORDER BY id"
            else:
                query = "SELECT id, name, amount, price, is_active FROM t_p15345778_news_shop_project.shop_items WHERE is_active = true ORDER BY id"
            
            cur.execute(query)
            rows = cur.fetchall()
            
            items = []
            for row in rows:
                items.append({
                    'id': row[0],
                    'name': row[1],
                    'amount': row[2],
                    'price': row[3],
                    'is_active': row[4]
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'items': items})
            }
        
        if method in ['POST', 'PUT', 'DELETE']:
            admin_steam_id = event.get('headers', {}).get('X-Admin-Steam-Id')
            
            if not admin_steam_id:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Admin authentication required'})
                }
            
            escaped_steam_id = admin_steam_id.replace("'", "''")
            cur.execute(f"SELECT COUNT(*) FROM admins WHERE steam_id = '{escaped_steam_id}'")
            is_admin = cur.fetchone()[0] > 0
            
            if not is_admin:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Access denied. Admin rights required'})
                }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name', '').strip()
            amount = body_data.get('amount', '').strip()
            price = body_data.get('price')
            
            if not name or not amount or price is None:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'name, amount, and price are required'})
                }
            
            escaped_name = name.replace("'", "''")
            escaped_amount = amount.replace("'", "''")
            
            cur.execute(f"""
                INSERT INTO t_p15345778_news_shop_project.shop_items (name, amount, price)
                VALUES ('{escaped_name}', '{escaped_amount}', {int(price)})
                RETURNING id, name, amount, price, is_active
            """)
            
            row = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'item': {
                        'id': row[0],
                        'name': row[1],
                        'amount': row[2],
                        'price': row[3],
                        'is_active': row[4]
                    }
                })
            }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            item_id = body_data.get('id')
            name = body_data.get('name', '').strip()
            amount = body_data.get('amount', '').strip()
            price = body_data.get('price')
            is_active = body_data.get('is_active', True)
            
            if not item_id or not name or not amount or price is None:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'id, name, amount, and price are required'})
                }
            
            escaped_name = name.replace("'", "''")
            escaped_amount = amount.replace("'", "''")
            
            cur.execute(f"""
                UPDATE t_p15345778_news_shop_project.shop_items 
                SET name = '{escaped_name}', 
                    amount = '{escaped_amount}', 
                    price = {int(price)},
                    is_active = {is_active},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {int(item_id)}
                RETURNING id, name, amount, price, is_active
            """)
            
            row = cur.fetchone()
            
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Item not found'})
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'item': {
                        'id': row[0],
                        'name': row[1],
                        'amount': row[2],
                        'price': row[3],
                        'is_active': row[4]
                    }
                })
            }
        
        if method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            item_id = params.get('id')
            
            if not item_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'item id required'})
                }
            
            cur.execute(f"DELETE FROM t_p15345778_news_shop_project.shop_items WHERE id = {int(item_id)}")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'Item deleted'})
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
