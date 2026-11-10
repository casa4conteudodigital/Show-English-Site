"use client";
import {
  useConnectionState,
  useLocalParticipant,
  useTracks,
  ParticipantTile,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import { Track, ConnectionState } from "livekit-client";
import { useState } from "react";
import { usePreferences } from "./Preferences";
export default function LiveSession() {
  const { t } = usePreferences();
  const room = useRoomContext();
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } =
    useLocalParticipant();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const state = useConnectionState();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  async function toggle(kind: "camera" | "microphone") {
    setBusy(true);
    setError(false);
    try {
      if (kind === "camera")
        await localParticipant.setCameraEnabled(!isCameraEnabled);
      else await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p role="status">
        {t(
          state === ConnectionState.Connected
            ? "Conectado"
            : state === ConnectionState.Reconnecting
              ? "Reconectando…"
              : "Conectando…",
        )}
      </p>
      {error && (
        <p role="alert">
          {t(
            "Não foi possível acessar câmera e microfone. Verifique as permissões e os dispositivos.",
          )}
        </p>
      )}
      <div className="live-grid">
        {tracks.map((track) => (
          <ParticipantTile
            key={track.participant.identity + track.source}
            trackRef={track}
          />
        ))}
      </div>
      <RoomAudioRenderer />
      <div className="room-actions">
        <button
          className="secondary-action"
          disabled={busy}
          aria-pressed={isCameraEnabled}
          onClick={() => toggle("camera")}
        >
          {t(isCameraEnabled ? "Desligar câmera" : "Ligar câmera")}
        </button>
        <button
          className="secondary-action"
          disabled={busy}
          aria-pressed={isMicrophoneEnabled}
          onClick={() => toggle("microphone")}
        >
          {t(isMicrophoneEnabled ? "Desligar microfone" : "Ligar microfone")}
        </button>
        <button className="primary-action" onClick={() => room.disconnect()}>
          {t("Sair da chamada")}
        </button>
      </div>
    </>
  );
}
