"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Video, ArrowUpRight, Copy, Link2, Plus } from "lucide-react";
import type { FormEvent } from "react";
import { supabase, apiRequest } from "../lib/supabase";
import { usePreferences } from "./Preferences";
type Room = {
  id: string;
  title: string;
  starts_at: string | null;
  scheduled_start?: string | null;
  owner_id?: string;
  owner_name?: string;
  access_mode?: "authenticated_demo" | "members_only";
  lifecycle_status?: "scheduled" | "open" | "closed";
  media_active?: boolean | null;
  participant_count?: number | null;
};
export default function Dashboard() {
  const { t, locale } = usePreferences();
  const query = useSearchParams();
  const pathname = usePathname();
  const demo = query.get("demo") === "1";
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [accessMode, setAccessMode] = useState<"authenticated_demo" | "members_only">("members_only");
  const [creating, setCreating] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [closingRoom, setClosingRoom] = useState("");
  useEffect(() => {
    let live = true;
    async function load() {
      if (demo) {
        if (!supabase) {
          router.replace("/colaboradores");
          return;
        }
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          router.replace(`/colaboradores?next=${encodeURIComponent(pathname + window.location.search)}`);
          return;
        }
        const available = await apiRequest("/rooms");
        setRooms(available.filter((room: Room) => room.access_mode === "authenticated_demo"));
        setLoading(false);
        return;
      }
      if (!supabase) {
        router.replace("/colaboradores");
        return;
      }
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace(`/colaboradores?next=${encodeURIComponent(pathname + window.location.search)}`);
          return;
        }
        const [result, me] = await Promise.all([apiRequest("/rooms"), apiRequest("/me")]);
        if (live) {
          setName(user.email || "");
          setUserId(user.id);
          setCanManage(me.roles.includes("teacher") || me.roles.includes("admin"));
          setIsAdmin(me.roles.includes("admin"));
          setRooms(result);
        }
      } catch (e) {
        if (live)
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível conectar. Tente novamente.",
          );
      } finally {
        if (live) setLoading(false);
      }
    }
    load();
    return () => {
      live = false;
    };
  }, [demo, pathname, router]);

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      const room = await apiRequest("/rooms", {
        title,
        scheduled_start: startsAt ? new Date(startsAt).toISOString() : null,
        access_mode: accessMode,
      });
      if (accessMode === "authenticated_demo") {
        setRooms((current) => [...current, room]);
      } else {
        await refreshRooms();
      }
      setJoinUrl(`${window.location.origin}/salas/${encodeURIComponent(room.id)}`);
      setCopied(false);
      setTitle("");
      setStartsAt("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar a sala.");
    } finally {
      setCreating(false);
    }
  }

  async function refreshRooms() {
    setError("");
    try {
      const current = await apiRequest("/rooms");
      setRooms(demo ? current.filter((room: Room) => room.access_mode === "authenticated_demo") : current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível conectar. Tente novamente.");
    }
  }

  async function generateJoinLink(roomId: string) {
    setShareBusy(true);
    setError("");
    const url = `${window.location.origin}/salas/${encodeURIComponent(roomId)}`;
    setJoinUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("Não foi possível copiar o link neste navegador.");
    } finally {
      setShareBusy(false);
    }
  }

  async function closeRoom(roomId: string) {
    setClosingRoom(roomId);
    setError("");
    try {
      await apiRequest(`/rooms/${encodeURIComponent(roomId)}/close`, {});
      setRooms((current) => current.map((room) => room.id === roomId ? { ...room, lifecycle_status: "closed", media_active: false, participant_count: 0 } : room));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível encerrar a sala.");
    } finally {
      setClosingRoom("");
    }
  }

  async function copyJoinLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
    } catch {
      setError("Não foi possível copiar o link neste navegador.");
    }
  }

  return (
    <main className="portal" id="conteudo">
      <div className="portal-container">
        <div className="portal-top">
          <div>
            <span className="overline">
              SHOW ENGLISH • {t("COLABORADORES")}
            </span>
            <h1>{t("Suas salas de aula")}</h1>
            <p>
              {demo ? t("Explore o painel antes de conectar sua conta.") : name}
            </p>
          </div>
          <button
            className="secondary-action"
            onClick={async () => {
              if (!demo) await supabase?.auth.signOut();
              router.replace("/colaboradores");
            }}
          >
            {t(demo ? "Voltar" : "Sair")}
          </button>
          {!demo && <button className="secondary-action" type="button" onClick={refreshRooms}>{t("Atualizar salas")}</button>}
        </div>
        {demo && (
          <div className="notice">
            {t("Demonstração: dados fictícios, sem chamada conectada.")}
          </div>
        )}
        {!demo && canManage && (
          <form className="portal-card room-create-form" onSubmit={createRoom}>
            <h2>{t("Criar nova sala")}</h2>
            <div className="room-create-fields">
              <label className="field">
                {t("Nome da sala")}
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  required
                />
              </label>
              <label className="field">
                {t("Data e horário da aula")}
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </label>
              <label className="field">
                {t("Acesso à sala")}
                <select value={accessMode} onChange={(event) => setAccessMode(event.target.value as typeof accessMode)}>
                  <option value="members_only">{t("Somente membros autorizados")}</option>
                  <option value="authenticated_demo">{t("Demonstração para usuários autenticados")}</option>
                </select>
              </label>
              <button className="primary-action" disabled={creating}>
                <Plus size={18} />
                {t(creating ? "Criando sala…" : "Criar sala")}
              </button>
            </div>
          </form>
        )}
        {joinUrl && (
          <div className="notice room-share-link" role="status">
            <div>
              <strong>{t("Link de acesso para alunos")}</strong>
              <a href={joinUrl}>{joinUrl}</a>
            </div>
            <button className="secondary-action" type="button" onClick={copyJoinLink}>
              <Copy size={17} />
              {t(copied ? "Link copiado." : "Copiar link")}
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="error">
            {t(error)}
          </p>
        )}
        {loading ? (
          <p role="status">{t("Carregando…")}</p>
        ) : (
          <div className="room-grid">
            {rooms.map((room) => (
              <article key={room.id} className="portal-card room-card">
                <span className="badge">
                  {t(demo ? "DEMONSTRAÇÃO" : "SALA ATRIBUÍDA")}
                </span>
                <h2>{demo ? t(room.title) : room.title}</h2>
                {!demo && <p>{t("Professor Show English")}: {room.owner_name || t("Professor Show English")}</p>}
                <p>
                  {room.scheduled_start || room.starts_at
                    ? new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "America/Sao_Paulo",
                      }).format(new Date(room.scheduled_start || room.starts_at!)) + " (São Paulo)"
                    : t("Horário a combinar")}
                </p>
                <p>{t(room.lifecycle_status === "closed" ? "Encerrada" : room.lifecycle_status === "scheduled" ? "Agendada" : "Disponível")} · {room.media_active === null ? t("Mídia: estado desconhecido") : room.media_active ? `${t("Mídia ativa")} · ${room.participant_count ?? 0}` : t("Mídia inativa")}</p>
                <Link
                  className="primary-action"
                  href={
                    demo
                      ? "/colaboradores/sala?demo=1"
                      : "/salas/" + encodeURIComponent(room.id)
                  }
                >
                  <Video size={18} />
                  {t("Entrar na sala")}
                  <ArrowUpRight size={18} />
                </Link>
                {!demo && (room.owner_id === userId || isAdmin) && room.lifecycle_status !== "closed" && (
                  <div className="room-management-actions">
                    <button
                      className="secondary-action room-share-action"
                      type="button"
                      disabled={shareBusy}
                      onClick={() => generateJoinLink(room.id)}
                    >
                      <Link2 size={17} />
                      {t(shareBusy ? "Preparando link…" : "Copiar link")}
                    </button>
                    <button
                      className="secondary-action room-share-action"
                      type="button"
                      disabled={closingRoom === room.id}
                      onClick={() => closeRoom(room.id)}
                    >
                      {t(closingRoom === room.id ? "Encerrando…" : "Encerrar aula")}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        {!loading && !rooms.length && !error && (
          <div className="portal-card">
            {t("Nenhuma sala atribuída. Entre em contato com a administração.")}
          </div>
        )}
      </div>
    </main>
  );
}
