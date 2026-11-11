"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { dictionary, type Locale } from "../lib/i18n";
type Settings = {
  size: number;
  contrast: boolean;
  motion: boolean;
  links: boolean;
};
const initial: Settings = {
  size: 100,
  contrast: false,
  motion: false,
  links: false,
};
const Context = createContext<{
  locale: Locale;
  setLocale: (v: Locale) => void;
  settings: Settings;
  setSettings: (v: Settings) => void;
  theme: "light" | "dark";
  setTheme: (v: "light" | "dark") => void;
  t: (s: string) => string;
}>({
  locale: "pt-BR",
  setLocale: () => {},
  settings: initial,
  setSettings: () => {},
  theme: "light",
  setTheme: () => {},
  t: (s) => s,
});
export const usePreferences = () => useContext(Context);
export function Preferences({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [settings, setSettings] = useState(initial);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setTheme(
        localStorage.getItem("show-theme") === "dark" ? "dark" : "light",
      );
      const lang = localStorage.getItem("show-language");
      if (lang && ["pt-BR", "en", "es", "fr", "it"].includes(lang))
        setLocale(lang as Locale);
      const stored = JSON.parse(
        localStorage.getItem("show-accessibility") || "null",
      );
      setSettings(
        stored
          ? {
              size:
                typeof stored.size === "number" && Number.isFinite(stored.size)
                  ? Math.min(200, Math.max(50, stored.size))
                  : 100,
              contrast: stored.contrast === true,
              motion: stored.motion === true,
              links: stored.links === true,
            }
          : {
              ...initial,
              motion: matchMedia("(prefers-reduced-motion: reduce)").matches,
            },
      );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.largeText = String(settings.size >= 150);
    document.documentElement.dataset.contrast = String(settings.contrast);
    document.documentElement.dataset.motion = String(settings.motion);
    document.documentElement.dataset.links = String(settings.links);
    document.documentElement.style.setProperty(
      "--text-scale",
      String(settings.size / 100),
    );
    document.title =
      "Show English | " +
      (dictionary[locale]?.["Aprenda inglês falando inglês"] ||
        "Aprenda inglês falando inglês");
    try {
      localStorage.setItem("show-theme", theme);
      localStorage.setItem("show-language", locale);
      localStorage.setItem("show-accessibility", JSON.stringify(settings));
    } catch {}
  }, [locale, settings, theme, ready]);
  useEffect(() => {
    const track = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href*="wa.me"]');
      if (a) {
        const w = window as unknown as { gtag?: (...args: unknown[]) => void };
        w.gtag?.("event", "conversion", {
          send_to: "AW-17833711571/LuSZCOnmluocENOv47dC",
        });
      }
    };
    document.addEventListener("click", track);
    return () => document.removeEventListener("click", track);
  }, []);
  const t = (s: string) => dictionary[locale]?.[s] || s;
  return (
    <Context.Provider
      value={{ locale, setLocale, settings, setSettings, theme, setTheme, t }}
    >
      {children}
    </Context.Provider>
  );
}
