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
                    payment_id = payment_obj.get('id', '')
                    payment_metadata = payment_obj.get('metadata', {})
                    internal_payment_id = payment_metadata.get('payment_id')
                    
                    if internal_payment_id:
                        escaped_payment_id = payment_id.replace("'", "''")
                        
                        cur.execute(f"""
                            SELECT steam_id, amount_coins, persona_name
                            FROM t_p15345778_news_shop_project.payments
                            WHERE id = {int(internal_payment_id)}
                        """)
                        
                        payment_row = cur.fetchone()
                        
                        if payment_row:
                            steam_id, amount_coins, persona_name = payment_row
                            escaped_steam_id = steam_id.replace("'", "''")
                            escaped_persona_name = persona_name.replace("'", "''")
                            
                            cur.execute(f"""
                                UPDATE t_p15345778_news_shop_project.payments
                                SET status = 'paid', 
                                    payment_id = '{escaped_payment_id}',
                                    paid_at = CURRENT_TIMESTAMP
                                WHERE id = {int(internal_payment_id)}
                            """)
                            
                            cur.execute(f"""
                                INSERT INTO t_p15345778_news_shop_project.user_balances (steam_id, persona_name, balance)
                                VALUES ('{escaped_steam_id}', '{escaped_persona_name}', {int(amount_coins)})
                                ON CONFLICT (steam_id) 
                                DO UPDATE SET 
                                    balance = t_p15345778_news_shop_project.user_balances.balance + {int(amount_coins)},
                                    updated_at = CURRENT_TIMESTAMP
                            """)
                            
                            cur.execute(f"""
                                INSERT INTO t_p15345778_news_shop_project.balance_transactions 
                                (steam_id, amount, transaction_type, description)
                                VALUES ('{escaped_steam_id}', {int(amount_coins)}, 'deposit', 
                                       'Пополнение баланса на {int(amount_coins)} монет')
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
            coins_amount = int(item_amount.replace(' монет', '').replace(',', ''))
            
            escaped_steam_id = steam_id.replace("'", "''")
            escaped_persona_name = persona_name.replace("'", "''")
            
            cur.execute(f"""
                INSERT INTO t_p15345778_news_shop_project.payments 
                (steam_id, persona_name, amount_rubles, amount_coins, status)
                VALUES ('{escaped_steam_id}', '{escaped_persona_name}', {int(item_price)}, {coins_amount}, 'pending')
                RETURNING id
            """)
            
            payment_db_id = cur.fetchone()[0]
            conn.commit()
            
            idempotence_key = str(uuid.uuid4())
            payment_url = f"https://yookassa.ru/checkout?amount={item_price}&description={item_name}&metadata={{payment_id:{payment_db_id}}}&idempotence_key={idempotence_key}"
            
            cur.execute(f"""
                UPDATE t_p15345778_news_shop_project.payments
                SET payment_url = '{payment_url.replace("'", "''")}'
                WHERE id = {int(payment_db_id)}
            """)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'payment_id': payment_db_id,
                    'payment_url': payment_url,
                    'amount': item_price,
                    'coins': coins_amount,
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