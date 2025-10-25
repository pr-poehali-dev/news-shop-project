'''
Business: Query game servers via Source Query Protocol and update their status
Args: event - dict with httpMethod, queryStringParameters for server_id
      context - object with request_id
Returns: HTTP response with server status information
'''

import json
import os
import socket
import struct
from typing import Dict, Any, Tuple, Optional
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
        params = event.get('queryStringParameters', {})
        server_id = params.get('server_id')
        
        if server_id:
            return query_single_server(int(server_id), db_url)
        else:
            return query_all_servers(db_url)
    
    if method == 'POST':
        return query_all_servers(db_url)
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }

def query_source_server(ip: str, port: int, timeout: int = 3) -> Optional[Dict[str, Any]]:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(timeout)
        
        # A2S_INFO request packet
        request = b'\xFF\xFF\xFF\xFFTSource Engine Query\x00'
        
        sock.sendto(request, (ip, port))
        data, _ = sock.recvfrom(4096)
        sock.close()
        
        # Parse response
        if len(data) < 6:
            return None
        
        # Check for challenge response (0x41 = 'A')
        if data[4:5] == b'A':
            # This is a challenge response, we need to send another request with the challenge number
            challenge = data[5:9]
            request_with_challenge = b'\xFF\xFF\xFF\xFFTSource Engine Query\x00' + challenge
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(timeout)
            sock.sendto(request_with_challenge, (ip, port))
            data, _ = sock.recvfrom(4096)
            sock.close()
        
        # Skip header (4 bytes FF FF FF FF) and type (1 byte)
        offset = 5
        
        # Read protocol version
        protocol = data[offset]
        offset += 1
        
        # Read server name (null-terminated string)
        name_end = data.find(b'\x00', offset)
        server_name = data[offset:name_end].decode('utf-8', errors='ignore')
        offset = name_end + 1
        
        # Read map (null-terminated string)
        map_end = data.find(b'\x00', offset)
        map_name = data[offset:map_end].decode('utf-8', errors='ignore')
        offset = map_end + 1
        
        # Read folder (null-terminated string)
        folder_end = data.find(b'\x00', offset)
        offset = folder_end + 1
        
        # Read game (null-terminated string)
        game_end = data.find(b'\x00', offset)
        game_name = data[offset:game_end].decode('utf-8', errors='ignore')
        offset = game_end + 1
        
        # Read ID (2 bytes, little-endian)
        if offset + 2 > len(data):
            return None
        app_id = struct.unpack('<H', data[offset:offset+2])[0]
        offset += 2
        
        # Read players and max players
        if offset + 2 <= len(data):
            players = data[offset]
            max_players = data[offset + 1]
            
            print(f'Server query successful: {ip}:{port} - Map: {map_name}, Players: {players}/{max_players}')
            
            return {
                'status': 'online',
                'players': players,
                'max_players': max_players,
                'map': map_name,
                'game': game_name
            }
        
        return None
        
    except socket.timeout:
        return {'status': 'offline', 'error': 'timeout'}
    except Exception as e:
        return {'status': 'offline', 'error': str(e)}

def query_single_server(server_id: int, db_url: str) -> Dict[str, Any]:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    try:
        # Get server details
        cursor.execute(f"""
            SELECT id, name, ip_address, port, game_type, map, max_players, current_players
            FROM t_p15345778_news_shop_project.servers
            WHERE id = {int(server_id)} AND is_active = true
        """)
        
        server = cursor.fetchone()
        
        if not server:
            cursor.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Server not found'}),
                'isBase64Encoded': False
            }
        
        server_id, name, ip_address, port, game_type, map_name, max_players, current_players = server
        
        # Query server status
        query_result = query_source_server(ip_address, port)
        
        if query_result and query_result['status'] == 'online':
            # Update server status in database
            cursor.execute(f"""
                UPDATE t_p15345778_news_shop_project.servers
                SET status = 'online',
                    current_players = {int(query_result['players'])},
                    max_players = {int(query_result['max_players'])},
                    map = '{query_result['map'].replace("'", "''")}',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {int(server_id)}
            """)
            conn.commit()
            
            result = {
                'id': server_id,
                'name': name,
                'ipAddress': ip_address,
                'port': port,
                'status': 'online',
                'currentPlayers': query_result['players'],
                'maxPlayers': query_result['max_players'],
                'map': query_result['map']
            }
        else:
            # Mark server as offline
            cursor.execute(f"""
                UPDATE t_p15345778_news_shop_project.servers
                SET status = 'offline', updated_at = CURRENT_TIMESTAMP
                WHERE id = {int(server_id)}
            """)
            conn.commit()
            
            result = {
                'id': server_id,
                'name': name,
                'ipAddress': ip_address,
                'port': port,
                'status': 'offline',
                'currentPlayers': 0,
                'maxPlayers': max_players
            }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'server': result}),
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
            'body': json.dumps({'error': f'Query failed: {str(e)}'}),
            'isBase64Encoded': False
        }

def query_all_servers(db_url: str) -> Dict[str, Any]:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    try:
        # Get all active servers
        cursor.execute("""
            SELECT id, name, ip_address, port, game_type, map, max_players
            FROM t_p15345778_news_shop_project.servers
            WHERE is_active = true
            ORDER BY order_position, id
        """)
        
        servers = cursor.fetchall()
        results = []
        
        for server in servers:
            server_id, name, ip_address, port, game_type, map_name, max_players = server
            
            # Query server status
            query_result = query_source_server(ip_address, port)
            
            if query_result and query_result['status'] == 'online':
                # Update server status in database
                cursor.execute(f"""
                    UPDATE t_p15345778_news_shop_project.servers
                    SET status = 'online',
                        current_players = {int(query_result['players'])},
                        max_players = {int(query_result['max_players'])},
                        map = '{query_result['map'].replace("'", "''")}',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = {int(server_id)}
                """)
                
                results.append({
                    'id': server_id,
                    'name': name,
                    'ipAddress': ip_address,
                    'port': port,
                    'gameType': game_type,
                    'status': 'online',
                    'currentPlayers': query_result['players'],
                    'maxPlayers': query_result['max_players'],
                    'map': query_result['map']
                })
            else:
                # Mark server as offline
                cursor.execute(f"""
                    UPDATE t_p15345778_news_shop_project.servers
                    SET status = 'offline',
                        current_players = 0,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = {int(server_id)}
                """)
                
                results.append({
                    'id': server_id,
                    'name': name,
                    'ipAddress': ip_address,
                    'port': port,
                    'gameType': game_type,
                    'status': 'offline',
                    'currentPlayers': 0,
                    'maxPlayers': max_players
                })
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'servers': results}),
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
            'body': json.dumps({'error': f'Query failed: {str(e)}'}),
            'isBase64Encoded': False
        }