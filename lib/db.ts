import { neon } from "@neondatabase/serverless";
import type { Part, ShoppingItem } from "./types";

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

export function ensureSchema(): Promise<void> {
  if (!schema) {
    schema = (async () => {
      const db = client();
      await db`
        CREATE TABLE IF NOT EXISTS parts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'Otro',
          qty INTEGER NOT NULL DEFAULT 0,
          price NUMERIC,
          note TEXT,
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

function toPart(r: Row): Part {
  return {
    id: String(r.id),
    name: String(r.name),
    category: String(r.category ?? "Otro"),
    qty: Number(r.qty ?? 0),
    price: r.price === null || r.price === undefined ? null : Number(r.price),
    note: (r.note as string | null) ?? null,
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

function toItem(r: Row): ShoppingItem {
  return {
    id: String(r.id),
    name: String(r.name),
    qty: Number(r.qty ?? 1),
    note: (r.note as string | null) ?? null,
    done: Boolean(r.done),
    createdAt: new Date(r.created_at as string).toISOString(),
  };
}

export async function listParts(): Promise<Part[]> {
  const db = client();
  const rows = (await db`SELECT * FROM parts ORDER BY name ASC`) as Row[];
  return rows.map(toPart);
}

export async function listItems(): Promise<ShoppingItem[]> {
  const db = client();
  const rows = (await db`
    SELECT * FROM shopping_items ORDER BY done ASC, created_at DESC
  `) as Row[];
  return rows.map(toItem);
}

export async function insertPart(p: Part): Promise<Part> {
  const db = client();
  const rows = (await db`
    INSERT INTO parts (id, name, category, qty, price, note)
    VALUES (${p.id}, ${p.name}, ${p.category}, ${p.qty}, ${p.price}, ${p.note})
    RETURNING *
  `) as Row[];
  return toPart(rows[0]);
}

export async function patchPart(
  id: string,
  patch: Partial<Omit<Part, "id" | "createdAt">>,
): Promise<Part | null> {
  const db = client();
  const rows = (await db`
    UPDATE parts SET
      name = COALESCE(${patch.name ?? null}::text, name),
      category = COALESCE(${patch.category ?? null}::text, category),
      qty = COALESCE(${patch.qty ?? null}::int, qty),
      price = CASE WHEN ${patch.price !== undefined}::boolean THEN ${patch.price ?? null}::numeric ELSE price END,
      note = CASE WHEN ${patch.note !== undefined}::boolean THEN ${patch.note ?? null}::text ELSE note END
    WHERE id = ${id}
    RETURNING *
  `) as Row[];
  return rows[0] ? toPart(rows[0]) : null;
}

export async function removePart(id: string): Promise<void> {
  const db = client();
  await db`DELETE FROM parts WHERE id = ${id}`;
}

export async function insertItem(i: ShoppingItem): Promise<ShoppingItem> {
  const db = client();
  const rows = (await db`
    INSERT INTO shopping_items (id, name, qty, note, done)
    VALUES (${i.id}, ${i.name}, ${i.qty}, ${i.note}, ${i.done})
    RETURNING *
  `) as Row[];
  return toItem(rows[0]);
}

export async function patchItem(
  id: string,
  patch: Partial<Omit<ShoppingItem, "id" | "createdAt">>,
): Promise<ShoppingItem | null> {
  const db = client();
  const rows = (await db`
    UPDATE shopping_items SET
      name = COALESCE(${patch.name ?? null}::text, name),
      qty = COALESCE(${patch.qty ?? null}::int, qty),
      done = COALESCE(${patch.done ?? null}::boolean, done),
      note = CASE WHEN ${patch.note !== undefined}::boolean THEN ${patch.note ?? null}::text ELSE note END
    WHERE id = ${id}
    RETURNING *
  `) as Row[];
  return rows[0] ? toItem(rows[0]) : null;
}

export async function removeItem(id: string): Promise<void> {
  const db = client();
  await db`DELETE FROM shopping_items WHERE id = ${id}`;
}

export async function removeDoneItems(): Promise<void> {
  const db = client();
  await db`DELETE FROM shopping_items WHERE done = true`;
}
