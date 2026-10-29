import { NextResponse } from "next/server";
import { ensureSchema, hasDb, patchItem, removeItem } from "@/lib/db";
import type { ShoppingItem } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!hasDb) return NextResponse.json({ error: "sin base de datos" }, { status: 503 });
  const { id } = await params;
  const patch = (await request.json()) as Partial<ShoppingItem>;
  await ensureSchema();
  const item = await patchItem(id, patch);
  if (!item) return NextResponse.json({ error: "no existe" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!hasDb) return NextResponse.json({ error: "sin base de datos" }, { status: 503 });
  const { id } = await params;
  await ensureSchema();
  await removeItem(id);
  return NextResponse.json({ ok: true });
}
