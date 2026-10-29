"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "repuestos.install.dismissed";

/** Registra el service worker: con eso la app se puede instalar y abrir sin señal. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sin service worker la app igual funciona */
    });
  }, []);

  return null;
}

/** Aviso para agregar la app a la pantalla de inicio del telefono. */
export function InstallApp() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      /* sin localStorage mostramos el aviso igual */
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIos(ios);
    if (ios) setVisible(true);

    function onPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setVisible(false));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* nada: solo no se recuerda el descarte */
    }
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-3">
      <span className="mt-0.5 shrink-0 text-brand">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
          <path d="M12 7v7m0 0 2.5-2.5M12 14l-2.5-2.5" />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">Instalar en el telefono</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {isIos && !installEvent
            ? "Toca Compartir y despues Agregar a inicio."
            : "Queda como una app, abre mas rapido y funciona sin señal."}
        </p>
        {installEvent && (
          <button
            type="button"
            onClick={install}
            className="mt-2 rounded-lg bg-brand px-4 py-2 text-[14px] font-semibold text-white"
          >
            Instalar
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar aviso"
        className="shrink-0 px-1 text-[18px] leading-none text-muted"
      >
        ✕
      </button>
    </div>
  );
}
