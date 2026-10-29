import { NextResponse } from "next/server";
import { ensureSchema, hasDb, listItems, listParts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDb) {
    return NextResponse.json({ mode: "local", parts: [], items: [] });
  }
  try {
    await ensureSchema();
    const [parts, items] = await Promise.all([listParts(), listItems()]);
    return NextResponse.json({ mode: "cloud", parts, items });
  } catch (err) {
    console.error("GET /api/data", err);
    return NextResponse.json({ mode: "local", parts: [], items: [] }, { status: 200 });
  }
}
