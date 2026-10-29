import { NextResponse } from "next/server";
import { ensureSchema, hasDb, insertPart } from "@/lib/db";
import { newId, type Part } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasDb) return NextResponse.json({ error: "sin base de datos" }, { status: 503 });
  const body = (await request.json()) as Partial<Part>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "falta el nombre" }, { status: 400 });
  }
  await ensureSchema();
  const part = await insertPart({
    id: body.id ?? newId(),
    name: body.name.trim(),
    category: body.category ?? "Otro",
    qty: Number(body.qty ?? 0),
    price: body.price ?? null,
    note: body.note ?? null,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json(part, { status: 201 });
}
