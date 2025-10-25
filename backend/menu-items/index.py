'''
Business: Manage navigation menu items - get, update visibility, reorder
Args: event - dict with httpMethod (GET/PUT), body for updates
      context - object with request_id
Returns: HTTP response with menu items data
'''

import json
import os
from typing import Dict, Any
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
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
    
    if method == 'GET':
        return get_menu_items(db_url)
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        return update_menu_items(db_url, body_data)
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }

def get_menu_items(db_url: str) -> Dict[str, Any]:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, name, label, route, icon, is_visible, order_position
            FROM t_p15345778_news_shop_project.menu_items
            ORDER BY order_position, id
        """)
        
        rows = cursor.fetchall()
        menu_items = []
        
        for row in rows:
            menu_items.append({
                'id': row[0],
                'name': row[1],
                'label': row[2],
                'route': row[3],
                'icon': row[4],
                'isVisible': row[5],
                'orderPosition': row[6]
            })
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'menuItems': menu_items}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        cursor.close()
        conn.close()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Failed to get menu items: {str(e)}'}),
            'isBase64Encoded': False
        }

def update_menu_items(db_url: str, data: Dict[str, Any]) -> Dict[str, Any]:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    try:
        menu_items = data.get('menuItems', [])
        
        for item in menu_items:
            item_id = int(item['id'])
            is_visible = bool(item['isVisible'])
            order_position = int(item['orderPosition'])
            
            cursor.execute(f"""
                UPDATE t_p15345778_news_shop_project.menu_items
                SET is_visible = {is_visible},
                    order_position = {order_position},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {item_id}
            """)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True, 'message': 'Menu items updated'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Failed to update menu items: {str(e)}'}),
            'isBase64Encoded': False
        }
