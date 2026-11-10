"""API Show English: autorização por RLS e tokens de sala emitidos no servidor."""
import os
from datetime import timedelta
from uuid import UUID
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from livekit import api
from pydantic import BaseModel

load_dotenv()
app = FastAPI(title="Show English API", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",") if x.strip()], allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])
bearer = HTTPBearer(auto_error=False)


def config(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise HTTPException(503, "Integração ainda não configurada.")
    return value


async def supabase_get(path: str, token: str, params=None):
    url = config("SUPABASE_URL").rstrip("/")
    headers = {"apikey": config("SUPABASE_ANON_KEY"), "Authorization": f"Bearer {token}"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            result = await client.get(url + path, headers=headers, params=params)
    except httpx.RequestError:
        raise HTTPException(503, "Serviço de autenticação indisponível.")
    if result.status_code in (401, 403):
        raise HTTPException(401, "Sessão inválida.")
    if result.is_error:
        raise HTTPException(502, "Falha ao consultar permissões.")
    return result.json()


async def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(401, "Autenticação necessária.")
    token = credentials.credentials
    user = await supabase_get("/auth/v1/user", token)
    if not user.get("id"):
        raise HTTPException(401, "Sessão inválida.")
    profiles = await supabase_get("/rest/v1/profiles", token, {"id": f"eq.{user['id']}", "select": "role"})
    if not profiles or profiles[0]["role"] not in ("teacher", "admin"):
        raise HTTPException(403, "Acesso exclusivo para colaboradores.")
    return {"id": user["id"], "token": token}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/rooms")
async def rooms(response: Response, user=Depends(current_user)):
    response.headers["Cache-Control"] = "no-store"
    return await supabase_get("/rest/v1/rooms", user["token"], {"select": "id,title,starts_at", "active": "eq.true", "order": "starts_at.asc.nullslast"})


class TokenRequest(BaseModel):
    room_id: UUID


@app.post("/rooms/token")
async def room_token(body: TokenRequest, response: Response, user=Depends(current_user)):
    # The user's JWT is forwarded to Supabase: RLS checks the room membership.
    allowed = await supabase_get("/rest/v1/rooms", user["token"], {"id": f"eq.{body.room_id}", "active": "eq.true", "select": "id"})
    if not allowed:
        raise HTTPException(403, "Você não tem acesso a esta sala.")
    url = config("LIVEKIT_URL")
    token = (api.AccessToken(config("LIVEKIT_API_KEY"), config("LIVEKIT_API_SECRET"))
             .with_identity(user["id"])
             .with_ttl(timedelta(minutes=10))
             .with_grants(api.VideoGrants(room_join=True, room=f"show-{body.room_id}", can_publish=True, can_subscribe=True, can_publish_data=True))
             .to_jwt())
    response.headers["Cache-Control"] = "no-store"
    return {"token": token, "url": url}
