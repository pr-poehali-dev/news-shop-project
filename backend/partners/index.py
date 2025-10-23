'''
Business: Manage partners - list, create, update, delete for admin panel
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with request_id
Returns: HTTP response with partners data or operation confirmation
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
    
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            return get_partners(event, cursor)
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            return create_partner(body_data, cursor, conn)
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            return update_partner(body_data, cursor, conn)
        elif method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            return delete_partner(body_data, cursor, conn)
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()

def get_partners(event: Dict[str, Any], cursor) -> Dict[str, Any]:
    params = event.get('queryStringParameters') or {}
    include_inactive = params.get('include_inactive') == 'true'
    
    if include_inactive:
        cursor.execute("""
            SELECT id, name, description, logo, website, category, is_active, order_position
            FROM partners
            ORDER BY order_position ASC, id DESC
        """)
    else:
        cursor.execute("""
            SELECT id, name, description, logo, website, category, is_active, order_position
            FROM partners
            WHERE is_active = true
            ORDER BY order_position ASC, id DESC
        """)
    
    partners = cursor.fetchall()
    
    partners_list = []
    for partner in partners:
        partners_list.append({
            'id': partner['id'],
            'name': partner['name'],
            'description': partner['description'],
            'logo': partner['logo'],
            'website': partner['website'],
            'category': partner['category'],
            'isActive': partner['is_active'],
            'orderPosition': partner['order_position']
        })
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'partners': partners_list}),
        'isBase64Encoded': False
    }

def create_partner(body_data: Dict[str, Any], cursor, conn) -> Dict[str, Any]:
    name = body_data.get('name', '').strip()
    description = body_data.get('description', '').strip()
    logo = body_data.get('logo', '🤝').strip()
    website = body_data.get('website', '').strip()
    category = body_data.get('category', 'Общее').strip()
    
    if not name or not description or not website:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Name, description and website are required'}),
            'isBase64Encoded': False
        }
    
    escaped_name = name.replace("'", "''")
    escaped_description = description.replace("'", "''")
    escaped_logo = logo.replace("'", "''")
    escaped_website = website.replace("'", "''")
    escaped_category = category.replace("'", "''")
    
    cursor.execute(f"""
        INSERT INTO partners (name, description, logo, website, category, is_active, order_position)
        VALUES ('{escaped_name}', '{escaped_description}', '{escaped_logo}', '{escaped_website}', '{escaped_category}', true, 0)
        RETURNING id
    """)
    
    result = cursor.fetchone()
    conn.commit()
    
    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'success': True, 'id': result['id']}),
        'isBase64Encoded': False
    }

def update_partner(body_data: Dict[str, Any], cursor, conn) -> Dict[str, Any]:
    partner_id = body_data.get('id')
    
    if not partner_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Partner ID required'}),
            'isBase64Encoded': False
        }
    
    updates = []
    
    if 'name' in body_data:
        escaped_name = body_data['name'].replace("'", "''")
        updates.append(f"name = '{escaped_name}'")
    
    if 'description' in body_data:
        escaped_description = body_data['description'].replace("'", "''")
        updates.append(f"description = '{escaped_description}'")
    
    if 'logo' in body_data:
        escaped_logo = body_data['logo'].replace("'", "''")
        updates.append(f"logo = '{escaped_logo}'")
    
    if 'website' in body_data:
        escaped_website = body_data['website'].replace("'", "''")
        updates.append(f"website = '{escaped_website}'")
    
    if 'category' in body_data:
        escaped_category = body_data['category'].replace("'", "''")
        updates.append(f"category = '{escaped_category}'")
    
    if 'isActive' in body_data:
        is_active = 'true' if body_data['isActive'] else 'false'
        updates.append(f"is_active = {is_active}")
    
    if 'orderPosition' in body_data:
        updates.append(f"order_position = {int(body_data['orderPosition'])}")
    
    if not updates:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    cursor.execute(f"""
        UPDATE partners
        SET {', '.join(updates)}
        WHERE id = {int(partner_id)}
        RETURNING id
    """)
    
    result = cursor.fetchone()
    
    if not result:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Partner not found'}),
            'isBase64Encoded': False
        }
    
    conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }

def delete_partner(body_data: Dict[str, Any], cursor, conn) -> Dict[str, Any]:
    partner_id = body_data.get('id')
    
    if not partner_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Partner ID required'}),
            'isBase64Encoded': False
        }
    
    cursor.execute(f"""
        DELETE FROM partners WHERE id = {int(partner_id)}
        RETURNING id
    """)
    
    result = cursor.fetchone()
    
    if not result:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Partner not found'}),
            'isBase64Encoded': False
        }
    
    conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }
