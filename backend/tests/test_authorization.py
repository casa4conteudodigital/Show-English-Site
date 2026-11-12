import base64
import json
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import HTTPException
from fastapi.testclient import TestClient
from backend import main

client = TestClient(main.app)
ROOM = "f4f426b2-20a3-4c4f-96cb-63706ba7dc55"
CONNECTION = str(uuid4())
CLASSROOM = {
    "id": ROOM,
    "title": "Conversation",
    "description": None,
    "owner_id": "user-id",
    "livekit_room_name": "se-0123456789abcdef0123456789abcdef",
    "access_mode": "members_only",
    "lifecycle_status": "open",
    "scheduled_start": None,
}


def setup_user(monkeypatch, roles=("teacher",), confirmed=True):
    async def fake_get(path, token, params=None):
        assert token == "user-jwt"
        if path == "/auth/v1/user":
            user = {"id": "user-id", "email": "teacher@example.test"}
            if confirmed:
                user["email_confirmed_at"] = "2026-01-01T00:00:00Z"
            return user
        if path == "/rest/v1/profiles":
            return [{"display_name": "Teacher"}]
        if path == "/rest/v1/user_roles":
            return [{"role": role} for role in roles]
        if path == "/rest/v1/classrooms":
            return [CLASSROOM]
        raise AssertionError(path)

    monkeypatch.setattr(main, "supabase_get", fake_get)


def mock_rpc(monkeypatch, result=None):
    calls = []

    async def fake_rpc(name, body, token=None, *, service=False):
        calls.append((name, body, token, service))
        if name == "join_classroom":
            return [result or CLASSROOM]
        if name == "open_classroom_session":
            return [{"id": "session-id"}]
        if name == "consume_classroom_token_rate":
            return True
        if name == "create_classroom":
            return [result or CLASSROOM]
        if name == "close_classroom":
            return [result or CLASSROOM]
        return True

    monkeypatch.setattr(main, "supabase_rpc", fake_rpc)
    return calls


def test_missing_or_unconfirmed_session_is_rejected(monkeypatch):
    assert client.get("/api/rooms").status_code == 401
    setup_user(monkeypatch, confirmed=False)
    assert client.get("/api/rooms", headers={"Authorization": "Bearer user-jwt"}).status_code == 401


def test_only_authorized_staff_can_create_classrooms(monkeypatch):
    setup_user(monkeypatch, roles=("student",))
    mock_rpc(monkeypatch)
    response = client.post("/api/rooms", headers={"Authorization": "Bearer user-jwt"}, json={"title": "Class"})
    assert response.status_code == 403


def test_only_admins_can_invite_teachers(monkeypatch):
    setup_user(monkeypatch, roles=("student",))

    async def unexpected_invite(email, display_name):
        raise AssertionError("non-admin invite reached Supabase")

    monkeypatch.setattr(main, "supabase_admin_invite", unexpected_invite)
    response = client.post(
        "/api/admin/teachers/invite",
        headers={"Authorization": "Bearer user-jwt"},
        json={"email": "new.teacher@example.test", "display_name": "New Teacher"},
    )
    assert response.status_code == 403


def test_admin_invite_creates_teacher_access(monkeypatch):
    setup_user(monkeypatch, roles=("admin",))
    calls = []

    async def fake_invite(email, display_name):
        calls.append(("invite", email, display_name))
        return {"id": "new-user-id"}

    async def fake_grant(user_id):
        calls.append(("grant", user_id))

    monkeypatch.setattr(main, "supabase_admin_invite", fake_invite)
    monkeypatch.setattr(main, "supabase_grant_teacher", fake_grant)
    response = client.post(
        "/api/admin/teachers/invite",
        headers={"Authorization": "Bearer user-jwt"},
        json={"email": "  NEW.Teacher@Example.test ", "display_name": "  New Teacher  "},
    )
    assert response.status_code == 200
    assert response.json() == {"status": "invited", "email": "new.teacher@example.test"}
    assert calls == [
        ("invite", "new.teacher@example.test", "New Teacher"),
        ("grant", "new-user-id"),
    ]


