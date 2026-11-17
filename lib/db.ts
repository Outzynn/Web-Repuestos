import { neon } from "@neondatabase/serverless";
import type { Op } from "./ops";
import type { Job, Product, Sale, SaleLine, ShoppingItem, Snapshot } from "./types";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

export const hasDb = connectionString.length > 0;

const sql = hasDb ? neon(connectionString) : null;

function client() {
  if (!sql) throw new Error("Sin base de datos configurada");
  return sql;
}

let schema: Promise<void> | null = null;

/**
 * Crea las tablas la primera vez. La tabla de productos se sigue llamando
 * "parts" porque es la de la version anterior y asi no se pierde nada cargado.
 */
export function ensureSchema(): Promise<void> {
  if (!schema) {
    schema = (async () => {
      const db = client();
      await db`
        CREATE TABLE IF NOT EXISTS parts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT '',
          qty INTEGER NOT NULL DEFAULT 0,
          price NUMERIC,
          note TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await db`ALTER TABLE parts ADD COLUMN IF NOT EXISTS cost NUMERIC`;
      await db`ALTER TABLE parts ADD COLUMN IF NOT EXISTS barcode TEXT`;
      await db`
        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          lines JSONB NOT NULL DEFAULT '[]'::jsonb,
          total NUMERIC NOT NULL DEFAULT 0,
          cost NUMERIC NOT NULL DEFAULT 0,
          pay TEXT NOT NULL DEFAULT 'Efectivo',
          note TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          device TEXT NOT NULL,
          customer TEXT,
          issue TEXT,
          parts_cost NUMERIC,
          charged NUMERIC,
          status TEXT NOT NULL DEFAULT 'taller',
          paid BOOLEAN NOT NULL DEFAULT false,
          note TEXT,
          closed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS shopping_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          qty INTEGER NOT NULL DEFAULT 1,
          note TEXT,
          done BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })().catch((err) => {
      schema = null;
      throw err;
    });
  }
  return schema;
}

type Row = Record<string, unknown>;

const text = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const nullableNumber = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v);

