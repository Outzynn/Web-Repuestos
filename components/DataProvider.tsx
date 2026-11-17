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
import { CATALOG } from "@/lib/catalog";
import { loadLocal, saveLocal } from "@/lib/local";
import type { ItemPatch, JobPatch, Op, ProductPatch } from "@/lib/ops";
import {
  EMPTY,
  keyOf,
  newId,
  type FacuKind,
  type ItemKind,
  type Job,
  type Mode,
  type PayMethod,
  type Product,
  type Sale,
  type SaleLine,
  type ShoppingItem,
  type Snapshot,
} from "@/lib/types";

type NewProduct = {
  name: string;
  category?: string;
  qty?: number;
  cost?: number | null;
  price?: number | null;
  barcode?: string | null;
  note?: string | null;
};

type NewJob = {
  device: string;
  customer?: string | null;
  issue?: string | null;
  partsCost?: number | null;
  charged?: number | null;
  facuKind?: FacuKind | null;
  facuValue?: number | null;
  note?: string | null;
};

type NewItem = { name: string; kind: ItemKind; qty: number; note?: string | null };

type NewSale = { lines: SaleLine[]; pay: PayMethod; note?: string | null };

type Ctx = {
  ready: boolean;
  mode: Mode;
  error: string | null;
  products: Product[];
  sales: Sale[];
  jobs: Job[];
  items: ShoppingItem[];
  addProduct: (input: NewProduct) => Promise<Product>;
  updateProduct: (id: string, patch: ProductPatch) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  importCatalog: () => Promise<number>;
  registerSale: (input: NewSale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  addJob: (input: NewJob) => Promise<void>;
  updateJob: (id: string, patch: JobPatch) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  addItem: (input: NewItem) => Promise<void>;
  updateItem: (id: string, patch: ItemPatch) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearDone: () => Promise<void>;
  receiveDone: () => Promise<{ stock: number; repuestos: number }>;
};

const DataContext = createContext<Ctx | null>(null);

const byName = (a: Product, b: Product) => a.name.localeCompare(b.name, "es");

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);
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
      if (data.mode !== "cloud") throw new Error("sin nube");
      modeRef.current = "cloud";
      setMode("cloud");
      current.current = {
        products: data.products,
        sales: data.sales,
        jobs: data.jobs,
        items: data.items,
      };
      setSnapshot(current.current);
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

  /** Muestra el cambio al instante y lo guarda despues. */
  const apply = useCallback(
    async (next: Snapshot, ops: Op[]) => {
      put(next);
      if (modeRef.current !== "cloud") return;
      try {
        const res = await fetch("/api/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ops }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setError(null);
      } catch {
        setError("No se pudo guardar en la nube. Reintenta.");
        await reload();
      }
    },
    [put, reload],
  );

  const makeProduct = useCallback((input: NewProduct): Product => {
    const barcode = input.barcode?.trim();
    return {
      id: newId(),
      name: input.name.trim(),
      category: input.category?.trim() ?? "",
      qty: input.qty ?? 0,
      cost: input.cost ?? null,
      price: input.price ?? null,
      barcode: barcode ? barcode : null,
      note: input.note?.trim() ? input.note.trim() : null,
      createdAt: new Date().toISOString(),
    };
  }, []);

  const addProduct = useCallback(
    async (input: NewProduct) => {
      const product = makeProduct(input);
      const products = [...current.current.products, product].sort(byName);
      await apply({ ...current.current, products }, [{ kind: "product.add", product }]);
      return product;
    },
    [apply, makeProduct],
  );

  const updateProduct = useCallback(
    async (id: string, patch: ProductPatch) => {
      const products = current.current.products
        .map((p) => (p.id === id ? { ...p, ...patch } : p))
        .sort(byName);
      await apply({ ...current.current, products }, [{ kind: "product.patch", id, patch }]);
    },
    [apply],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      const products = current.current.products.filter((p) => p.id !== id);
      await apply({ ...current.current, products }, [{ kind: "product.del", id }]);
    },
    [apply],
  );

  /** Carga el catalogo del Excel saltando lo que ya esta (por codigo o por nombre). */
  const importCatalog = useCallback(async () => {
    const existing = current.current.products;
    const codes = new Set(existing.filter((p) => p.barcode).map((p) => keyOf(p.barcode as string)));
    const names = new Set(existing.map((p) => keyOf(p.name)));

    const fresh = CATALOG.filter((entry) => {
      if (entry.barcode && codes.has(keyOf(entry.barcode))) return false;
      return !names.has(keyOf(entry.name));
    }).map((entry) => makeProduct(entry));

    if (fresh.length === 0) return 0;
    const products = [...existing, ...fresh].sort(byName);
    await apply({ ...current.current, products }, [
      { kind: "product.addMany", products: fresh },
    ]);
    return fresh.length;
  }, [apply, makeProduct]);

  /**
   * Guarda la venta y descuenta el stock. Lo que se vendio suelto queda
   * cargado como producto (en cero) asi la proxima ya esta con precio y costo.
   */
  const registerSale = useCallback(
    async (input: NewSale) => {
      const clean = input.lines.filter((l) => l.qty > 0);
      if (clean.length === 0) return;

      const ops: Op[] = [];
      let products = [...current.current.products];
      const nuevos = new Set<string>();

      const lines = clean.map((line) => {
        if (line.productId) return line;
        const match = products.find((p) => keyOf(p.name) === keyOf(line.name));
        if (match) return { ...line, productId: match.id };
        const product = makeProduct({
          name: line.name,
          qty: 0,
          price: line.price,
          cost: line.cost,
        });
        products = [...products, product];
        nuevos.add(product.id);
        ops.push({ kind: "product.add", product });
        return { ...line, productId: product.id };
      });

      const sale: Sale = {
        id: newId(),
        lines,
        total: lines.reduce((sum, l) => sum + l.price * l.qty, 0),
        cost: lines.reduce((sum, l) => sum + (l.cost ?? 0) * l.qty, 0),
        pay: input.pay,
        note: input.note?.trim() ? input.note.trim() : null,
        createdAt: new Date().toISOString(),
      };
      ops.push({ kind: "sale.add", sale });

      products = products.map((product) => {
        if (nuevos.has(product.id)) return product;
        const sold = lines
          .filter((l) => l.productId === product.id)
          .reduce((sum, l) => sum + l.qty, 0);
        if (sold === 0) return product;
        const qty = Math.max(0, product.qty - sold);
        ops.push({ kind: "product.patch", id: product.id, patch: { qty } });
        return { ...product, qty };
      });

      await apply(
        { ...current.current, products: products.sort(byName), sales: [sale, ...current.current.sales] },
        ops,
      );
    },
    [apply, makeProduct],
  );

  /** Borra una venta mal cargada y devuelve al stock lo que habia salido. */
  const deleteSale = useCallback(
    async (id: string) => {
      const sale = current.current.sales.find((s) => s.id === id);
      if (!sale) return;

      const ops: Op[] = [{ kind: "sale.del", id }];
      const products = current.current.products.map((product) => {
        const back = sale.lines
          .filter((l) => l.productId === product.id)
          .reduce((sum, l) => sum + l.qty, 0);
        if (back === 0) return product;
        const qty = product.qty + back;
        ops.push({ kind: "product.patch", id: product.id, patch: { qty } });
        return { ...product, qty };
      });

      await apply(
        { ...current.current, products, sales: current.current.sales.filter((s) => s.id !== id) },
        ops,
      );
    },
    [apply],
  );

  const addJob = useCallback(
    async (input: NewJob) => {
      const job: Job = {
        id: newId(),
        device: input.device.trim(),
        customer: input.customer?.trim() ? input.customer.trim() : null,
        issue: input.issue?.trim() ? input.issue.trim() : null,
        partsCost: input.partsCost ?? null,
        charged: input.charged ?? null,
        status: "taller",
        paid: false,
        facuKind: input.facuKind ?? null,
        facuValue: input.facuValue ?? null,
        facuPaid: false,
        note: input.note?.trim() ? input.note.trim() : null,
        closedAt: null,
        createdAt: new Date().toISOString(),
      };
      await apply({ ...current.current, jobs: [job, ...current.current.jobs] }, [
        { kind: "job.add", job },
      ]);
    },
    [apply],
  );

  const updateJob = useCallback(
    async (id: string, patch: JobPatch) => {
      const jobs = current.current.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
      await apply({ ...current.current, jobs }, [{ kind: "job.patch", id, patch }]);
    },
    [apply],
  );

  const deleteJob = useCallback(
    async (id: string) => {
      const jobs = current.current.jobs.filter((j) => j.id !== id);
      await apply({ ...current.current, jobs }, [{ kind: "job.del", id }]);
    },
    [apply],
  );

  const addItem = useCallback(
    async (input: NewItem) => {
      const item: ShoppingItem = {
        id: newId(),
        name: input.name.trim(),
        kind: input.kind,
        qty: input.qty,
        note: input.note?.trim() ? input.note.trim() : null,
        done: false,
        createdAt: new Date().toISOString(),
      };
      await apply({ ...current.current, items: [item, ...current.current.items] }, [
        { kind: "item.add", item },
      ]);
    },
    [apply],
  );

  const updateItem = useCallback(
    async (id: string, patch: ItemPatch) => {
      const items = current.current.items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      await apply({ ...current.current, items }, [{ kind: "item.patch", id, patch }]);
    },
    [apply],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const items = current.current.items.filter((i) => i.id !== id);
      await apply({ ...current.current, items }, [{ kind: "item.del", id }]);
    },
    [apply],
  );

  const clearDone = useCallback(async () => {
    const items = current.current.items.filter((i) => !i.done);
    await apply({ ...current.current, items }, [{ kind: "item.clearDone" }]);
  }, [apply]);

  /**
   * Cierra la compra: los productos se suman al stock (o se crean) y los
   * repuestos simplemente salen de la lista, porque van a una reparacion.
   */
  const receiveDone = useCallback(async () => {
    const done = current.current.items.filter((i) => i.done);
    if (done.length === 0) return { stock: 0, repuestos: 0 };

    const paraStock = done.filter((i) => i.kind === "producto");
    const ops: Op[] = [{ kind: "item.clearDone" }];
    let products = [...current.current.products];

    for (const item of paraStock) {
      const index = products.findIndex((p) => keyOf(p.name) === keyOf(item.name));
      if (index >= 0) {
        const qty = products[index].qty + item.qty;
        products[index] = { ...products[index], qty };
        ops.push({ kind: "product.patch", id: products[index].id, patch: { qty } });
      } else {
        const product = makeProduct({ name: item.name, qty: item.qty });
        products = [...products, product];
        ops.push({ kind: "product.add", product });
      }
    }

    await apply(
      {
        ...current.current,
        products: products.sort(byName),
        items: current.current.items.filter((i) => !i.done),
      },
      ops,
    );
    return { stock: paraStock.length, repuestos: done.length - paraStock.length };
  }, [apply, makeProduct]);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      mode,
      error,
      products: snapshot.products,
      sales: snapshot.sales,
      jobs: snapshot.jobs,
      items: snapshot.items,
      addProduct,
      updateProduct,
      deleteProduct,
      importCatalog,
      registerSale,
      deleteSale,
      addJob,
      updateJob,
      deleteJob,
      addItem,
      updateItem,
      deleteItem,
      clearDone,
      receiveDone,
    }),
    [
      ready,
      mode,
      error,
      snapshot,
      addProduct,
      updateProduct,
      deleteProduct,
      importCatalog,
      registerSale,
      deleteSale,
      addJob,
      updateJob,
      deleteJob,
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
