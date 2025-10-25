import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Check if Steam user is admin
    Args: event with queryStringParameters.steam_id
    Returns: HTTP response with isAdmin boolean
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters') or {}
    steam_id = params.get('steam_id')
    
    if not steam_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'steam_id required', 'isAdmin': False})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        with conn.cursor() as cur:
            # Escape single quotes for simple query protocol
            escaped_steam_id = steam_id.replace("'", "''")
            query = f"SELECT COALESCE(is_admin, false) FROM t_p15345778_news_shop_project.users WHERE steam_id = '{escaped_steam_id}'"
            
            print(f"Checking admin for steam_id: {steam_id}")
            print(f"Query: {query}")
            
            cur.execute(query)
            result = cur.fetchone()
            is_admin = result[0] if result else False
            
            print(f"Result is_admin: {is_admin}")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'isAdmin': is_admin, 'steam_id': steam_id}),
                'isBase64Encoded': False
            }
    
    finally:
        conn.close()