function toProduct(r: Row): Product {
  return {
    id: String(r.id),
    name: String(r.name),
    category: String(r.category ?? ""),
    qty: Number(r.qty ?? 0),
    cost: nullableNumber(r.cost),
    price: nullableNumber(r.price),
    barcode: text(r.barcode),
    note: text(r.note),
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

function toSale(r: Row): Sale {
  const raw = r.lines;
  const lines = (typeof raw === "string" ? JSON.parse(raw) : raw) as SaleLine[];
  return {
    id: String(r.id),
    lines: Array.isArray(lines) ? lines : [],
    total: Number(r.total ?? 0),
    cost: Number(r.cost ?? 0),
    pay: String(r.pay ?? "Efectivo") as Sale["pay"],
    note: text(r.note),
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

function toJob(r: Row): Job {
  return {
    id: String(r.id),
    device: String(r.device),
    customer: text(r.customer),
    issue: text(r.issue),
    partsCost: nullableNumber(r.parts_cost),
    charged: nullableNumber(r.charged),
    status: String(r.status ?? "taller") as Job["status"],
    paid: Boolean(r.paid),
    note: text(r.note),
    closedAt: r.closed_at ? new Date(r.closed_at as string).toISOString() : null,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

function toItem(r: Row): ShoppingItem {
  return {
    id: String(r.id),
    name: String(r.name),
    qty: Number(r.qty ?? 1),
    note: text(r.note),
    done: Boolean(r.done),
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

export async function readAll(): Promise<Snapshot> {
  const db = client();
  const [products, sales, jobs, items] = await Promise.all([
    db`SELECT * FROM parts ORDER BY name ASC` as Promise<Row[]>,
    db`SELECT * FROM sales ORDER BY created_at DESC LIMIT 600` as Promise<Row[]>,
    db`SELECT * FROM jobs ORDER BY created_at DESC LIMIT 400` as Promise<Row[]>,
    db`SELECT * FROM shopping_items ORDER BY done ASC, created_at DESC` as Promise<Row[]>,
  ]);
  return {
    products: products.map(toProduct),
    sales: sales.map(toSale),
    jobs: jobs.map(toJob),
    items: items.map(toItem),
  };
}

async function addProduct(p: Product) {
  const db = client();
  await db`
    INSERT INTO parts (id, name, category, qty, cost, price, barcode, note)
    VALUES (${p.id}, ${p.name}, ${p.category}, ${p.qty}, ${p.cost}, ${p.price}, ${p.barcode}, ${p.note})
    ON CONFLICT (id) DO NOTHING
  `;
}

/** Ejecuta un cambio. Las tablas se crean antes si hace falta. */
export async function runOp(op: Op): Promise<void> {
  const db = client();

  switch (op.kind) {
    case "product.add":
      await addProduct(op.product);
      return;

    case "product.addMany":
      for (const product of op.products) await addProduct(product);
      return;

    case "product.patch": {
      const p = op.patch;
      await db`
        UPDATE parts SET
          name = COALESCE(${p.name ?? null}::text, name),
          category = COALESCE(${p.category ?? null}::text, category),
          qty = COALESCE(${p.qty ?? null}::int, qty),
          cost = CASE WHEN ${p.cost !== undefined}::boolean THEN ${p.cost ?? null}::numeric ELSE cost END,
          price = CASE WHEN ${p.price !== undefined}::boolean THEN ${p.price ?? null}::numeric ELSE price END,
          barcode = CASE WHEN ${p.barcode !== undefined}::boolean THEN ${p.barcode ?? null}::text ELSE barcode END,
          note = CASE WHEN ${p.note !== undefined}::boolean THEN ${p.note ?? null}::text ELSE note END
        WHERE id = ${op.id}
      `;
      return;
    }

    case "product.del":
      await db`DELETE FROM parts WHERE id = ${op.id}`;
      return;

    case "sale.add": {
      const s = op.sale;
      await db`
        INSERT INTO sales (id, lines, total, cost, pay, note)
        VALUES (${s.id}, ${JSON.stringify(s.lines)}::jsonb, ${s.total}, ${s.cost}, ${s.pay}, ${s.note})
        ON CONFLICT (id) DO NOTHING
      `;
      return;
    }

    case "sale.del":
      await db`DELETE FROM sales WHERE id = ${op.id}`;
      return;

    case "job.add": {
      const j = op.job;
      await db`
        INSERT INTO jobs (id, device, customer, issue, parts_cost, charged, status, paid, note, closed_at)
        VALUES (${j.id}, ${j.device}, ${j.customer}, ${j.issue}, ${j.partsCost}, ${j.charged},
                ${j.status}, ${j.paid}, ${j.note}, ${j.closedAt})
        ON CONFLICT (id) DO NOTHING
      `;
      return;
    }

    case "job.patch": {
      const p = op.patch;
      await db`
        UPDATE jobs SET
          device = COALESCE(${p.device ?? null}::text, device),
          status = COALESCE(${p.status ?? null}::text, status),
          paid = COALESCE(${p.paid ?? null}::boolean, paid),
          customer = CASE WHEN ${p.customer !== undefined}::boolean THEN ${p.customer ?? null}::text ELSE customer END,
          issue = CASE WHEN ${p.issue !== undefined}::boolean THEN ${p.issue ?? null}::text ELSE issue END,
          note = CASE WHEN ${p.note !== undefined}::boolean THEN ${p.note ?? null}::text ELSE note END,
          parts_cost = CASE WHEN ${p.partsCost !== undefined}::boolean THEN ${p.partsCost ?? null}::numeric ELSE parts_cost END,
          charged = CASE WHEN ${p.charged !== undefined}::boolean THEN ${p.charged ?? null}::numeric ELSE charged END,
          closed_at = CASE WHEN ${p.closedAt !== undefined}::boolean THEN ${p.closedAt ?? null}::timestamptz ELSE closed_at END
        WHERE id = ${op.id}
      `;
      return;
    }

    case "job.del":
      await db`DELETE FROM jobs WHERE id = ${op.id}`;
      return;

    case "item.add": {
      const i = op.item;
      await db`
        INSERT INTO shopping_items (id, name, qty, note, done)
        VALUES (${i.id}, ${i.name}, ${i.qty}, ${i.note}, ${i.done})
        ON CONFLICT (id) DO NOTHING
      `;
      return;
    }

    case "item.patch": {
      const p = op.patch;
      await db`
        UPDATE shopping_items SET
          name = COALESCE(${p.name ?? null}::text, name),
          qty = COALESCE(${p.qty ?? null}::int, qty),
          done = COALESCE(${p.done ?? null}::boolean, done),
          note = CASE WHEN ${p.note !== undefined}::boolean THEN ${p.note ?? null}::text ELSE note END
        WHERE id = ${op.id}
      `;
      return;
    }

    case "item.del":
      await db`DELETE FROM shopping_items WHERE id = ${op.id}`;
      return;

    case "item.clearDone":
      await db`DELETE FROM shopping_items WHERE done = true`;
      return;
  }
}
