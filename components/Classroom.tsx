"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Video, VideoOff, Mic, MicOff, PhoneOff } from "lucide-react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import LiveSession from "./LiveSession";
import { apiRequest } from "../lib/supabase";
import { supabase } from "../lib/supabase";
import { usePreferences } from "./Preferences";
export default function Classroom() {
  const { t } = usePreferences();
  const query = useSearchParams();
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const demo = query.get("demo") === "1";
  const id = params?.id || query.get("id");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const [preview, setPreview] = useState(false);
  const [cam, setCam] = useState(true);
  const [mic, setMic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [roomTitle, setRoomTitle] = useState("");
  const [connection, setConnection] = useState<{
    participantToken: string;
    serverUrl: string;
    connectionId: string;
  } | null>(null);
  function stop() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setPreview(false);
  }
  useEffect(() => {
    alive.current = true;
    if (!demo && supabase) {
      void supabase.auth.getSession().then(({ data }) => {
        if (alive.current && !data.session) {
          const next = id ? `/salas/${encodeURIComponent(id)}` : "/salas";
          router.replace(`/colaboradores?next=${encodeURIComponent(next)}`);
          return;
        }
        if (alive.current && data.session && id) {
          void apiRequest(`/rooms/${encodeURIComponent(id)}`).then((room) => {
            if (alive.current) setRoomTitle(room.title);
          }).catch((error: unknown) => {
            if (alive.current) setError(error instanceof Error ? error.message : "Você não tem acesso a esta sala.");
          });
        }
      });
    }
    return () => {
      alive.current = false;
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, [demo, id, router]);
  useEffect(() => {
    if (video.current) video.current.srcObject = stream.current;
  }, [preview]);
  async function startPreview() {
    setBusy(true);
    setError("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (!alive.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      media.getAudioTracks().forEach((track) => (track.enabled = mic));
      media.getVideoTracks().forEach((track) => (track.enabled = cam));
      setPreview(true);
    } catch {
      setError(
        "Não foi possível acessar câmera e microfone. Verifique as permissões e os dispositivos.",
      );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function join() {
    setBusy(true);
    setError("");
    try {
      if (!id) throw new Error("Sala inválida.");
      const storageKey = `show-room-connection:${id}`;
      let connectionId = sessionStorage.getItem(storageKey);
      if (!connectionId) {
        connectionId = crypto.randomUUID();
        sessionStorage.setItem(storageKey, connectionId);
      }
      const data = await apiRequest(`/rooms/${encodeURIComponent(id)}/token`, { connection_id: connectionId });
      if (alive.current) {
        stop();
        setConnection(data);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível conectar. Tente novamente.",
      );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function endConnection() {
    if (connection && id) {
      try {
        await apiRequest(`/rooms/${encodeURIComponent(id)}/leave`, { connection_id: connection.connectionId });
      } catch {}
    }
    setConnection(null);
  }
  return (
    <main className="portal" id="conteudo">
      <div className="portal-container">
        <div className="portal-top">
          <div>
            <span className="overline">SHOW ENGLISH • {t("SALA DE AULA")}</span>
            <h1>
              {roomTitle || t(demo ? "Sala de demonstração" : "Prepare-se para a aula")}
            </h1>
          </div>
          <Link
            className="secondary-action"
            href={demo ? "/colaboradores/painel?demo=1" : "/salas"}
          >
            {t("Voltar às salas")}
          </Link>
        </div>
        {demo && (
          <div className="notice">
            {t("Demonstração: dados fictícios, sem chamada conectada.")}
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {t(error)}
          </p>
        )}
        {connection ? (
          <div className="live-room" data-lk-theme="default">
            <LiveKitRoom
              token={connection.participantToken}
              serverUrl={connection.serverUrl}
              connect
              video={cam}
              audio={mic}
              onDisconnected={endConnection}
              onError={() => {
                setError("Não foi possível conectar. Tente novamente.");
                setConnection(null);
              }}
            >
              <LiveSession />
            </LiveKitRoom>
          </div>
        ) : (
          <>
            <div className="video-stage">
              {preview ? (
                <video ref={video} autoPlay muted playsInline />
              ) : (
                <>
                  <Video size={48} />
                  <h2>{t("Sua câmera, seu espaço.")}</h2>
                  <p>{t("Teste seus dispositivos antes de entrar.")}</p>
                </>
              )}
            </div>
            <div className="room-actions">
              {!preview ? (
                <button
                  className="secondary-action"
                  onClick={startPreview}
                  disabled={busy}
                >
                  {t("Testar câmera e microfone")}
                </button>
              ) : (
                <>
                  <button
                    className="secondary-action"
                    aria-pressed={cam}
                    onClick={() => {
                      stream.current
                        ?.getVideoTracks()
                        .forEach((track) => (track.enabled = !cam));
                      setCam(!cam);
                    }}
                  >
                    {cam ? <Video /> : <VideoOff />}
                    {t("Câmera")}
                  </button>
                  <button
                    className="secondary-action"
                    aria-pressed={mic}
                    onClick={() => {
                      stream.current
                        ?.getAudioTracks()
                        .forEach((track) => (track.enabled = !mic));
                      setMic(!mic);
                    }}
                  >
                    {mic ? <Mic /> : <MicOff />}
                    {t("Microfone")}
                  </button>
                  <button className="secondary-action" onClick={stop}>
                    <PhoneOff />
                    {t("Encerrar prévia")}
                  </button>
                </>
              )}
              <button
                className="primary-action"
                disabled={demo || busy || !id}
                onClick={join}
              >
                {t(busy ? "Conectando…" : "Entrar na chamada")}
              </button>
            </div>
            <p style={{ textAlign: "center", marginTop: 20 }}>
              {t(
                "A prévia é local. Ninguém recebe seu áudio ou vídeo antes de entrar.",
              )}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
