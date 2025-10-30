'''
Business: Battle.net OAuth authentication and account linking handler
Args: event - dict with httpMethod, queryStringParameters, body
      context - object with request_id
Returns: HTTP response with redirect URL, user data, or linking result
'''

import json
import os
import base64
from typing import Dict, Any, Optional
from urllib.parse import urlencode
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor

BATTLENET_AUTH_URL = 'https://oauth.battle.net/authorize'
BATTLENET_TOKEN_URL = 'https://oauth.battle.net/token'
BATTLENET_USER_INFO_URL = 'https://oauth.battle.net/userinfo'

def get_user_by_steam_id(steam_id: str) -> Optional[Dict[str, Any]]:
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return None
    
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        escaped_steam_id = steam_id.replace("'", "''")
        cursor.execute(f"""
            SELECT * FROM t_p15345778_news_shop_project.users 
            WHERE steam_id = '{escaped_steam_id}'
        """)
        result = cursor.fetchone()
        return dict(result) if result else None
    finally:
        cursor.close()
        conn.close()

def get_user_by_battlenet_id(battlenet_id: str) -> Optional[Dict[str, Any]]:
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return None
    
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        escaped_battlenet_id = battlenet_id.replace("'", "''")
        cursor.execute(f"""
            SELECT * FROM t_p15345778_news_shop_project.users 
            WHERE battlenet_id = '{escaped_battlenet_id}'
        """)
        result = cursor.fetchone()
        return dict(result) if result else None
    finally:
        cursor.close()
        conn.close()

def register_or_update_battlenet_user(battlenet_id: str, battletag: str) -> Dict[str, Any]:
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise Exception('DATABASE_URL not configured')
    
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        escaped_battlenet_id = battlenet_id.replace("'", "''")
        escaped_battletag = battletag.replace("'", "''")
        
        cursor.execute(f"""
            INSERT INTO t_p15345778_news_shop_project.users 
            (battlenet_id, battlenet_battletag, persona_name, primary_auth_provider, last_login)
            VALUES ('{escaped_battlenet_id}', '{escaped_battletag}', '{escaped_battletag}', 'battlenet', NOW())
            ON CONFLICT (battlenet_id) 
            DO UPDATE SET 
                battlenet_battletag = EXCLUDED.battlenet_battletag,
                persona_name = EXCLUDED.persona_name,
                last_login = NOW(),
                updated_at = NOW()
            RETURNING *
        """)
        
        result = cursor.fetchone()
        conn.commit()
        return dict(result)
    finally:
        cursor.close()
        conn.close()

