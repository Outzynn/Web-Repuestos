import { NextResponse } from "next/server";
import { ensureSchema, hasDb, readAll } from "@/lib/db";
import { EMPTY } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDb) {
    return NextResponse.json({ mode: "local", ...EMPTY });
  }
  try {
    await ensureSchema();
    const data = await readAll();
    return NextResponse.json({ mode: "cloud", ...data });
  } catch (err) {
    console.error("GET /api/data", err);
    // Sin nube la app sigue andando con los datos del propio telefono.
    return NextResponse.json({ mode: "local", ...EMPTY }, { status: 200 });
  }
}
