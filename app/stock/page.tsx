"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { CategoryChips, Empty, Header, Sheet, Stepper, useToast } from "@/components/ui";
import { keyOf, type Part } from "@/lib/types";

export default function StockPage() {
  const { ready, parts, updatePart, deletePart, addItem } = useData();
  const { toast, show } = useToast();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = keyOf(query);
    return parts.filter((part) => {
      const byCategory = category === "Todos" || part.category === category;
      const byQuery = q.length === 0 || keyOf(part.name).includes(q);
      return byCategory && byQuery;
    });
  }, [parts, query, category]);

  const empty = parts.filter((p) => p.qty === 0).length;
  const editing = parts.find((p) => p.id === editingId) ?? null;

  return (
    <main className="px-4">
      <Header
        title="Stock"
        subtitle={
          parts.length === 0
            ? "Todavia no cargaste repuestos"
            : parts.length + " repuestos · " + empty + " sin stock"
        }
      />

      <div className="sticky top-[88px] z-20 -mx-4 bg-app/80 px-4 pb-2 pt-3 backdrop-blur-xl">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar repuesto"
            enterKeyHint="search"
            className="w-full rounded-xl border border-line bg-white py-3 pl-10 pr-10 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar busqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            >
              ✕
            </button>
          )}
        </div>
        <div className="mt-2">
          <CategoryChips value={category} onChange={setCategory} includeAll />
        </div>
      </div>

      <section className="mt-3">
        {!ready ? (
          <p className="py-10 text-center text-[14px] text-muted">Cargando...</p>
        ) : visible.length === 0 ? (
          <Empty
            title={parts.length === 0 ? "Stock vacio" : "Sin resultados"}
            hint={
              parts.length === 0
                ? "Carga tus repuestos desde la pestaña Agregar"
                : "Proba con otro nombre o cambia la categoria"
            }
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-sm">
            {visible.map((part) => (
              <li key={part.id} className="flex items-center gap-3 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setEditingId(part.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[17px] font-medium">{part.name}</p>
                  <p className="truncate text-[13px] text-muted">
                    {part.category}
                    {part.price ? " · $" + part.price.toLocaleString("es-AR") : ""}
                    {part.qty === 0 ? " · sin stock" : ""}
                  </p>
                </button>
                <Stepper
                  value={part.qty}
                  onChange={(next) => updatePart(part.id, { qty: next })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditSheet
        part={editing}
        onClose={() => setEditingId(null)}
        onSave={async (patch) => {
          if (!editing) return;
          await updatePart(editing.id, patch);
          setEditingId(null);
          show("Guardado");
        }}
        onDelete={async () => {
          if (!editing) return;
          await deletePart(editing.id);
          setEditingId(null);
          show("Repuesto eliminado");
        }}
        onBuy={async () => {
          if (!editing) return;
          await addItem({ name: editing.name, qty: 1 });
          setEditingId(null);
          show("Agregado a la lista de compra");
        }}
      />

      {toast}
    </main>
  );
}

function EditSheet({
  part,
  onClose,
  onSave,
  onDelete,
  onBuy,
}: {
  part: Part | null;
  onClose: () => void;
  onSave: (patch: Partial<Part>) => Promise<void>;
  onDelete: () => Promise<void>;
  onBuy: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Otro");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!part) return;
    setName(part.name);
    setCategory(part.category);
    setPrice(part.price ? String(part.price) : "");
  }, [part]);

  if (!part) return null;

  return (
    <Sheet open onClose={onClose} title="Editar repuesto">
      <div className="space-y-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-line bg-white px-3 py-3 text-[17px] outline-none focus:ring-2 focus:ring-brand/40"
        />
        <CategoryChips value={category} onChange={setCategory} />
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          inputMode="numeric"
          placeholder="Precio (opcional)"
          className="w-full rounded-xl border border-line bg-white px-3 py-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40"
        />

        <button
          type="button"
          onClick={() =>
            onSave({
              name: name.trim() || part.name,
              category,
              price: price.trim() ? Number(price) : null,
            })
          }
          className="w-full rounded-xl bg-brand py-3.5 text-[17px] font-semibold text-white"
        >
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={onBuy}
          className="w-full rounded-xl border border-line bg-white py-3.5 text-[16px] font-semibold text-brand"
        >
          Agregar a la lista de compra
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded-xl border border-danger/30 bg-white py-3.5 text-[16px] font-semibold text-danger"
        >
          Eliminar repuesto
        </button>
      </div>
    </Sheet>
  );
}
