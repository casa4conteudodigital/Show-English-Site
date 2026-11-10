import base64
import json
from uuid import UUID
from fastapi import HTTPException
from fastapi.testclient import TestClient
from backend import main

client = TestClient(main.app)
ROOM = 'f4f426b2-20a3-4c4f-96cb-63706ba7dc55'


def test_no_session_is_rejected():
    assert client.get('/rooms').status_code == 401
    assert client.post('/rooms/token', json={'room_id': ROOM}).status_code == 401


def test_invalid_session_is_rejected(monkeypatch):
    async def invalid(*args, **kwargs):
        raise HTTPException(401, 'Invalid')
    monkeypatch.setattr(main, 'supabase_get', invalid)
    assert client.get('/rooms', headers={'Authorization': 'Bearer invalid'}).status_code == 401


def setup_user(monkeypatch, role='teacher', allowed=True):
    async def fake(path, token, params=None):
        assert token == 'user-jwt'
        if path == '/auth/v1/user':
            return {'id': 'user-id'}
        if path == '/rest/v1/profiles':
            return [{'role': role}] if role else []
        assert params.get('active') == 'eq.true'
        return [{'id': ROOM}] if allowed else []
    monkeypatch.setattr(main, 'supabase_get', fake)


def test_non_staff_is_rejected(monkeypatch):
    setup_user(monkeypatch, role=None)
    assert client.get('/rooms', headers={'Authorization': 'Bearer user-jwt'}).status_code == 403


def test_unassigned_room_is_rejected(monkeypatch):
    setup_user(monkeypatch, allowed=False)
    assert client.post('/rooms/token', headers={'Authorization': 'Bearer user-jwt'}, json={'room_id': ROOM}).status_code == 403


def test_token_grants_are_server_owned(monkeypatch):
    setup_user(monkeypatch)
    monkeypatch.setenv('LIVEKIT_API_KEY', 'test-key')
    monkeypatch.setenv('LIVEKIT_API_SECRET', 'test-secret-at-least-thirty-two-bytes-long')
    monkeypatch.setenv('LIVEKIT_URL', 'wss://example.test')
    result = client.post('/rooms/token', headers={'Authorization': 'Bearer user-jwt'}, json={'room_id': ROOM, 'identity': 'attacker', 'role': 'admin'})
    assert result.status_code == 200
    assert result.headers['cache-control'] == 'no-store'
    token = result.json()['token']
    claims = json.loads(base64.urlsafe_b64decode(token.split('.')[1] + '=='))
    assert claims['sub'] == 'user-id'
    assert claims['video']['room'] == f'show-{ROOM}'
    assert claims['video']['roomJoin'] is True
    assert not claims['video'].get('roomAdmin')
    assert claims['exp'] - claims['nbf'] == 600


def test_invalid_room_id(monkeypatch):
    setup_user(monkeypatch)
    assert client.post('/rooms/token', headers={'Authorization': 'Bearer user-jwt'}, json={'room_id': 'anything'}).status_code == 422
