'''
Business: Handle user purchases and retrieve purchase history
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with request_id
Returns: HTTP response with purchase data or confirmation
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Steam-Id',
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
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        steam_id = body_data.get('steamId')
        persona_name = body_data.get('personaName')
        product_id = body_data.get('productId')
        product_name = body_data.get('productName')
        amount = body_data.get('amount')
        price = body_data.get('price')
        
        if not all([steam_id, persona_name, product_id, product_name, amount, price]):
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO purchases (steam_id, persona_name, product_id, product_name, amount, price) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (steam_id, persona_name, product_id, product_name, amount, price)
        )
        purchase_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'purchaseId': purchase_id,
                'message': 'Purchase successful'
            }),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        steam_id = params.get('steamId')
        
        if not steam_id:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'steamId required'}),
                'isBase64Encoded': False
            }
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            "SELECT id, product_id, product_name, amount, price, purchased_at FROM purchases WHERE steam_id = %s ORDER BY purchased_at DESC",
            (steam_id,)
        )
        purchases = cursor.fetchall()
        cursor.close()
        conn.close()
        
        purchases_list = []
        for purchase in purchases:
            purchases_list.append({
                'id': purchase['id'],
                'productId': purchase['product_id'],
                'productName': purchase['product_name'],
                'amount': purchase['amount'],
                'price': purchase['price'],
                'purchasedAt': purchase['purchased_at'].isoformat() if purchase['purchased_at'] else None
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'purchases': purchases_list}),
            'isBase64Encoded': False
        }
    
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
