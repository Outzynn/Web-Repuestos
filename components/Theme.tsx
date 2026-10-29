"use client";

import { useEffect, useState } from "react";

export const THEME_KEY = "repuestos.theme";

/**
 * Corre antes de pintar la pantalla para que no haya un flash blanco al abrir
 * en modo oscuro. Sin eleccion guardada, sigue al sistema.
 */
export const themeScript = `(function(){try{var s=localStorage.getItem('${THEME_KEY}');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(isDark());

    // Mientras no haya eleccion manual, acompaña al sistema.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange(event: MediaQueryListEvent) {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {
        /* sin localStorage seguimos al sistema igual */
      }
      applyDark(event.matches);
      setDark(event.matches);
    }
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  function toggle() {
    const next = !isDark();
    applyDark(next);
    setDark(next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* no se recuerda, pero el cambio se aplica igual */
    }
  }

  // Hasta saber el tema real no dibujamos el icono, para no mostrar el equivocado.
  if (dark === null) return <span className="h-9 w-9" aria-hidden />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Usar tema claro" : "Usar tema oscuro"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-muted active:scale-95"
    >
      {dark ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
