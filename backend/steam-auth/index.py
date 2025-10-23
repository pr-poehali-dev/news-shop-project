'''
Business: Steam OAuth authentication handler
Args: event - dict with httpMethod, queryStringParameters
      context - object with request_id
Returns: HTTP response with redirect URL or user data
'''

import json
import os
import re
from typing import Dict, Any
from urllib.parse import urlencode
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor

STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login'

def register_or_update_user(user_data: Dict[str, str]) -> None:
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return
    
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        escaped_steam_id = user_data['steamId'].replace("'", "''")
        escaped_persona_name = user_data['personaName'].replace("'", "''")
        escaped_avatar_url = user_data['avatarUrl'].replace("'", "''")
        escaped_profile_url = user_data['profileUrl'].replace("'", "''")
        
        cursor.execute(f"""
            INSERT INTO t_p15345778_news_shop_project.users 
            (steam_id, persona_name, avatar_url, profile_url, last_login)
            VALUES ('{escaped_steam_id}', '{escaped_persona_name}', '{escaped_avatar_url}', '{escaped_profile_url}', NOW())
            ON CONFLICT (steam_id) 
            DO UPDATE SET 
                persona_name = EXCLUDED.persona_name,
                avatar_url = EXCLUDED.avatar_url,
                profile_url = EXCLUDED.profile_url,
                last_login = NOW(),
                updated_at = NOW()
        """)
        
        conn.commit()
    except Exception as e:
        print(f"Failed to register/update user: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        mode = params.get('mode', '')
        
        if mode == 'login':
            return_url = params.get('return_url', '')
            realm = return_url.split('?')[0] if '?' in return_url else return_url
            
            openid_params = {
                'openid.ns': 'http://specs.openid.net/auth/2.0',
                'openid.mode': 'checkid_setup',
                'openid.return_to': return_url,
                'openid.realm': realm,
                'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
                'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
            }
            
            redirect_url = f"{STEAM_OPENID_URL}?{urlencode(openid_params)}"
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'redirectUrl': redirect_url}),
                'isBase64Encoded': False
            }
        
        if mode == 'verify':
            claimed_id = params.get('openid.claimed_id', '')
            match = re.search(r'/id/(\d+)$', claimed_id)
            
            if not match:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Invalid Steam ID'}),
                    'isBase64Encoded': False
                }
            
            steam_id = match.group(1)
            api_key = os.environ.get('STEAM_API_KEY')
            
            if not api_key:
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Steam API key not configured'}),
                    'isBase64Encoded': False
                }
            
            user_info_url = f"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={api_key}&steamids={steam_id}"
            
            with urllib.request.urlopen(user_info_url) as response:
                data = json.loads(response.read())
            
            players = data.get('response', {}).get('players', [])
            if not players:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            player = players[0]
            user_data = {
                'steamId': player['steamid'],
                'personaName': player['personaname'],
                'avatarUrl': player['avatarfull'],
                'profileUrl': player['profileurl']
            }
            
            register_or_update_user(user_data)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(user_data),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }