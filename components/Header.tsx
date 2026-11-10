"use client";
import Link from "next/link";
import {
  Accessibility,
  Globe2,
  Menu,
  X,
  ArrowUpRight,
  Moon,
  Sun,
  Minus,
  Plus,
  RotateCcw,
  Contrast,
  Sparkles,
  Link2,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { usePreferences } from "./Preferences";
import type { Locale } from "../lib/i18n";
export default function Header() {
  const { t, locale, setLocale, settings, setSettings, theme, setTheme } =
    usePreferences();
  const modal = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [modalOpen]);
  function openPreferences() {
    modal.current?.showModal();
    setModalOpen(true);
  }
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
              aria-haspopup="dialog"
              aria-controls="accessibility-modal"
              onClick={openPreferences}
            >
              <Accessibility size={21} />
            </button>
            <button
              className="icon-button theme-toggle"
              aria-label={t(
                theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro",
              )}
              title={t(
                theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro",
              )}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}
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
        id="accessibility-modal"
        className="preferences-dialog"
        ref={modal}
        aria-labelledby="preferences-title"
        aria-describedby="preferences-description"
        onClose={() => {
          setModalOpen(false);
          opener.current?.focus();
        }}
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
        <p id="preferences-description">
          {t("Deixe o site confortável para você.")}
        </p>
        <section className="font-setting" aria-labelledby="font-title">
          <div className="font-setting-heading">
            <span id="font-title">{t("Tamanho do texto")}</span>
            <output aria-live="polite" aria-label={t("Tamanho do texto")}>
              {settings.size}%
            </output>
          </div>
          <div className="font-buttons">
            <button
              className="font-step"
              aria-label={t("Diminuir fonte")}
              disabled={settings.size <= 50}
              onClick={() =>
                setSettings({
                  ...settings,
                  size: Math.max(50, settings.size - 10),
                })
              }
            >
              <Minus size={18} aria-hidden="true" />
              <span>A−</span>
            </button>
            <button
              className="font-default"
              onClick={() => setSettings({ ...settings, size: 100 })}
            >
              {t("Padrão")}
              <span>100%</span>
            </button>
            <button
              className="font-step"
              aria-label={t("Aumentar fonte")}
              disabled={settings.size >= 200}
              onClick={() =>
                setSettings({
                  ...settings,
                  size: Math.min(200, settings.size + 10),
                })
              }
            >
              <span>A+</span>
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="font-range-labels">
            <span>50%</span>
            <span>200%</span>
          </div>
          <input
            type="range"
            className="font-range"
            min="50"
            max="200"
            step="10"
            value={settings.size}
            aria-label={t("Tamanho do texto")}
            aria-valuetext={`${settings.size}%`}
            onChange={(e) =>
              setSettings({ ...settings, size: Number(e.target.value) })
            }
          />
        </section>
        {(
          [
            ["contrast", "Alto contraste", Contrast],
            ["motion", "Reduzir movimento", Sparkles],
            ["links", "Destacar links", Link2],
          ] as const
        ).map(([key, label, Icon]) => (
          <label className="preference-row" key={key}>
            <span className="preference-label">
              <Icon size={21} aria-hidden="true" />
              {t(label)}
            </span>
            <input
              role="switch"
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
          <RotateCcw size={18} aria-hidden="true" />
          {t("Restaurar preferências")}
        </button>
      </dialog>
    </>
  );
}
