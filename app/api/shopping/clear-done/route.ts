import { NextResponse } from "next/server";
import { ensureSchema, hasDb, removeDoneItems } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!hasDb) return NextResponse.json({ error: "sin base de datos" }, { status: 503 });
  await ensureSchema();
  await removeDoneItems();
  return NextResponse.json({ ok: true });
}
