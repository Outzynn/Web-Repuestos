import { NextResponse } from "next/server";
import { ensureSchema, hasDb, runOp } from "@/lib/db";
import type { Op } from "@/lib/ops";

export const dynamic = "force-dynamic";

/** Unica puerta de escritura: recibe una o varias operaciones y las aplica en orden. */
export async function POST(request: Request) {
  if (!hasDb) {
    return NextResponse.json({ error: "Sin base de datos" }, { status: 503 });
  }
  try {
    const body = (await request.json()) as { ops?: Op[] };
    const ops = Array.isArray(body.ops) ? body.ops : [];
    if (ops.length === 0) {
      return NextResponse.json({ error: "Sin operaciones" }, { status: 400 });
    }
    await ensureSchema();
    for (const op of ops) await runOp(op);
    return NextResponse.json({ ok: true, applied: ops.length });
  } catch (err) {
    console.error("POST /api/write", err);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}
