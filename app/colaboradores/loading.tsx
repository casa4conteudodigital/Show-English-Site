"use client";
import { usePreferences } from "../../components/Preferences";
export default function Loading() {
  const { t } = usePreferences();
  return (
    <main className="portal" id="conteudo">
      <p role="status">{t("Carregando…")}</p>
    </main>
  );
}
