"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Video, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePreferences } from "../../components/Preferences";
import { safeInternalPath } from "../../lib/auth";

type Mode = "login" | "signup" | "forgot";

export default function Login() {
  const { t } = usePreferences();
  const router = useRouter();
  const query = useSearchParams();
  const selectedArea = query.get("next") === "/colaboradores/painel" ? "teacher" : "student";
  const [mode, setMode] = useState<Mode>("login");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;
    if (supabase) {
      supabase.auth.getSession().then(({ data, error: sessionError }) => {
        if (active && !sessionError && data.session) router.replace(safeInternalPath(query.get("next")));
      });
    }
    return () => { active = false; };
  }, [query, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const formEmail = String(form.get("email") || "").trim();
    setEmail(formEmail);
    try {
      const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeInternalPath(query.get("next")))}`;
      if (mode === "signup") {
        const password = String(form.get("password") || "");
        if (password !== String(form.get("confirmPassword") || "")) throw new Error("As senhas não conferem.");
        if (form.get("terms") !== "on") throw new Error("Aceite os termos e a política de privacidade para continuar.");
        const { data, error: authError } = await supabase.auth.signUp({
          email: formEmail,
          password,
          options: {
            emailRedirectTo: callback,
            data: {
              display_name: String(form.get("name") || "").trim(),
              terms_version: "2026-11",
              terms_accepted: true,
            },
          },
        });
        if (authError) throw authError;
        if (data.session) await supabase.auth.signOut();
        setNotice("Conta criada. Confirme seu e-mail pelo link enviado antes de entrar.");
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(formEmail, {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/redefinir-senha")}`,
        });
        if (authError) throw authError;
        setNotice("Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.");
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formEmail,
          password: String(form.get("password") || ""),
        });
        if (authError) throw authError;
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          throw new Error("Confirme seu e-mail antes de entrar. Você pode reenviar a confirmação abaixo.");
        }
        router.replace(safeInternalPath(query.get("next")));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!supabase || !email || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error: authError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeInternalPath(query.get("next")))}` },
      });
      if (authError) throw authError;
      setNotice("Se a conta ainda precisar de confirmação, um novo link será enviado.");
    } catch {
      setError("Não foi possível reenviar agora. Aguarde o limite de envio e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="portal" id="conteudo">
      <div className="portal-container login-grid">
        <section className="login-story">
          <div className="story-icon"><Video size={32} /></div>
          <span className="overline">SHOW ENGLISH • {t("COLABORADORES")}</span>
          <h1>{t("Boas conversas começam aqui.")}</h1>
          <p>{t("Seu espaço para ensinar, acompanhar e se conectar com os alunos.")}</p>
          <p><ShieldCheck size={20} /> {t("Acesso seguro para professores e alunos.")}</p>
          <Link href="/">← {t("Voltar ao site")}</Link>
        </section>
        <section className="portal-card login-card">
          <h2>{t(mode === "signup" ? "Criar sua conta" : mode === "forgot" ? "Recuperar senha" : "Acesse sua conta")}</h2>
          <p>{t("Entre para consultar suas salas e iniciar uma aula.")}</p>
          {mode === "login" && <nav className={`auth-area-switch is-${selectedArea}`} aria-label={t("Escolha sua área")}>
            <Link
              className="auth-area-option"
              href="/colaboradores?next=%2Fcolaboradores%2Fpainel"
              aria-label={t("Entrar como professor")}
              aria-current={selectedArea === "teacher" ? "page" : undefined}
            >
              {t("Professor")}
            </Link>
            <Link
              className="auth-area-option"
              href="/colaboradores?next=%2Fsalas"
              aria-label={t("Entrar como aluno")}
              aria-current={selectedArea === "student" ? "page" : undefined}
            >
              {t("Aluno")}
            </Link>
          </nav>}
          {!supabase && <div className="notice">{t("Integração ainda não configurada.")}</div>}
          <form onSubmit={submit}>
            {mode === "signup" && <label className="field">{t("Nome completo")}<input name="name" autoComplete="name" minLength={2} maxLength={100} required disabled={!supabase || busy} /></label>}
            <label className="field">{t("E-mail")}<input type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={!supabase || busy} /></label>
            {mode !== "forgot" && <label className="field">{t("Senha")}<span className="password-field"><input type={show ? "text" : "password"} name="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required disabled={!supabase || busy} /><button type="button" className="icon-button" aria-label={t(show ? "Ocultar senha" : "Mostrar senha")} onClick={() => setShow(!show)}>{show ? <EyeOff size={20} /> : <Eye size={20} />}</button></span></label>}
            {mode === "signup" && <><label className="field">{t("Confirmar senha")}<span className="password-field"><input type={showConfirm ? "text" : "password"} name="confirmPassword" autoComplete="new-password" minLength={8} required disabled={!supabase || busy} /><button type="button" className="icon-button" aria-label={t(showConfirm ? "Ocultar senha" : "Mostrar senha")} onClick={() => setShowConfirm(!showConfirm)} disabled={busy}>{showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}</button></span></label><label className="terms-check"><input type="checkbox" name="terms" required disabled={!supabase || busy} /><span>{t("Li e aceito os")} <Link href="/termos" target="_blank">{t("termos de uso")}</Link> {t("e a")} <Link href="/privacidade" target="_blank">{t("política de privacidade")}</Link>.</span></label></>}
            {error && <p className="error" role="alert">{t(error)}</p>}
            {notice && <p className="notice" role="status">{t(notice)}</p>}
            <button className="primary-action" disabled={!supabase || busy}><span>{t(busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : mode === "forgot" ? "Enviar link de recuperação" : "Entrar")}</span><ArrowRight size={18} /></button>
          </form>
          {mode === "login" && <div className="auth-links"><button type="button" onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>{t("Ainda não tem conta? Cadastre-se")}</button><button type="button" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }}>{t("Esqueci minha senha")}</button><button type="button" onClick={resendConfirmation} disabled={!email || busy}>{t("Reenviar confirmação de e-mail")}</button></div>}
          {mode !== "login" && <button className="text-action" type="button" onClick={() => { setMode("login"); setError(""); setNotice(""); }}>{t("Voltar ao login")}</button>}
        </section>
      </div>
    </main>
  );
}