def link_battlenet_to_steam(steam_id: str, battlenet_id: str, battletag: str) -> bool:
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return False
    
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    try:
        escaped_steam_id = steam_id.replace("'", "''")
        escaped_battlenet_id = battlenet_id.replace("'", "''")
        escaped_battletag = battletag.replace("'", "''")
        
        cursor.execute(f"""
            UPDATE t_p15345778_news_shop_project.users 
            SET battlenet_id = '{escaped_battlenet_id}',
                battlenet_battletag = '{escaped_battletag}',
                updated_at = NOW()
            WHERE steam_id = '{escaped_steam_id}'
        """)
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Failed to link Battle.net to Steam: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def link_steam_to_battlenet(battlenet_id: str, steam_id: str, persona_name: str, avatar_url: str, profile_url: str) -> bool:
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return False
    
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    try:
        escaped_battlenet_id = battlenet_id.replace("'", "''")
        escaped_steam_id = steam_id.replace("'", "''")
        escaped_persona_name = persona_name.replace("'", "''")
        escaped_avatar_url = avatar_url.replace("'", "''")
        escaped_profile_url = profile_url.replace("'", "''")
        
        cursor.execute(f"""
            UPDATE t_p15345778_news_shop_project.users 
            SET steam_id = '{escaped_steam_id}',
                persona_name = '{escaped_persona_name}',
                avatar_url = '{escaped_avatar_url}',
                profile_url = '{escaped_profile_url}',
                updated_at = NOW()
            WHERE battlenet_id = '{escaped_battlenet_id}'
        """)
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Failed to link Steam to Battle.net: {e}")
        conn.rollback()
        return False
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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Steam-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        mode = params.get('mode', '')
        
        # Step 1: Generate Battle.net OAuth URL
        if mode == 'login':
            client_id = os.environ.get('BATTLENET_CLIENT_ID')
            redirect_uri = params.get('redirect_uri', '')
            
            if not client_id:
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Battle.net client ID not configured'}),
                    'isBase64Encoded': False
                }
            
            oauth_params = {
                'client_id': client_id,
                'redirect_uri': redirect_uri,
                'response_type': 'code',
                'scope': 'openid'
            }
            
            auth_url = f"{BATTLENET_AUTH_URL}?{urlencode(oauth_params)}"
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'authUrl': auth_url}),
                'isBase64Encoded': False
            }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', '')
        
        # Step 2: Exchange code for token and get user info
        if action == 'callback':
            code = body_data.get('code', '')
            redirect_uri = body_data.get('redirect_uri', '')
            link_steam_id = body_data.get('link_steam_id')
            
            client_id = os.environ.get('BATTLENET_CLIENT_ID')
            client_secret = os.environ.get('BATTLENET_CLIENT_SECRET')
            
            if not client_id or not client_secret:
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Battle.net credentials not configured'}),
                    'isBase64Encoded': False
                }
            
            # Get access token
            token_data = urlencode({
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri
            }).encode()
            
            credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
            token_request = urllib.request.Request(
                BATTLENET_TOKEN_URL,
                data=token_data,
                headers={
                    'Authorization': f'Basic {credentials}',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            )
            
            try:
                with urllib.request.urlopen(token_request) as response:
                    token_response = json.loads(response.read())
                
                access_token = token_response.get('access_token')
                
                # Get user info
                user_info_request = urllib.request.Request(
                    BATTLENET_USER_INFO_URL,
                    headers={'Authorization': f'Bearer {access_token}'}
                )
                
                with urllib.request.urlopen(user_info_request) as response:
                    user_info = json.loads(response.read())
                
                battlenet_id = str(user_info.get('id'))
                battletag = user_info.get('battletag', 'Unknown')
                
                # If linking to existing Steam account
                if link_steam_id:
                    existing_user = get_user_by_steam_id(link_steam_id)
                    if not existing_user:
                        return {
                            'statusCode': 404,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Steam user not found'}),
                            'isBase64Encoded': False
                        }
                    
                    # Check if Battle.net already linked to another account
                    existing_battlenet = get_user_by_battlenet_id(battlenet_id)
                    if existing_battlenet and existing_battlenet['steam_id'] != link_steam_id:
                        return {
                            'statusCode': 409,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Battle.net account already linked to another user'}),
                            'isBase64Encoded': False
                        }
                    
                    link_battlenet_to_steam(link_steam_id, battlenet_id, battletag)
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'message': 'Battle.net account linked successfully',
                            'battlenetId': battlenet_id,
                            'battletag': battletag
                        }),
                        'isBase64Encoded': False
                    }
                
                # Regular login or registration
                user = register_or_update_battlenet_user(battlenet_id, battletag)
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'battlenetId': battlenet_id,
                        'battletag': battletag,
                        'steamId': user.get('steam_id'),
                        'personaName': user.get('persona_name'),
                        'avatarUrl': user.get('avatar_url'),
                        'profileUrl': user.get('profile_url')
                    }),
                    'isBase64Encoded': False
                }
                
            except Exception as e:
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': f'Authentication failed: {str(e)}'}),
                    'isBase64Encoded': False
                }
        
        # Link Steam to existing Battle.net account
        if action == 'link_steam':
            battlenet_id = body_data.get('battlenet_id', '')
            steam_data = body_data.get('steam_data', {})
            
            existing_user = get_user_by_battlenet_id(battlenet_id)
            if not existing_user:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Battle.net user not found'}),
                    'isBase64Encoded': False
                }
            
            # Check if Steam already linked to another account
            steam_id = steam_data.get('steamId', '')
            existing_steam = get_user_by_steam_id(steam_id)
            if existing_steam and existing_steam.get('battlenet_id') and existing_steam['battlenet_id'] != battlenet_id:
                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Steam account already linked to another user'}),
                    'isBase64Encoded': False
                }
            
            success = link_steam_to_battlenet(
                battlenet_id,
                steam_id,
                steam_data.get('personaName', ''),
                steam_data.get('avatarUrl', ''),
                steam_data.get('profileUrl', '')
            )
            
            if success:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'message': 'Steam account linked successfully'
                    }),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Failed to link Steam account'}),
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
