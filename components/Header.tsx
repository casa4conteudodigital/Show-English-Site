"use client";
import Link from "next/link";
import { Accessibility, Globe2, Menu, X, ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import { usePreferences } from "./Preferences";
import type { Locale } from "../lib/i18n";
export default function Header() {
  const { t, locale, setLocale, settings, setSettings } = usePreferences();
  const modal = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <a className="skip-link" href="#conteudo">
        {t("Pular para o conteúdo")}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" aria-label="Show English">
            <img
              className="brand"
              src="/assets/new-logo-show-english.png"
              alt="Show English"
            />
          </Link>
          <nav
            aria-label={t("Navegação principal")}
            className={open ? "header-nav is-open" : "header-nav"}
            id="navigation"
          >
            {[
              ["como-funciona", "Como funciona"],
              ["duvidas-frequentes", "Dúvidas"],
              ["programacao", "Programação"],
              ["professor", "Professor"],
              ["depoimentos", "Depoimentos"],
              ["planos", "Planos"],
            ].map(([id, label]) => (
              <Link key={id} href={"/#" + id} onClick={() => setOpen(false)}>
                {t(label)}
              </Link>
            ))}
          </nav>
          <div className="header-tools">
            <button
              className="icon-button"
              ref={opener}
              aria-label={t("Acessibilidade")}
              onClick={() => modal.current?.showModal()}
            >
              <Accessibility size={21} />
            </button>
            <label className="language-control">
              <Globe2 size={19} aria-hidden="true" />
              <span className="sr-only">{t("Idioma")}</span>
              <select
                aria-label={t("Idioma")}
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
              >
                <option value="pt-BR">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="it">Italiano</option>
              </select>
            </label>
            <Link className="staff-link" href="/colaboradores">
              {t("Colaboradores")}
              <ArrowUpRight size={16} />
            </Link>
            <a
              className="header-whatsapp"
              href="https://wa.me/5511967398084"
              target="_blank"
              rel="noopener"
            >
              WhatsApp
            </a>
            <button
              className="icon-button menu-toggle"
              aria-label={t("Menu")}
              aria-expanded={open}
              aria-controls="navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <dialog
        className="preferences-dialog"
        ref={modal}
        aria-labelledby="preferences-title"
        onClose={() => opener.current?.focus()}
      >
        <div className="dialog-heading">
          <div>
            <span className="overline">SHOW ENGLISH</span>
            <h2 id="preferences-title">{t("Acessibilidade")}</h2>
          </div>
          <button
            className="icon-button"
            aria-label={t("Fechar")}
            onClick={() => modal.current?.close()}
          >
            <X />
          </button>
        </div>
        <p>{t("Deixe o site confortável para você.")}</p>
        <label className="field">
          {t("Tamanho do texto")}
          <select
            value={settings.size}
            onChange={(e) =>
              setSettings({ ...settings, size: Number(e.target.value) })
            }
          >
            <option value="100">{t("Padrão")}</option>
            <option value="115">{t("Ampliado")}</option>
            <option value="130">{t("Muito ampliado")}</option>
          </select>
        </label>
        {(
          [
            ["contrast", "Alto contraste"],
            ["motion", "Reduzir movimento"],
            ["links", "Destacar links"],
          ] as const
        ).map(([key, label]) => (
          <label className="preference-row" key={key}>
            {t(label)}
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) =>
                setSettings({ ...settings, [key]: e.target.checked })
              }
            />
          </label>
        ))}
        <button
          className="secondary-action"
          onClick={() =>
            setSettings({
              size: 100,
              contrast: false,
              motion: matchMedia("(prefers-reduced-motion: reduce)").matches,
              links: false,
            })
          }
        >
          {t("Restaurar preferências")}
        </button>
      </dialog>
    </>
  );
}
