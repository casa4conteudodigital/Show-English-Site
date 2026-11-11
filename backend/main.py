"""Show English API: Supabase owns auth/data, LiveKit Cloud owns media."""
import hashlib
import logging
import os
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from livekit import api
from pydantic import BaseModel, Field

load_dotenv()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("show_english.api")
app = FastAPI(title="Show English API", version="0.3.0")
origins = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", os.getenv("FRONTEND_ORIGINS", "http://localhost:3000")).split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Authorization", "Content-Type"])
bearer = HTTPBearer(auto_error=False)


def config(name: str, *fallbacks: str) -> str:
    for key in (name, *fallbacks):
        value = os.getenv(key)
        if value:
            return value
    raise HTTPException(503, "Integração ainda não configurada.")


def supabase_headers(token: str) -> dict[str, str]:
    return {
        "apikey": config("SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"),
        "Authorization": f"Bearer {token}",
    }


async def supabase_get(path: str, token: str, params: dict | None = None):
    url = config("SUPABASE_URL").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            result = await client.get(url + path, headers=supabase_headers(token), params=params)
    except httpx.RequestError:
        raise HTTPException(503, "Serviço de autenticação indisponível.")
    if result.status_code in (401, 403):
        raise HTTPException(401, "Sessão inválida.")
    if result.is_error:
        raise HTTPException(502, "Falha ao consultar os dados da sala.")
    return result.json()


async def supabase_rpc(name: str, body: dict, token: str | None = None, *, service: bool = False):
    url = config("SUPABASE_URL").rstrip("/")
    if service:
        key = config("SUPABASE_SERVICE_ROLE_KEY")
        headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    else:
        headers = supabase_headers(token or "")
    headers["Content-Type"] = "application/json"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            result = await client.post(f"{url}/rest/v1/rpc/{name}", headers=headers, json=body)
    except httpx.RequestError:
        raise HTTPException(503, "Serviço de dados indisponível.")
    if result.status_code in (401, 403):
        raise HTTPException(403 if token else 503, "Operação não autorizada.")
    if result.is_error:
        try:
            detail = result.json().get("message", "")
        except ValueError:
            detail = ""
        if "not authorized" in detail or "not authenticated" in detail:
            raise HTTPException(403, "Você não tem permissão para esta operação.")
        if "unavailable" in detail:
            raise HTTPException(404, "Sala não encontrada ou encerrada.")
        if "rate limited" in detail:
            raise HTTPException(429, "Muitas tentativas de acesso. Aguarde um minuto e tente novamente.")
        raise HTTPException(502, "Falha ao atualizar a sala.")
    if not result.content:
        return None
    return result.json()


async def supabase_patch(path: str, body: dict, token: str):
    url = config("SUPABASE_URL").rstrip("/")
    headers = supabase_headers(token)
    headers["Content-Type"] = "application/json"
    headers["Prefer"] = "return=representation"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            result = await client.patch(url + path, headers=headers, json=body)
    except httpx.RequestError:
        raise HTTPException(503, "Serviço de dados indisponível.")
    if result.is_error:
        raise HTTPException(502, "Falha ao atualizar a sala.")
    return result.json() if result.content else None


@asynccontextmanager
async def livekit_client():
    client = api.LiveKitAPI(
        url=config("LIVEKIT_URL"),
        api_key=config("LIVEKIT_API_KEY"),
        api_secret=config("LIVEKIT_API_SECRET"),
    )
    try:
        yield client
    finally:
        await client.aclose()


async def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(401, "Entre para continuar.")
    token = credentials.credentials
    user = await supabase_get("/auth/v1/user", token)
    if not user.get("id") or not user.get("email_confirmed_at"):
        raise HTTPException(401, "Confirme seu e-mail e entre novamente.")
    profiles = await supabase_get("/rest/v1/profiles", token, {"id": f"eq.{user['id']}", "select": "display_name"})
    roles = await supabase_get("/rest/v1/user_roles", token, {"user_id": f"eq.{user['id']}", "select": "role"})
    if not profiles:
        raise HTTPException(403, "Perfil ainda não foi provisionado. Tente novamente em instantes.")
    role_names = {item["role"] for item in roles}
    return {
        "id": user["id"],
        "token": token,
        "roles": role_names,
        "name": profiles[0].get("display_name") or "Participante",
    }


def require_teacher(user: dict):
    if not user["roles"].intersection({"teacher", "admin"}):
        raise HTTPException(403, "Apenas professores autorizados podem gerenciar salas.")


