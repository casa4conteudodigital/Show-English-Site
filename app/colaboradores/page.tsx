"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { usePreferences } from "../../components/Preferences";
export default function Login() {
  const { t } = usePreferences();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <main className="portal" id="conteudo">
      <div className="portal-container login-grid">
        <section className="login-story">
          <div className="story-icon">
            <Video size={32} />
          </div>
          <span className="overline">SHOW ENGLISH • {t("COLABORADORES")}</span>
          <h1>{t("Boas conversas começam aqui.")}</h1>
          <p>
            {t(
              "Seu espaço para ensinar, acompanhar e se conectar com os alunos.",
            )}
          </p>
          <p>
            <ShieldCheck size={20} />{" "}
            {t("Acesso exclusivo para a equipe Show English.")}
          </p>
          <Link href="/">← {t("Voltar ao site")}</Link>
        </section>
        <section className="portal-card login-card">
          <h2>{t("Acesse sua conta")}</h2>
          <p>{t("Entre para consultar suas salas e iniciar uma aula.")}</p>
          {!supabase && (
            <div className="notice">
              {t("Integração ainda não configurada.")}
            </div>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!supabase) return;
              setBusy(true);
              setError("");
              const form = new FormData(e.currentTarget);
              try {
                const { error } = await supabase.auth.signInWithPassword({
                  email: String(form.get("email")),
                  password: String(form.get("password")),
                });
                if (error) throw error;
                router.push("/colaboradores/painel");
              } catch {
                setError(
                  "Não foi possível entrar. Verifique seus dados e tente novamente.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              {t("E-mail")}
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                disabled={!supabase || busy}
              />
            </label>
            <label className="field">
              {t("Senha")}
              <span className="password-field">
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  disabled={!supabase || busy}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t(show ? "Ocultar senha" : "Mostrar senha")}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </span>
            </label>
            {error && (
              <p className="error" role="alert">
                {t(error)}
              </p>
            )}
            <button className="primary-action" disabled={!supabase || busy}>
              {t(busy ? "Entrando…" : "Entrar")}
              <ArrowRight size={18} />
            </button>
          </form>
          <Link
            className="secondary-action"
            href="/colaboradores/painel?demo=1"
          >
            {t("Explorar demonstração")}
          </Link>
          <p>
            <small>
              {t("Novos acessos são fornecidos pela administração.")}
            </small>
          </p>
        </section>
      </div>
    </main>
  );
}
