"use client";

import { useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { CategoryChips, Header, Stepper, useToast } from "@/components/ui";
import { keyOf } from "@/lib/types";

export default function AgregarPage() {
  const { parts, addPart, updatePart } = useData();
  const { toast, show } = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Celular");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");

  // Si el repuesto ya existe, sumamos al que esta cargado en vez de duplicarlo.
  const existing = useMemo(() => {
    const key = keyOf(name);
    if (!key) return null;
    return parts.find((p) => keyOf(p.name) === key) ?? null;
  }, [name, parts]);

  async function save() {
    const clean = name.trim();
    if (!clean) return;

    if (existing) {
      await updatePart(existing.id, { qty: existing.qty + qty });
      show("Sumado: " + existing.name + " ahora " + (existing.qty + qty));
    } else {
      await addPart({
        name: clean,
        category,
        qty,
        price: price.trim() ? Number(price) : null,
      });
      show("Repuesto cargado");
    }

    setName("");
    setQty(1);
    setPrice("");
  }

  return (
    <main className="px-4">
      <Header title="Agregar" subtitle="Carga un repuesto al stock" />

      <section className="mt-4 space-y-4 rounded-2xl bg-card p-4 shadow-sm">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-muted" htmlFor="nombre">
            Repuesto
          </label>
          <input
            id="nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Modulo A25, flex de carga J7..."
            autoComplete="off"
            className="w-full rounded-xl bg-app px-3 py-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40"
          />
          {existing && (
            <p className="mt-1.5 text-[13px] font-medium text-warn">
              Ya existe con {existing.qty} en stock: se suma a ese.
            </p>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-muted">Categoria</p>
          <CategoryChips value={category} onChange={setCategory} />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-muted">Cantidad</p>
          <Stepper value={qty} onChange={setQty} min={1} />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-muted" htmlFor="precio">
            Precio de costo (opcional)
          </label>
          <input
            id="precio"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="numeric"
            placeholder="0"
            className="w-full rounded-xl bg-app px-3 py-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40"
          />
        </div>

        <button
          type="button"
          onClick={save}
          disabled={!name.trim()}
          className="w-full rounded-xl bg-brand py-3.5 text-[17px] font-semibold text-white disabled:opacity-40"
        >
          {existing ? "Sumar al stock" : "Guardar repuesto"}
        </button>
      </section>

      <p className="mt-3 px-1 text-[13px] text-muted">
        Tip: lo que compres podes marcarlo en la lista de compra y pasarlo al stock de una vez.
      </p>

      {toast}
    </main>
  );
}