@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/me")
@app.get("/api/me")
async def me(user=Depends(current_user)):
    return {"id": user["id"], "display_name": user["name"], "roles": sorted(user["roles"])}


class RoomCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    scheduled_start: datetime | None = None
    access_mode: str = Field(default="members_only", pattern="^(authenticated_demo|members_only)$")


@app.get("/rooms")
@app.get("/api/rooms")
async def list_classrooms(response: Response, user=Depends(current_user)):
    response.headers["Cache-Control"] = "no-store"
    rows = await supabase_rpc("list_authorized_classrooms", {}, user["token"])
    if not rows:
        return []
    activity: dict[str, dict] = {}
    activity_available = False
    try:
        names = [row["livekit_room_name"] for row in rows if row["lifecycle_status"] != "closed"]
        if names:
            async with livekit_client() as lk:
                live_rooms = await lk.room.list_rooms(api.ListRoomsRequest(names=names))
            activity_available = True
            activity = {
                item.name: {"media_active": True, "participant_count": item.num_participants}
                for item in live_rooms.rooms
            }
        else:
            activity_available = True
    except Exception:
        logger.warning("LiveKit activity unavailable during room listing")
    return [
        {
            **{key: value for key, value in row.items() if key != "livekit_room_name"},
            "media_active": False if row["lifecycle_status"] == "closed" else (
                activity.get(row["livekit_room_name"], {}).get("media_active", False)
                if activity_available else None
            ),
            "participant_count": 0 if row["lifecycle_status"] == "closed" else (
                activity.get(row["livekit_room_name"], {}).get("participant_count", 0)
                if activity_available else None
            ),
        }
        for row in rows
    ]


@app.get("/rooms/{room_id}")
@app.get("/api/rooms/{room_id}")
async def classroom_detail(room_id: UUID, response: Response, user=Depends(current_user)):
    response.headers["Cache-Control"] = "no-store"
    rows = await supabase_get(
        "/rest/v1/classrooms",
        user["token"],
        {"id": f"eq.{room_id}", "select": "id,title,description,owner_id,livekit_room_name,access_mode,lifecycle_status,scheduled_start"},
    )
    if not rows:
        raise HTTPException(404, "Sala não encontrada ou sem permissão.")
    room = rows[0]
    if room["access_mode"] == "authenticated_demo" and "student" in user["roles"]:
        await supabase_rpc("join_classroom", {"p_classroom_id": str(room_id)}, user["token"])
    room.pop("livekit_room_name", None)
    return room


@app.post("/rooms")
@app.post("/api/rooms")
async def create_classroom(body: RoomCreate, response: Response, user=Depends(current_user)):
    require_teacher(user)
    title = body.title.strip()
    if not title:
        raise HTTPException(422, "Informe o nome da sala.")
    if body.scheduled_start and body.scheduled_start.tzinfo is None:
        raise HTTPException(422, "A data da sala precisa incluir fuso horário.")
    room_name = f"se-{uuid4().hex}"
    try:
        async with livekit_client() as lk:
            await lk.room.create_room(api.CreateRoomRequest(name=room_name, empty_timeout=300, max_participants=50))
    except HTTPException:
        raise
    except Exception:
        logger.exception("LiveKit room creation failed")
        raise HTTPException(503, "Não foi possível preparar a sala de vídeo.")
    try:
        rows = await supabase_rpc(
            "create_classroom",
            {
                "p_title": title,
                "p_description": body.description,
                "p_scheduled_start": body.scheduled_start.isoformat() if body.scheduled_start else None,
                "p_access_mode": body.access_mode,
                "p_livekit_room_name": room_name,
            },
            user["token"],
        )
    except Exception:
        try:
            async with livekit_client() as lk:
                await lk.room.delete_room(api.DeleteRoomRequest(room=room_name))
        except Exception:
            logger.exception("Orphan LiveKit room cleanup failed")
        raise
    room = rows[0] if isinstance(rows, list) else rows
    if not room:
        raise HTTPException(502, "A sala de vídeo foi preparada, mas o cadastro não foi confirmado.")
    response.headers["Cache-Control"] = "no-store"
    response.headers["Location"] = f"/salas/{room['id']}"
    return {**room, "media_active": False, "participant_count": 0}


class TokenRequest(BaseModel):
    connection_id: UUID


