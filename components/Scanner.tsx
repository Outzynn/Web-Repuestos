"use client";

import { useEffect, useRef, useState } from "react";

type Detected = { rawValue: string };
type Detector = { detect: (source: HTMLVideoElement) => Promise<Detected[]> };
type DetectorCtor = new (options: { formats: string[] }) => Detector;

function detectorCtor(): DetectorCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  return ctor ?? null;
}

/** El lector de codigos solo existe en algunos navegadores (Chrome de Android). */
export function useScanner(): boolean {
  const [can, setCan] = useState(false);
  useEffect(() => {
    setCan(Boolean(detectorCtor() && navigator.mediaDevices?.getUserMedia));
  }, []);
  return can;
}

/** Camara a pantalla completa: avisa el primer codigo que lee y se cierra. */
export function Scanner({
  onCode,
  onClose,
}: {
  onCode: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const ctor = detectorCtor();
    if (!ctor) {
      setProblem("Este telefono no puede leer codigos.");
      return;
    }

    let stream: MediaStream | null = null;
    let timer: number | null = null;
    let done = false;

    const detector = new ctor({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code", "itf"],
    });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        timer = window.setInterval(async () => {
          if (done || !videoRef.current) return;
          try {
            const found = await detector.detect(videoRef.current);
            const code = found[0]?.rawValue?.trim();
            if (code) {
              done = true;
              onCode(code);
            }
          } catch {
            /* un cuadro ilegible no es problema: sigue intentando */
          }
        }, 350);
      } catch {
        setProblem("No se pudo abrir la camara. Revisa el permiso.");
      }
    })();

    return () => {
      done = true;
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onCode]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <video ref={videoRef} playsInline muted className="h-full w-full flex-1 object-cover" />

      <div className="pointer-events-none absolute inset-x-10 top-1/3 h-36 rounded-2xl border-2 border-white/80" />

      {problem && (
        <p className="absolute inset-x-6 top-1/2 rounded-xl bg-black/70 p-4 text-center text-[15px] text-white">
          {problem}
        </p>
      )}

      <div className="safe-bottom absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent pb-6 pt-10">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white px-8 py-3 text-[16px] font-semibold text-black"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
