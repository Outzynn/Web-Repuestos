"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadLocal, saveLocal } from "@/lib/local";
import { keyOf, newId, type Mode, type Part, type ShoppingItem, type Snapshot } from "@/lib/types";

type NewPart = { name: string; category: string; qty: number; price?: number | null; note?: string | null };
type NewItem = { name: string; qty: number; note?: string | null };

type Ctx = {
  ready: boolean;
  mode: Mode;
  parts: Part[];
  items: ShoppingItem[];
  error: string | null;
  addPart: (input: NewPart) => Promise<void>;
  updatePart: (id: string, patch: Partial<Part>) => Promise<void>;
  deletePart: (id: string) => Promise<void>;
  addItem: (input: NewItem) => Promise<void>;
  updateItem: (id: string, patch: Partial<ShoppingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearDone: () => Promise<void>;
  receiveDone: () => Promise<number>;
};

const DataContext = createContext<Ctx | null>(null);

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}`);
  return res;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ parts: [], items: [] });
  const [mode, setMode] = useState<Mode>("unknown");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = useRef<Snapshot>(snapshot);
  const modeRef = useRef<Mode>("unknown");

  const put = useCallback((next: Snapshot) => {
    current.current = next;
    setSnapshot(next);
    if (modeRef.current === "local") saveLocal(next);
  }, []);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      const data = (await res.json()) as { mode: Mode } & Snapshot;
      if (data.mode === "cloud") {
        modeRef.current = "cloud";
        setMode("cloud");
        current.current = { parts: data.parts, items: data.items };
        setSnapshot(current.current);
        return;
      }
      throw new Error("sin nube");
    } catch {
      modeRef.current = "local";
      setMode("local");
      const local = loadLocal();
      current.current = local;
      setSnapshot(local);
    }
  }, []);

  useEffect(() => {
    reload().finally(() => setReady(true));
  }, [reload]);

  // En modo nube, al volver a la app traemos lo que hayan cargado desde otro telefono.
  useEffect(() => {
    function refresh() {
      if (modeRef.current === "cloud" && document.visibilityState === "visible") {
        reload();
      }
    }
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [reload]);

  /** Aplica el cambio en pantalla al instante y lo persiste despues. */
  const apply = useCallback(
    async (next: Snapshot, remote: () => Promise<unknown>) => {
      put(next);
      if (modeRef.current !== "cloud") return;
      try {
        await remote();
        setError(null);
      } catch {
        setError("No se pudo guardar en la nube. Reintenta.");
        await reload();
      }
    },
    [put, reload],
  );

  const addPart = useCallback(
    async (input: NewPart) => {
      const part: Part = {
        id: newId(),
        name: input.name.trim(),
        category: input.category,
        qty: input.qty,
        price: input.price ?? null,
        note: input.note ?? null,
        createdAt: new Date().toISOString(),
      };
      const parts = [...current.current.parts, part].sort((a, b) =>
        a.name.localeCompare(b.name, "es"),
      );
      await apply({ ...current.current, parts }, () => send("/api/parts", "POST", part));
    },
    [apply],
  );

  const updatePart = useCallback(
    async (id: string, patch: Partial<Part>) => {
      const parts = current.current.parts
        .map((p) => (p.id === id ? { ...p, ...patch } : p))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));
      await apply({ ...current.current, parts }, () =>
        send(`/api/parts/${id}`, "PATCH", patch),
      );
    },
    [apply],
  );

  const deletePart = useCallback(
    async (id: string) => {
      const parts = current.current.parts.filter((p) => p.id !== id);
      await apply({ ...current.current, parts }, () => send(`/api/parts/${id}`, "DELETE"));
    },
    [apply],
  );

  const addItem = useCallback(
    async (input: NewItem) => {
      const item: ShoppingItem = {
        id: newId(),
        name: input.name.trim(),
        qty: input.qty,
        note: input.note?.trim() ? input.note.trim() : null,
        done: false,
        createdAt: new Date().toISOString(),
      };
      const items = [item, ...current.current.items];
      await apply({ ...current.current, items }, () => send("/api/shopping", "POST", item));
    },
    [apply],
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<ShoppingItem>) => {
      const items = current.current.items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      await apply({ ...current.current, items }, () =>
        send(`/api/shopping/${id}`, "PATCH", patch),
      );
    },
    [apply],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const items = current.current.items.filter((i) => i.id !== id);
      await apply({ ...current.current, items }, () => send(`/api/shopping/${id}`, "DELETE"));
    },
    [apply],
  );

  const clearDone = useCallback(async () => {
    const items = current.current.items.filter((i) => !i.done);
    await apply({ ...current.current, items }, () =>
      send("/api/shopping/clear-done", "POST"),
    );
  }, [apply]);

  /** Suma al stock todo lo marcado como comprado y limpia esos renglones. */
  const receiveDone = useCallback(async () => {
    const done = current.current.items.filter((i) => i.done);
    if (done.length === 0) return 0;

    for (const item of done) {
      const match = current.current.parts.find((p) => keyOf(p.name) === keyOf(item.name));
      if (match) {
        await updatePart(match.id, { qty: match.qty + item.qty });
      } else {
        await addPart({ name: item.name, category: "Otro", qty: item.qty });
      }
    }
    await clearDone();
    return done.length;
  }, [addPart, clearDone, updatePart]);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      mode,
      parts: snapshot.parts,
      items: snapshot.items,
      error,
      addPart,
      updatePart,
      deletePart,
      addItem,
      updateItem,
      deleteItem,
      clearDone,
      receiveDone,
    }),
    [
      ready,
      mode,
      snapshot,
      error,
      addPart,
      updatePart,
      deletePart,
      addItem,
      updateItem,
      deleteItem,
      clearDone,
      receiveDone,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): Ctx {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData fuera de DataProvider");
  return ctx;
}