@app.post("/rooms/{room_id}/token")
@app.post("/api/rooms/{room_id}/token")
async def classroom_token(room_id: UUID, body: TokenRequest, response: Response, user=Depends(current_user)):
    allowed = await supabase_rpc("join_classroom", {"p_classroom_id": str(room_id)}, user["token"])
    room = allowed[0] if isinstance(allowed, list) else allowed
    if not room or room.get("lifecycle_status") == "closed":
        raise HTTPException(404, "Esta sala foi encerrada ou não está disponível.")
    await supabase_rpc("consume_classroom_token_rate", {"p_window_seconds": 60, "p_limit": 12}, user["token"])
    identity = "p-" + hashlib.sha256(f"{user['id']}:{body.connection_id}".encode()).hexdigest()[:32]
    sessions = await supabase_rpc(
        "open_classroom_session",
        {
            "p_classroom_id": str(room_id),
            "p_connection_id": str(body.connection_id),
            "p_participant_identity": identity,
        },
        user["token"],
    )
    if not sessions:
        raise HTTPException(429, "Limite de quatro conexões simultâneas por conta atingido.")
    role = "host" if user["id"] == room["owner_id"] or "admin" in user["roles"] else "participant"
    name = f"{user['name']} · {role}"
    try:
        token = (
            api.AccessToken(config("LIVEKIT_API_KEY"), config("LIVEKIT_API_SECRET"))
            .with_identity(identity)
            .with_name(name[:100])
            .with_ttl(timedelta(minutes=10))
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=room["livekit_room_name"],
                    can_publish=True,
                    can_subscribe=True,
                    can_publish_data=True,
                    can_publish_sources=["camera", "microphone"],
                )
            )
            .to_jwt()
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("LiveKit participant token creation failed")
        raise HTTPException(503, "Não foi possível emitir o acesso à sala.")
    response.headers["Cache-Control"] = "no-store"
    return {"serverUrl": config("LIVEKIT_URL"), "participantToken": token, "participantName": name, "roomTitle": room["title"], "connectionId": str(body.connection_id), "id": str(room_id), "title": room["title"], "starts_at": room.get("scheduled_start"), "owner_id": room["owner_id"], "access_mode": room["access_mode"], "lifecycle_status": room["lifecycle_status"], "media_active": None, "participant_count": None}


@app.post("/rooms/{room_id}/leave")
@app.post("/api/rooms/{room_id}/leave")
async def leave_classroom(room_id: UUID, body: TokenRequest, user=Depends(current_user)):
    await supabase_rpc("end_classroom_session", {"p_classroom_id": str(room_id), "p_connection_id": str(body.connection_id)}, user["token"])
    return {"status": "ok"}


@app.post("/rooms/{room_id}/close")
@app.post("/api/rooms/{room_id}/close")
async def close_classroom(room_id: UUID, response: Response, user=Depends(current_user)):
    require_teacher(user)
    rows = await supabase_rpc("close_classroom", {"p_classroom_id": str(room_id)}, user["token"])
    room = rows[0] if isinstance(rows, list) and rows else rows
    if not room:
        raise HTTPException(404, "Sala não encontrada ou sem permissão.")
    try:
        async with livekit_client() as lk:
            await lk.room.delete_room(api.DeleteRoomRequest(room=room["livekit_room_name"]))
    except Exception:
        logger.warning("Classroom is closed in Supabase; LiveKit cleanup will need retry", exc_info=True)
        raise HTTPException(503, "A aula foi encerrada no sistema, mas a desconexão da mídia precisa ser repetida.")
    response.headers["Cache-Control"] = "no-store"
    return {"id": str(room_id), "lifecycle_status": "closed"}


@app.post("/api/livekit/webhook")
async def livekit_webhook(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(401, "Webhook authentication required.")
    raw = await request.body()
    try:
        receiver = api.WebhookReceiver(api.TokenVerifier(config("LIVEKIT_API_KEY"), config("LIVEKIT_API_SECRET")))
        event = receiver.receive(raw.decode("utf-8"), auth_header)
    except Exception:
        raise HTTPException(401, "Invalid LiveKit webhook.")
    occurred = datetime.fromtimestamp(event.created_at, timezone.utc) if event.created_at else datetime.now(timezone.utc)
    event_room = event.room
    event_participant = event.participant
    await supabase_rpc(
        "store_livekit_event",
        {
            "p_event_id": event.id,
            "p_event_type": event.event,
            "p_room_name": event_room.name if event_room else "",
            "p_session_id": event_room.sid if event_room else None,
            "p_participant_identity": event_participant.identity if event_participant else None,
            "p_payload_hash": hashlib.sha256(raw).hexdigest(),
            "p_occurred_at": occurred.isoformat(),
        },
        service=True,
    )
    return {"received": True}
