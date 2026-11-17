"use client";

import { useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { Scanner, useScanner } from "@/components/Scanner";
import {
  AddButton,
  Chips,
  Empty,
  Field,
  GhostButton,
  Header,
  PrimaryButton,
  Sheet,
  Stepper,
  useToast,
} from "@/components/ui";
import { CATALOG } from "@/lib/catalog";
import { money, parseMoney } from "@/lib/format";
import { keyOf, type Product } from "@/lib/types";

export default function StockPage() {
  const { ready, products, addProduct, updateProduct, deleteProduct, addItem, importCatalog } =
    useData();
  const { toast, show } = useToast();
  const canScan = useScanner();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ barcode?: string } | null>(null);
  const [scanning, setScanning] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["Todos", ...[...set].sort((a, b) => a.localeCompare(b, "es"))];
  }, [products]);

  const visible = useMemo(() => {
    const q = keyOf(query);
    return products.filter((product) => {
      const byCategory = category === "Todos" || product.category === category;
      const byQuery =
        q.length === 0 ||
        keyOf(product.name).includes(q) ||
        (product.barcode ? keyOf(product.barcode).includes(q) : false);
      return byCategory && byQuery;
    });
  }, [products, query, category]);

  const capital = products.reduce((sum, p) => sum + (p.cost ?? 0) * p.qty, 0);
  const noStock = products.filter((p) => p.qty === 0).length;
  const sinCosto = products.filter((p) => p.cost === null).length;
  const editing = products.find((p) => p.id === editingId) ?? null;

  /** Cuanto falta por importar del catalogo del Excel. */
  const missing = useMemo(() => {
    const codes = new Set(products.filter((p) => p.barcode).map((p) => keyOf(p.barcode as string)));
    const names = new Set(products.map((p) => keyOf(p.name)));
    return CATALOG.filter(
      (entry) =>
        !(entry.barcode && codes.has(keyOf(entry.barcode))) && !names.has(keyOf(entry.name)),
    ).length;
  }, [products]);

  function onCode(code: string) {
    setScanning(false);
    const match = products.find((p) => p.barcode && keyOf(p.barcode) === keyOf(code));
    if (match) {
      setEditingId(match.id);
      return;
    }
    setAdding({ barcode: code });
  }

  return (
    <main className="px-4">
      <Header
        title="Stock"
        subtitle={
          products.length === 0
            ? "Todavia no hay productos"
            : products.length +
              (products.length === 1 ? " producto · " : " productos · ") +
              money(capital) +
              " en costo" +
              (sinCosto > 0 ? " · " + sinCosto + " sin costo" : "") +
              (noStock > 0 ? " · " + noStock + " sin stock" : "")
        }
        right={<AddButton onClick={() => setAdding({})} label="Cargar producto" />}
      />

      <div className="sticky top-[88px] z-20 -mx-4 bg-app/80 px-4 pb-2 pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
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
              placeholder="Buscar producto o codigo"
              enterKeyHint="search"
              autoComplete="off"
              className="w-full rounded-xl border border-line bg-card py-3 pl-10 pr-9 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40"
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
          {canScan && (
            <button
              type="button"
              onClick={() => setScanning(true)}
              aria-label="Escanear codigo"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-brand active:scale-95"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              >
                <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
                <path d="M7 12h10" />
              </svg>
            </button>
          )}
        </div>
        {categories.length > 1 && (
          <div className="mt-2">
            <Chips options={categories} value={category} onChange={setCategory} />
          </div>
        )}
      </div>

      <section className="mt-3">
        {!ready ? (
          <p className="py-10 text-center text-[14px] text-muted">Cargando...</p>
        ) : visible.length === 0 ? (
          <Empty
            title={products.length === 0 ? "Stock vacio" : "Sin resultados"}
            hint={
              products.length === 0
                ? "Toca + para cargar el primero"
                : "Proba con otro nombre o cambia la categoria"
            }
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-sm">
            {visible.map((product) => (
              <li key={product.id} className="flex items-center gap-3 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setEditingId(product.id)}
                  className="flex min-w-0 flex-1 items-center gap-1 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-medium">{product.name}</span>
                    <span className="block truncate text-[13px] text-muted">
                      {money(product.price)}
                      {product.category ? " · " + product.category : ""}
                      {product.qty === 0 && <span className="text-danger"> · sin stock</span>}
                      {product.cost === null && <span className="text-warn"> · sin costo</span>}
                    </span>
                  </span>
                  {/* La flecha avisa que tocando el producto se edita o se borra */}
                  <span className="shrink-0 text-muted">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 5 7 7-7 7" />
                    </svg>
                  </span>
                </button>
                <Stepper
                  value={product.qty}
                  onChange={(next) => updateProduct(product.id, { qty: next })}
                />
              </li>
            ))}
          </ul>
        )}

        {missing > 0 && (
          <button
            type="button"
            onClick={async () => {
              const added = await importCatalog();
              show(added + " productos importados del Excel");
            }}
            className="mt-4 w-full rounded-2xl border border-dashed border-brand/40 bg-brand/5 px-4 py-4 text-left"
          >
            <span className="block text-[15px] font-semibold text-brand">
              Importar el catalogo del Excel
            </span>
            <span className="mt-0.5 block text-[13px] text-muted">
              Agrega {missing} productos con precio, costo y codigo. No toca lo que ya tenes.
            </span>
          </button>
        )}
      </section>

      {editing && (
        <ProductSheet
          key={editing.id}
          product={editing}
          categories={categories.slice(1)}
          onClose={() => setEditingId(null)}
          onSave={async (patch) => {
            await updateProduct(editing.id, patch);
            setEditingId(null);
            show("Guardado");
          }}
          onDelete={async () => {
            if (!window.confirm("¿Eliminar " + editing.name + " del stock?")) return;
            await deleteProduct(editing.id);
            setEditingId(null);
            show("Producto eliminado");
          }}
          onBuy={async () => {
            await addItem({ name: editing.name, kind: "producto", qty: 1 });
            setEditingId(null);
            show("Agregado a la lista de compra");
          }}
        />
      )}

      {adding && (
        <ProductSheet
          barcode={adding.barcode}
          categories={categories.slice(1)}
          onClose={() => setAdding(null)}
          onSave={async (patch) => {
            const name = (patch.name ?? "").trim();
            if (!name) return;
            const existing = products.find((p) => keyOf(p.name) === keyOf(name));
            if (existing) {
              const qty = existing.qty + (patch.qty ?? 0);
              await updateProduct(existing.id, { qty });
              show(existing.name + ": ahora " + qty + " en stock");
            } else {
              await addProduct({
                name,
                category: patch.category ?? "",
                qty: patch.qty ?? 0,
                cost: patch.cost ?? null,
                price: patch.price ?? null,
                barcode: patch.barcode ?? null,
              });
              show("Producto cargado");
            }
            setAdding(null);
          }}
        />
      )}

      {scanning && <Scanner onCode={onCode} onClose={() => setScanning(false)} />}

      {toast}
    </main>
  );
}

