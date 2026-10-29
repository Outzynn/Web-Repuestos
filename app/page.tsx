"use client";

import { useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { InstallApp } from "@/components/InstallApp";
import { Empty, Header, Stepper, useToast } from "@/components/ui";
import { keyOf, type ShoppingItem } from "@/lib/types";

export default function ComprarPage() {
  const {
    ready,
    mode,
    error,
    items,
    parts,
    addItem,
    updateItem,
    deleteItem,
    clearDone,
    receiveDone,
  } = useData();
  const { toast, show } = useToast();

  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);

  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  const suggestions = useMemo(() => {
    const query = keyOf(name);
    if (query.length < 2) return [];
    return parts
      .filter((p) => keyOf(p.name).includes(query) && keyOf(p.name) !== query)
      .slice(0, 3);
  }, [name, parts]);

  async function submit() {
    const clean = name.trim();
    if (!clean) return;
    await addItem({ name: clean, qty, note });
    setName("");
    setQty(1);
    setNote("");
    setNoteOpen(false);
    show("Agregado a la lista");
  }

  function shareList() {
    if (pending.length === 0) {
      show("La lista esta vacia");
      return;
    }
    const lines = pending.map((i) => {
      const cantidad = i.qty > 1 ? i.qty + "x " : "";
      const nota = i.note ? " (" + i.note + ")" : "";
      return "- " + cantidad + i.name + nota;
    });
    const text = "Repuestos a comprar\n" + lines.join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Repuestos a comprar", text }).catch(() => {});
      return;
    }
    navigator.clipboard
      ?.writeText(text)
      .then(() => show("Lista copiada"))
      .catch(() => show("No se pudo copiar"));
  }

  async function intoStock() {
    const count = await receiveDone();
    show(count > 0 ? count + " repuesto(s) al stock" : "Nada marcado como comprado");
  }

  const subtitle =
    pending.length === 0
      ? "Sin pendientes"
      : pending.length + (pending.length === 1 ? " repuesto pendiente" : " repuestos pendientes");

  return (
    <main className="px-4">
      <Header
        title="A comprar"
        subtitle={subtitle}
        right={
          <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-muted">
            {mode === "cloud" ? "Nube" : mode === "local" ? "Este equipo" : "..."}
          </span>
        }
      />

      {error && (
        <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>
      )}

      {/* Carga rapida: la pantalla mas usada de la app */}
      <section className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder="Modulo A25, bateria iPhone 11..."
            enterKeyHint="done"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl bg-app px-3 py-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40"
          />
          <Stepper value={qty} onChange={setQty} min={1} />
        </div>

        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((part) => (
              <button
                key={part.id}
                type="button"
                onClick={() => setName(part.name)}
                className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink"
              >
                {part.name}
              </button>
            ))}
          </div>
        )}

        {noteOpen ? (
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Para quien / equipo (opcional)"
            className="mt-2 w-full rounded-xl bg-app px-3 py-2.5 text-[15px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40"
          />
        ) : (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="mt-2 text-[13px] font-medium text-brand"
          >
            + Agregar nota
          </button>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!name.trim()}
          className="mt-3 w-full rounded-xl bg-brand py-3.5 text-[17px] font-semibold text-white disabled:opacity-40"
        >
          Agregar a la lista
        </button>
      </section>

      <section className="mt-5">
        {!ready ? (
          <p className="py-10 text-center text-[14px] text-muted">Cargando...</p>
        ) : pending.length === 0 ? (
          <Empty
            title="No falta nada"
            hint="Anota lo que necesites cuando entre un equipo a reparar"
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-sm">
            {pending.map((item) => (
              <Row
                key={item.id}
                item={item}
                stock={parts.find((p) => keyOf(p.name) === keyOf(item.name))?.qty ?? 0}
                onToggle={() => updateItem(item.id, { done: true })}
                onQty={(next) => updateItem(item.id, { qty: next })}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {pending.length > 0 && (
        <button
          type="button"
          onClick={shareList}
          className="mt-4 w-full rounded-xl border border-line bg-white py-3.5 text-[16px] font-semibold text-brand"
        >
          Compartir / copiar lista
        </button>
      )}

      {done.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
            Comprados ({done.length})
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-sm">
            {done.map((item) => (
              <Row
                key={item.id}
                item={item}
                stock={0}
                onToggle={() => updateItem(item.id, { done: false })}
                onQty={(next) => updateItem(item.id, { qty: next })}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={intoStock}
              className="flex-1 rounded-xl bg-ok py-3.5 text-[16px] font-semibold text-white"
            >
              Pasar al stock
            </button>
            <button
              type="button"
              onClick={() => {
                clearDone();
                show("Comprados borrados");
              }}
              className="rounded-xl border border-line bg-white px-4 py-3.5 text-[16px] font-semibold text-muted"
            >
              Borrar
            </button>
          </div>
        </section>
      )}

      <InstallApp />

      {toast}
    </main>
  );
}

function Row({
  item,
  stock,
  onToggle,
  onQty,
  onDelete,
}: {
  item: ShoppingItem;
  stock: number;
  onToggle: () => void;
  onQty: (next: number) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="px-3 py-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={item.done ? "Desmarcar" : "Marcar como comprado"}
          className={
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 " +
            (item.done ? "border-ok bg-ok text-white" : "border-line text-transparent")
          }
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 13 4 4L19 7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p
            className={
              "truncate text-[17px] " + (item.done ? "text-muted line-through" : "font-medium")
            }
          >
            {item.qty > 1 && <span className="text-brand">{item.qty}x </span>}
            {item.name}
          </p>
          {item.note && <p className="truncate text-[13px] text-muted">{item.note}</p>}
          {!item.done && stock > 0 && (
            <p className="text-[12px] font-medium text-warn">Ya hay {stock} en stock</p>
          )}
        </button>

        {!open && (
          <span className="shrink-0 px-2 text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </span>
        )}
      </div>

      {open && (
        <div className="mt-2 flex items-center justify-between gap-3 pl-10">
          <Stepper value={item.qty} onChange={onQty} min={1} />
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-danger/30 px-3 py-2 text-[14px] font-semibold text-danger"
          >
            Eliminar
          </button>
        </div>
      )}
    </li>
  );
}
