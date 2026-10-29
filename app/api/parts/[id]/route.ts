import { NextResponse } from "next/server";
import { ensureSchema, hasDb, patchPart, removePart } from "@/lib/db";
import type { Part } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!hasDb) return NextResponse.json({ error: "sin base de datos" }, { status: 503 });
  const { id } = await params;
  const patch = (await request.json()) as Partial<Part>;
  await ensureSchema();
  const part = await patchPart(id, patch);
  if (!part) return NextResponse.json({ error: "no existe" }, { status: 404 });
  return NextResponse.json(part);
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!hasDb) return NextResponse.json({ error: "sin base de datos" }, { status: 503 });
  const { id } = await params;
  await ensureSchema();
  await removePart(id);
  return NextResponse.json({ ok: true });
}