type Patch = Partial<Omit<Product, "id" | "createdAt">>;

/** La misma ficha sirve para cargar y para editar: pocos campos y todos a la vista. */
function ProductSheet({
  product,
  barcode,
  categories,
  onClose,
  onSave,
  onDelete,
  onBuy,
}: {
  product?: Product;
  barcode?: string;
  categories: string[];
  onClose: () => void;
  onSave: (patch: Patch) => Promise<void>;
  onDelete?: () => Promise<void>;
  onBuy?: () => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [price, setPrice] = useState(product?.price ? String(product.price) : "");
  const [cost, setCost] = useState(product?.cost ? String(product.cost) : "");
  const [code, setCode] = useState(product?.barcode ?? barcode ?? "");
  const [qty, setQty] = useState(product ? product.qty : 1);

  return (
    <Sheet open onClose={onClose} title={product ? "Editar producto" : "Cargar producto"}>
      <div className="space-y-3">
        <Field
          label="Producto"
          value={name}
          onChange={setName}
          placeholder="Ej: Templado iPhone 13"
          autoFocus={!product}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio de venta" value={price} onChange={setPrice} placeholder="0" money />
          <Field label="Costo" value={cost} onChange={setCost} placeholder="0" money />
        </div>
        {parseMoney(cost) === null && (
          <p className="px-1 text-[13px] text-warn">
            Carga el costo: con eso la app calcula sola la ganancia de cada venta.
          </p>
        )}

        <div>
          <span className="mb-1 block px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
            {product ? "Cantidad" : "Cuantos entran"}
          </span>
          <div className="flex items-center justify-between rounded-xl border border-line bg-card px-3 py-2">
            <span className="text-[15px] text-muted">unidades</span>
            <Stepper value={qty} onChange={setQty} />
          </div>
        </div>

        <Field label="Categoria (opcional)" value={category} onChange={setCategory} placeholder="Ej: Perifericos" />
        {categories.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className="shrink-0 rounded-full border border-line bg-card px-3 py-1.5 text-[13px]"
              >
                {option}
              </button>
            ))}
          </div>
        )}

        <Field
          label="Codigo de barras (opcional)"
          value={code}
          onChange={setCode}
          placeholder="Escaneado o a mano"
        />

        <PrimaryButton
          onClick={() =>
            onSave({
              name: name.trim(),
              category: category.trim(),
              qty,
              price: parseMoney(price),
              cost: parseMoney(cost),
              barcode: code.trim() ? code.trim() : null,
            })
          }
          disabled={!name.trim() || parseMoney(cost) === null}
        >
          {product ? "Guardar cambios" : "Cargar al stock"}
        </PrimaryButton>

        {onBuy && <GhostButton onClick={onBuy}>Agregar a la lista de compra</GhostButton>}
        {onDelete && (
          <GhostButton onClick={onDelete} tone="danger">
            Eliminar producto
          </GhostButton>
        )}
      </div>
    </Sheet>
  );
}
