"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Video, ArrowUpRight } from "lucide-react";
import { supabase, apiRequest } from "../lib/supabase";
import { usePreferences } from "./Preferences";
type Room = { id: string; title: string; starts_at: string | null };
export default function Dashboard() {
  const { t, locale } = usePreferences();
  const query = useSearchParams();
  const demo = query.get("demo") === "1";
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    async function load() {
      if (demo) {
        setRooms([
          { id: "demo", title: "Sala de demonstração", starts_at: null },
        ]);
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
          router.replace("/colaboradores");
          return;
        }
        const result = await apiRequest("/rooms");
        if (live) {
          setName(user.email || "");
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
  }, [demo, router]);
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
        </div>
        {demo && (
          <div className="notice">
            {t("Demonstração: dados fictícios, sem chamada conectada.")}
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
                <p>
                  {room.starts_at
                    ? new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "America/Sao_Paulo",
                      }).format(new Date(room.starts_at)) + " (São Paulo)"
                    : t("Horário a combinar")}
                </p>
                <Link
                  className="primary-action"
                  href={
                    demo
                      ? "/colaboradores/sala?demo=1"
                      : "/colaboradores/sala?id=" + encodeURIComponent(room.id)
                  }
                >
                  <Video size={18} />
                  {t("Entrar na sala")}
                  <ArrowUpRight size={18} />
                </Link>
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
