"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { apiRequest } from "../lib/supabase";
import { usePreferences } from "./Preferences";

export default function AdminTeachers() {
  const { t } = usePreferences();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/me")
      .then((user) => {
        if (!active) return;
        if (!user.roles.includes("admin")) {
          router.replace(user.roles.includes("teacher") ? "/colaboradores/painel" : "/salas");
          return;
        }
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        if (caught instanceof Error && caught.message.includes("sessão")) {
          router.replace("/colaboradores?next=%2Fcolaboradores%2Fadministracao");
          return;
        }
        setError(caught instanceof Error ? caught.message : "Não foi possível conectar. Tente novamente.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest("/admin/teachers/invite", {
        email: email.trim(),
        display_name: name.trim(),
      });
      setNotice(`${t("Convite enviado para")} ${result.email}.`);
      setName("");
      setEmail("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível enviar o convite. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="portal" id="conteudo">
      <div className="portal-container admin-teachers-page">
        <div className="portal-top">
          <div>
            <span className="overline">SHOW ENGLISH • {t("COLABORADORES")}</span>
            <h1>{t("Administração de professores")}</h1>
            <p>{t("Envie um convite seguro. O professor criará a própria senha pelo e-mail.")}</p>
          </div>
          <Link className="secondary-action" href="/colaboradores/painel">
            <ArrowLeft size={17} />
            {t("Voltar à área do professor")}
          </Link>
        </div>
        {loading ? (
          <p role="status">{t("Carregando…")}</p>
        ) : (
          <form className="portal-card admin-invite-form" onSubmit={invite}>
            <h2>{t("Convidar professor")}</h2>
            <label className="field">
              {t("Nome completo")}
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={100}
                required
                disabled={busy}
              />
            </label>
            <label className="field">
              {t("E-mail")}
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
                disabled={busy}
              />
            </label>
            {error && <p className="error" role="alert">{t(error)}</p>}
            {notice && <p className="notice" role="status">{notice}</p>}
            <button className="primary-action" disabled={busy}>
              <UserPlus size={18} />
              {t(busy ? "Enviando convite…" : "Enviar convite")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}