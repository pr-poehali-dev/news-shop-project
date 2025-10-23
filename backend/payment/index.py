'''
Business: Handle balance top-up payments - create payment link and process webhooks
Args: event with httpMethod, body for payment creation or webhook data
Returns: Payment URL or webhook confirmation
'''

import json
import os
import uuid
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            
            # Check if this is a webhook from payment system
            is_webhook = body_data.get('event')
            
            if is_webhook:
                return handle_payment_webhook(body_data, cur, conn)
            
            # Otherwise create new payment
            return create_payment(body_data, cur, conn)
        
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

def create_payment(body_data: Dict[str, Any], cur, conn) -> Dict[str, Any]:
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
    
    # Get shop item details
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
            'body': json.dumps({'error': 'Shop item not found'})
        }
    
    item_name, item_amount, item_price = item
    
    # Extract coins from amount string (e.g., "500 монет" -> 500)
    coins = int(''.join(filter(str.isdigit, item_amount)))
    
    # Generate unique payment ID
    payment_id = str(uuid.uuid4())
    
    # Create payment URL (placeholder for real payment system)
    payment_url = f"https://yookassa.ru/checkout/payments/{payment_id}"
    
    escaped_steam_id = steam_id.replace("'", "''")
    escaped_persona_name = persona_name.replace("'", "''")
    escaped_payment_id = payment_id.replace("'", "''")
    escaped_payment_url = payment_url.replace("'", "''")
    
    # Save payment to database
    cur.execute(f"""
        INSERT INTO t_p15345778_news_shop_project.payments 
        (steam_id, persona_name, amount_rubles, amount_coins, status, payment_id, payment_url)
        VALUES ('{escaped_steam_id}', '{escaped_persona_name}', {int(item_price)}, {int(coins)}, 'pending', '{escaped_payment_id}', '{escaped_payment_url}')
        RETURNING id
    """)
    
    payment_db_id = cur.fetchone()[0]
    conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'payment_id': payment_id,
            'payment_url': payment_url,
            'amount': item_price,
            'coins': coins
        })
    }

def handle_payment_webhook(body_data: Dict[str, Any], cur, conn) -> Dict[str, Any]:
    event_type = body_data.get('event')
    
    if event_type != 'payment.succeeded':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'status': 'ignored'})
        }
    
    payment_obj = body_data.get('object', {})
    payment_id = payment_obj.get('id', '')
    
    if not payment_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Missing payment_id'})
        }
    
    escaped_payment_id = payment_id.replace("'", "''")
    
    # Get payment details
    cur.execute(f"""
        SELECT id, steam_id, persona_name, amount_coins, status 
        FROM t_p15345778_news_shop_project.payments 
        WHERE payment_id = '{escaped_payment_id}'
    """)
    
    payment = cur.fetchone()
    
    if not payment:
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Payment not found'})
        }
    
    payment_db_id, steam_id, persona_name, amount_coins, current_status = payment
    
    # Skip if already processed
    if current_status == 'completed':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'status': 'already_processed'})
        }
    
    # Update payment status
    cur.execute(f"""
        UPDATE t_p15345778_news_shop_project.payments 
        SET status = 'completed', paid_at = CURRENT_TIMESTAMP 
        WHERE payment_id = '{escaped_payment_id}'
    """)
    
    escaped_steam_id = steam_id.replace("'", "''")
    escaped_persona_name = persona_name.replace("'", "''")
    
    # Add coins to user balance
    cur.execute(f"""
        INSERT INTO t_p15345778_news_shop_project.user_balances (steam_id, persona_name, balance)
        VALUES ('{escaped_steam_id}', '{escaped_persona_name}', {int(amount_coins)})
        ON CONFLICT (steam_id) 
        DO UPDATE SET balance = t_p15345778_news_shop_project.user_balances.balance + {int(amount_coins)},
                      updated_at = CURRENT_TIMESTAMP
    """)
    
    # Record transaction
    cur.execute(f"""
        INSERT INTO t_p15345778_news_shop_project.balance_transactions 
        (steam_id, persona_name, amount, transaction_type, description)
        VALUES ('{escaped_steam_id}', '{escaped_persona_name}', {int(amount_coins)}, 'top_up', 'Payment #{escaped_payment_id}')
    """)
    
    conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'status': 'success', 'coins_added': amount_coins})
    }