def test_invalid_room_uuid_is_rejected(monkeypatch):
    setup_user(monkeypatch)
    response = client.post(
        "/api/rooms/not-a-uuid/token",
        headers={"Authorization": "Bearer user-jwt"},
        json={"connection_id": CONNECTION},
    )
    assert response.status_code == 422


def test_token_is_scoped_to_authorized_room_and_device(monkeypatch):
    setup_user(monkeypatch)
    calls = mock_rpc(monkeypatch)
    monkeypatch.setenv("LIVEKIT_API_KEY", "test-key")
    monkeypatch.setenv("LIVEKIT_API_SECRET", "test-secret-at-least-thirty-two-bytes-long")
    monkeypatch.setenv("LIVEKIT_URL", "wss://example.test")
    response = client.post(
        f"/api/rooms/{ROOM}/token",
        headers={"Authorization": "Bearer user-jwt"},
        json={"connection_id": CONNECTION, "identity": "attacker", "room": "other-room", "roomAdmin": True},
    )
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    payload = response.json()
    claims = json.loads(base64.urlsafe_b64decode(payload["participantToken"].split(".")[1] + "=="))
    assert payload["serverUrl"] == "wss://example.test"
    assert claims["sub"].startswith("p-")
    assert claims["video"]["room"] == CLASSROOM["livekit_room_name"]
    assert claims["video"]["roomJoin"] is True
    assert claims["video"]["canPublish"] is True
    assert not claims["video"].get("roomAdmin")
    assert claims["exp"] - claims["nbf"] == 600
    assert any(call[0] == "open_classroom_session" for call in calls)


def test_closed_room_never_receives_token(monkeypatch):
    setup_user(monkeypatch)
    closed = {**CLASSROOM, "lifecycle_status": "closed"}
    mock_rpc(monkeypatch, closed)
    response = client.post(
        f"/api/rooms/{ROOM}/token",
        headers={"Authorization": "Bearer user-jwt"},
        json={"connection_id": CONNECTION},
    )
    assert response.status_code == 404


def test_concurrent_connection_limit_is_enforced(monkeypatch):
    setup_user(monkeypatch)

    async def limited_rpc(name, body, token=None, *, service=False):
        if name == "join_classroom":
            return [CLASSROOM]
        if name == "consume_classroom_token_rate":
            return True
        if name == "open_classroom_session":
            return []
        raise AssertionError(name)

    monkeypatch.setattr(main, "supabase_rpc", limited_rpc)
    response = client.post(
        f"/api/rooms/{ROOM}/token",
        headers={"Authorization": "Bearer user-jwt"},
        json={"connection_id": CONNECTION},
    )
    assert response.status_code == 429


def test_room_creation_uses_server_created_opaque_livekit_name(monkeypatch):
    setup_user(monkeypatch)
    calls = mock_rpc(monkeypatch)
    monkeypatch.setenv("LIVEKIT_URL", "https://example.test")
    monkeypatch.setenv("LIVEKIT_API_KEY", "test-key")
    monkeypatch.setenv("LIVEKIT_API_SECRET", "test-secret")
    created = []

    class RoomService:
        async def create_room(self, request):
            created.append(request.name)
            return object()

        async def delete_room(self, request):
            return object()

    class Client:
        room = RoomService()

        async def aclose(self):
            pass

    @asynccontextmanager
    async def fake_livekit_client():
        yield Client()

    monkeypatch.setattr(main, "livekit_client", fake_livekit_client)
    result = client.post(
        "/api/rooms",
        headers={"Authorization": "Bearer user-jwt"},
        json={"title": "  Conversation  ", "access_mode": "members_only"},
    )
    assert result.status_code == 200
    assert created and created[0].startswith("se-") and "@" not in created[0]
    create_call = next(call for call in calls if call[0] == "create_classroom")
    assert create_call[1]["p_title"] == "Conversation"
    assert create_call[1]["p_livekit_room_name"] == created[0]


def test_detail_does_not_expose_livekit_room_name(monkeypatch):
    setup_user(monkeypatch)
    response = client.get(f"/api/rooms/{ROOM}", headers={"Authorization": "Bearer user-jwt"})
    assert response.status_code == 200
    assert "livekit_room_name" not in response.json()


def test_health_is_public_and_contains_no_secrets():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
