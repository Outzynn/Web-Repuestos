"use client";

import { useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { Chips, Empty, Header, PrimaryButton, Stepper, useToast } from "@/components/ui";
import { keyOf, type ItemKind, type ShoppingItem } from "@/lib/types";

const KINDS: { id: ItemKind; label: string; plural: string }[] = [
  { id: "repuesto", label: "Repuesto", plural: "Repuestos" },
  { id: "producto", label: "Producto", plural: "Productos" },
];

export default function ComprarPage() {
  const { ready, items, products, addItem, updateItem, deleteItem, clearDone, receiveDone } =
    useData();
  const { toast, show } = useToast();

  const [name, setName] = useState("");
  const [kind, setKind] = useState<ItemKind>("repuesto");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);

  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);
  const doneProducts = done.filter((i) => i.kind === "producto").length;

  const suggestions = useMemo(() => {
    const query = keyOf(name);
    if (query.length < 2) return [];
    return products
      .filter((p) => keyOf(p.name).includes(query) && keyOf(p.name) !== query)
      .slice(0, 3);
  }, [name, products]);

  async function submit() {
    const clean = name.trim();
    if (!clean) return;
    await addItem({ name: clean, kind, qty, note });
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
    const linea = (item: ShoppingItem) => {
      const cantidad = item.qty > 1 ? item.qty + "x " : "";
      const nota = item.note ? " (" + item.note + ")" : "";
      return "- " + cantidad + item.name + nota;
    };
    const bloques = KINDS.map(({ id, plural }) => {
      const list = pending.filter((i) => i.kind === id);
      if (list.length === 0) return "";
      return plural + "\n" + list.map(linea).join("\n");
    }).filter(Boolean);
    const text = "Para comprar\n\n" + bloques.join("\n\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Para comprar", text }).catch(() => {});
      return;
    }
    navigator.clipboard
      ?.writeText(text)
      .then(() => show("Lista copiada"))
      .catch(() => show("No se pudo copiar"));
  }

  async function finishBuy() {
    const { stock, repuestos } = await receiveDone();
    if (stock === 0 && repuestos === 0) {
      show("Nada marcado como comprado");
      return;
    }
    const partes = [];
    if (stock > 0) partes.push(stock + (stock === 1 ? " producto al stock" : " productos al stock"));
    if (repuestos > 0) partes.push(repuestos + (repuestos === 1 ? " repuesto" : " repuestos"));
    show(partes.join(" · "));
  }

  const subtitle =
    pending.length === 0
      ? "Sin pendientes"
      : pending.length + (pending.length === 1 ? " cosa pendiente" : " cosas pendientes");

  return (
    <main className="px-4">
      <Header title="A comprar" subtitle={subtitle} />

      {/* Carga rapida: anotar en dos toques lo que falta */}
      <section className="mt-4 rounded-2xl bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder="Modulo A25, fundas, templados..."
            enterKeyHint="done"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl bg-app px-3 py-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40"
          />
          <Stepper value={qty} onChange={setQty} min={1} />
        </div>

        <div className="mt-2">
          <Chips
            options={KINDS.map((k) => k.label)}
            value={KINDS.find((k) => k.id === kind)?.label ?? "Repuesto"}
            onChange={(label) => {
              const found = KINDS.find((k) => k.label === label);
              if (found) setKind(found.id);
            }}
          />
          <p className="mt-1 px-1 text-[12px] text-muted">
            {kind === "producto"
              ? "Al marcarlo como comprado se suma al stock."
              : "Va a una reparacion: no entra al stock."}
          </p>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setName(product.name)}
                className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink"
              >
                {product.name}
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

        <div className="mt-3">
          <PrimaryButton onClick={submit} disabled={!name.trim()}>
            Agregar a la lista
          </PrimaryButton>
        </div>
      </section>

      <section className="mt-5">
        {!ready ? (
          <p className="py-10 text-center text-[14px] text-muted">Cargando...</p>
        ) : pending.length === 0 ? (
          <Empty title="No falta nada" hint="Anota lo que necesites cuando te lo pidan o se termine" />
        ) : (
          KINDS.map(({ id, plural }) => {
            const list = pending.filter((i) => i.kind === id);
            if (list.length === 0) return null;
            return (
              <div key={id} className="mb-5">
                <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
                  {plural} ({list.length})
                </h2>
                <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-sm">
                  {list.map((item) => (
                    <Row
                      key={item.id}
                      item={item}
                      stock={products.find((p) => keyOf(p.name) === keyOf(item.name))?.qty ?? 0}
                      onToggle={() => updateItem(item.id, { done: true })}
                      onQty={(next) => updateItem(item.id, { qty: next })}
                      onKind={(next) => updateItem(item.id, { kind: next })}
                      onDelete={() => deleteItem(item.id)}
                    />
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      {pending.length > 0 && (
        <button
          type="button"
          onClick={shareList}
          className="mt-1 w-full rounded-xl border border-line bg-card py-3.5 text-[16px] font-semibold text-brand"
        >
          Compartir / copiar lista
        </button>
      )}

      {done.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
            Comprados ({done.length})
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-sm">
            {done.map((item) => (
              <Row
                key={item.id}
                item={item}
                stock={0}
                onToggle={() => updateItem(item.id, { done: false })}
                onQty={(next) => updateItem(item.id, { qty: next })}
                onKind={(next) => updateItem(item.id, { kind: next })}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </ul>
          <p className="mt-2 px-1 text-[12px] text-muted">
            {doneProducts > 0
              ? doneProducts +
                (doneProducts === 1 ? " producto se suma" : " productos se suman") +
                " al stock. Los repuestos salen de la lista."
              : "Son todos repuestos: salen de la lista sin tocar el stock."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={finishBuy}
              className="flex-1 rounded-xl bg-ok py-3.5 text-[16px] font-semibold text-white"
            >
              Terminar compra
            </button>
            <button
              type="button"
              onClick={() => {
                clearDone();
                show("Comprados borrados");
              }}
              className="rounded-xl border border-line bg-card px-4 py-3.5 text-[16px] font-semibold text-muted"
            >
              Borrar
            </button>
          </div>
        </section>
      )}

      {toast}
    </main>
  );
}

function Row({
  item,
  stock,
  onToggle,
  onQty,
  onKind,
  onDelete,
}: {
  item: ShoppingItem;
  stock: number;
  onToggle: () => void;
  onQty: (next: number) => void;
  onKind: (next: ItemKind) => void;
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

        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left">
          <p
            className={
              "truncate text-[17px] " + (item.done ? "text-muted line-through" : "font-medium")
            }
          >
            {item.qty > 1 && <span className="text-brand">{item.qty}x </span>}
            {item.name}
            {item.done && item.kind === "producto" && (
              <span className="ml-2 rounded-full bg-app px-2 py-0.5 text-[11px] font-semibold text-brand no-underline">
                al stock
              </span>
            )}
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
        <div className="mt-2 space-y-2 pl-10">
          <div className="flex items-center justify-between gap-3">
            <Stepper value={item.qty} onChange={onQty} min={1} />
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-danger/30 px-3 py-2 text-[14px] font-semibold text-danger"
            >
              Eliminar
            </button>
          </div>
          <Chips
            options={KINDS.map((k) => k.label)}
            value={KINDS.find((k) => k.id === item.kind)?.label ?? "Repuesto"}
            onChange={(label) => {
              const found = KINDS.find((k) => k.label === label);
              if (found) onKind(found.id);
            }}
          />
        </div>
      )}
    </li>
  );
}
