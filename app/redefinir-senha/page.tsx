"use client";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { safeInternalPath } from "../../lib/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== String(form.get("confirmPassword") || "")) {
      setError("As senhas não conferem.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const tokenHash = search.get("token_hash");
      const tokenType = search.get("type");
      const code = search.get("code");
      if (tokenHash) {
        if (tokenType !== "recovery" && tokenType !== "invite") {
          throw new Error("O link de acesso é inválido ou expirou.");
        }
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tokenType });
        if (verifyError) throw verifyError;
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("O link de recuperação é inválido ou expirou.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      const next = safeInternalPath(search.get("next"), "/salas");
      window.setTimeout(() => router.replace(next), 1200);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível redefinir a senha.");
    } finally {
      setBusy(false);
    }
  }
  return <main className="portal" id="conteudo"><div className="portal-container"><section className="portal-card login-card"><h1>Redefinir senha</h1>{done ? <p role="status">Senha atualizada. Redirecionando…</p> : <form onSubmit={submit}><label className="field">Nova senha<input type="password" name="password" autoComplete="new-password" minLength={8} required disabled={!supabase || busy} /></label><label className="field">Confirmar nova senha<input type="password" name="confirmPassword" autoComplete="new-password" minLength={8} required disabled={!supabase || busy} /></label>{error && <p className="error" role="alert">{error}</p>}<button className="primary-action" disabled={!supabase || busy}>{busy ? "Salvando…" : "Salvar nova senha"}</button></form>}</section></div></main>;
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
