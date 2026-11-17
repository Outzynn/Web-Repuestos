"use client";

import { useCallback, useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { InstallApp } from "@/components/InstallApp";
import { Scanner, useScanner } from "@/components/Scanner";
import {
  Chips,
  Empty,
  Field,
  Header,
  PrimaryButton,
  Sheet,
  Stepper,
  useToast,
} from "@/components/ui";
import { money, parseMoney } from "@/lib/format";
import {
  keyOf,
  newId,
  PAY_METHODS,
  type PayMethod,
  type Product,
  type SaleLine,
} from "@/lib/types";

type CartLine = SaleLine & { key: string };

export default function VenderPage() {
  const { ready, mode, error, products, sales, registerSale } = useData();
  const { toast, show } = useToast();
  const canScan = useScanner();

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pay, setPay] = useState<PayMethod>("Efectivo");
  const [note, setNote] = useState("");
  const [scanning, setScanning] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [freeOpen, setFreeOpen] = useState(false);

  const total = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const units = cart.reduce((sum, line) => sum + line.qty, 0);

  /** Lo que mas sale: para vender con un solo toque sin buscar nada. */
  const frequent = useMemo(() => {
    const score = new Map<string, number>();
    for (const sale of sales.slice(0, 120)) {
      for (const line of sale.lines) {
        if (line.productId) {
          score.set(line.productId, (score.get(line.productId) ?? 0) + line.qty);
        }
      }
    }
    return [...products]
      .filter((p) => p.qty > 0)
      .sort((a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0) || b.qty - a.qty)
      .slice(0, 8);
  }, [products, sales]);

  const results = useMemo(() => {
    const q = keyOf(query);
    if (!q) return [];
    return products
      .filter((p) => keyOf(p.name).includes(q) || (p.barcode && keyOf(p.barcode).includes(q)))
      .slice(0, 10);
  }, [products, query]);

  const addLine = useCallback((product: Product) => {
    setCart((prev) => {
      const found = prev.find((line) => line.productId === product.id);
      if (found) {
        return prev.map((line) =>
          line.key === found.key ? { ...line, qty: line.qty + 1 } : line,
        );
      }
      return [
        ...prev,
        {
          key: newId(),
          productId: product.id,
          name: product.name,
          qty: 1,
          price: product.price ?? 0,
          cost: product.cost,
        },
      ];
    });
    setQuery("");
  }, []);

  function onProduct(product: Product) {
    addLine(product);
    if (product.price === null) {
      setCheckout(true);
      show("Sin precio cargado: ponelo en el ticket");
    }
  }

  const onCode = useCallback(
    (code: string) => {
      setScanning(false);
      const match = products.find((p) => p.barcode && keyOf(p.barcode) === keyOf(code));
      if (match) {
        addLine(match);
        show(match.name);
        return;
      }
      setQuery(code);
      show("Codigo nuevo: buscalo o cargalo en Stock");
    },
    [addLine, products, show],
  );

  function setQty(key: string, qty: number) {
    setCart((prev) =>
      qty === 0
        ? prev.filter((line) => line.key !== key)
        : prev.map((line) => (line.key === key ? { ...line, qty } : line)),
    );
  }

  function setPrice(key: string, text: string) {
    const price = parseMoney(text) ?? 0;
    setCart((prev) => prev.map((line) => (line.key === key ? { ...line, price } : line)));
  }

  async function cobrar() {
    if (cart.length === 0) return;
    const lines = cart.map(({ key: _key, ...line }) => line);
    await registerSale({ lines, pay, note });
    setCart([]);
    setNote("");
    setCheckout(false);
    show("Venta de " + money(total) + " registrada");
  }

  return (
    <main className="px-4">
      <Header
        title="Vender"
        subtitle={units > 0 ? units + " en el ticket · " + money(total) : "Buscá, escaneá y cobrá"}
        right={
          <span className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-semibold text-muted">
            {mode === "cloud" ? "Nube" : mode === "local" ? "Este equipo" : "..."}
          </span>
        }
      />

      {error && (
        <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>
      )}

      {/* Buscador: el centro de la pantalla mas usada */}
      <section className="mt-4 rounded-2xl bg-card p-3 shadow-sm">
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
              className="w-full rounded-xl bg-app py-3 pl-10 pr-9 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpiar"
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
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-app text-brand active:scale-95"
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

        <button
          type="button"
          onClick={() => setFreeOpen(true)}
          className="mt-2 px-1 text-[13px] font-medium text-brand"
        >
          + Vender algo que no esta en el stock
        </button>
      </section>

      <section className="mt-4">
        {!ready ? (
          <p className="py-10 text-center text-[14px] text-muted">Cargando...</p>
        ) : query ? (
          results.length === 0 ? (
            <Empty
              title="Sin resultados"
              hint="Podes venderlo igual con «Vender algo que no esta en el stock»"
            />
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-sm">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => onProduct(product)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-app"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[17px] font-medium">{product.name}</span>
                      <span className="block truncate text-[13px] text-muted">
                        {product.qty > 0 ? product.qty + " en stock" : "sin stock"}
                        {product.category ? " · " + product.category : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[17px] font-semibold tabular-nums">
                        {money(product.price)}
                      </span>
                      <span className="text-[12px] font-semibold text-brand">Agregar</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : products.length === 0 ? (
          <Empty
            title="Todavia no hay productos"
            hint="Cargalos desde Stock o importa el catalogo del Excel"
          />
        ) : (
          <>
            <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
              Lo que mas vendes
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {frequent.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onProduct(product)}
                  className="rounded-2xl bg-card p-3 text-left shadow-sm active:scale-[0.98]"
                >
                  <span className="line-clamp-2 block text-[15px] font-medium leading-snug">
                    {product.name}
                  </span>
                  <span className="mt-1 block text-[15px] font-semibold tabular-nums text-brand">
                    {money(product.price)}
                  </span>
                  <span className="block text-[12px] text-muted">{product.qty} en stock</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <InstallApp />

      {/* Espacio para que la barra del ticket no tape el contenido */}
      {cart.length > 0 && <div className="h-20" />}

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-40 px-3">
          <button
            type="button"
            onClick={() => setCheckout(true)}
            className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-brand px-4 py-3 text-white shadow-lg active:scale-[0.99]"
          >
            <span className="text-left">
              <span className="block text-[12px] opacity-80">
                {units === 1 ? "1 producto" : units + " productos"}
              </span>
              <span className="block text-[20px] font-bold tabular-nums">{money(total)}</span>
            </span>
            <span className="rounded-xl bg-white/20 px-4 py-2 text-[16px] font-semibold">
              Cobrar
            </span>
          </button>
        </div>
      )}

      <Sheet open={checkout} onClose={() => setCheckout(false)} title="Cobrar">
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card">
          {cart.map((line) => (
            <li key={line.key} className="px-3 py-2.5">
              <p className="truncate text-[16px] font-medium">{line.name}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Stepper value={line.qty} onChange={(next) => setQty(line.key, next)} />
                <div className="relative w-32">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    $
                  </span>
                  <input
                    value={line.price ? String(line.price) : ""}
                    onChange={(event) => setPrice(line.key, event.target.value)}
                    inputMode="numeric"
                    placeholder="0"
                    aria-label={"Precio de " + line.name}
                    className="w-full rounded-xl bg-app py-2.5 pl-7 pr-2 text-right text-[17px] font-semibold tabular-nums outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3">
          <Chips options={[...PAY_METHODS]} value={pay} onChange={(v) => setPay(v as PayMethod)} />
        </div>

        <div className="mt-3">
          <Field label="Nota (opcional)" value={note} onChange={setNote} placeholder="Ej: para Pepe" />
        </div>

        <div className="mt-4 flex items-end justify-between px-1">
          <span className="text-[14px] font-semibold uppercase tracking-wide text-muted">Total</span>
          <span className="text-[30px] font-bold leading-none tabular-nums">{money(total)}</span>
        </div>

        <div className="mt-3 space-y-2">
          <PrimaryButton onClick={cobrar} tone="ok" disabled={cart.length === 0}>
            Cobrar {money(total)}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => {
              setCart([]);
              setCheckout(false);
            }}
            className="w-full py-2 text-[15px] font-medium text-danger"
          >
            Vaciar ticket
          </button>
        </div>
      </Sheet>

      {freeOpen && (
        <FreeSaleSheet
          suggestion={query}
          onClose={() => setFreeOpen(false)}
          onAdd={(line) => {
            setCart((prev) => [...prev, { ...line, key: newId() }]);
            setFreeOpen(false);
            setQuery("");
            setCheckout(true);
          }}
        />
      )}

      {scanning && <Scanner onCode={onCode} onClose={() => setScanning(false)} />}

      {toast}
    </main>
  );
}

/** Para vender algo que no esta cargado: nombre y precio, nada mas. */
function FreeSaleSheet({
  suggestion,
  onClose,
  onAdd,
}: {
  suggestion: string;
  onClose: () => void;
  onAdd: (line: SaleLine) => void;
}) {
  // Se monta recien al abrirse, asi arranca con lo que estaba buscando.
  const [name, setName] = useState(suggestion);
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");

  return (
    <Sheet open onClose={onClose} title="Venta suelta">
      <div className="space-y-3">
        <Field
          label="Que vendiste"
          value={name}
          onChange={setName}
          placeholder="Ej: cambio de modulo"
          autoFocus
        />
        <Field label="Precio" value={price} onChange={setPrice} placeholder="0" money />
        <Field label="Costo (opcional)" value={cost} onChange={setCost} placeholder="0" money />
        <PrimaryButton
          onClick={() => {
            const clean = name.trim();
            if (!clean) return;
            onAdd({
              productId: null,
              name: clean,
              qty: 1,
              price: parseMoney(price) ?? 0,
              cost: parseMoney(cost),
            });
          }}
          disabled={!name.trim()}
        >
          Agregar al ticket
        </PrimaryButton>
      </div>
    </Sheet>
  );
}
