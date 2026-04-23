import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { id, email, name } = await request.json();

    if (!id || !email || !name) {
      return NextResponse.json(
        { error: "Id, email și nume sunt obligatorii" },
        { status: 400 }
      );
    }

    // Inserăm în tabela public.users (id vine din Supabase Auth)
    await db.insert(schema.users).values({ id, email, name }).onConflictDoNothing();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[AUTH_REGISTER] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
