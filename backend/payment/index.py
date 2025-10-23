import json
import os
import uuid
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Handle payment operations - create payment link and process webhook
    Args: event with httpMethod, body for payment creation
    Returns: Payment URL or webhook confirmation
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Steam-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            is_webhook = body_data.get('event')
            
            if is_webhook:
                event_type = body_data.get('event')
                
                if event_type == 'payment.succeeded':
                    payment_obj = body_data.get('object', {})
                    payment_id = payment_obj.get('id')
                    order_id = payment_obj.get('metadata', {}).get('order_id')
                    
                    if order_id and payment_id:
                        cur.execute(f"""
                            UPDATE t_p15345778_news_shop_project.orders
                            SET status = 'paid', 
                                payment_id = '{payment_id.replace("'", "''")}',
                                paid_at = CURRENT_TIMESTAMP
                            WHERE id = {int(order_id)}
                        """)
                        conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'status': 'ok'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'status': 'ignored'})
                }
            
            steam_id = body_data.get('steam_id', '').strip()
            persona_name = body_data.get('persona_name', '').strip()
            shop_item_id = body_data.get('shop_item_id')
            
            if not steam_id or not shop_item_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'steam_id and shop_item_id required'})
                }
            
            cur.execute(f"""
                SELECT name, amount, price 
                FROM t_p15345778_news_shop_project.shop_items 
                WHERE id = {int(shop_item_id)} AND is_active = true
            """)
            
            item = cur.fetchone()
            
            if not item:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Shop item not found or inactive'})
                }
            
            item_name, item_amount, item_price = item
            
            escaped_steam_id = steam_id.replace("'", "''")
            escaped_persona_name = persona_name.replace("'", "''")
            
            cur.execute(f"""
                INSERT INTO t_p15345778_news_shop_project.orders 
                (steam_id, persona_name, shop_item_id, amount, price, status)
                VALUES ('{escaped_steam_id}', '{escaped_persona_name}', {int(shop_item_id)}, 1, {int(item_price)}, 'pending')
                RETURNING id
            """)
            
            order_id = cur.fetchone()[0]
            conn.commit()
            
            payment_url = f"https://example.com/pay?order={order_id}&amount={item_price}"
            
            cur.execute(f"""
                UPDATE t_p15345778_news_shop_project.orders
                SET payment_url = '{payment_url.replace("'", "''")}'
                WHERE id = {int(order_id)}
            """)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'order_id': order_id,
                    'payment_url': payment_url,
                    'amount': item_price,
                    'description': f'{item_name} - {item_amount}'
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
