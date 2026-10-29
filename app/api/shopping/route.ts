import { NextResponse } from "next/server";
import { ensureSchema, hasDb, insertItem } from "@/lib/db";
import { newId, type ShoppingItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasDb) return NextResponse.json({ error: "sin base de datos" }, { status: 503 });
  const body = (await request.json()) as Partial<ShoppingItem>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "falta el nombre" }, { status: 400 });
  }
  await ensureSchema();
  const item = await insertItem({
    id: body.id ?? newId(),
    name: body.name.trim(),
    qty: Number(body.qty ?? 1),
    note: body.note ?? null,
    done: Boolean(body.done),
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json(item, { status: 201 });
}
