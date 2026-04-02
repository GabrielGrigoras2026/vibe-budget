import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currencies = await db
      .select()
      .from(schema.currencies)
      .where(eq(schema.currencies.userId, user.id));

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("[CURRENCIES_GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { code?: string; symbol?: string; name?: string };
    const { code, symbol, name } = body;

    if (!code || !symbol || !name) {
      return NextResponse.json({ error: "Codul, simbolul și numele sunt obligatorii" }, { status: 400 });
    }

    const [currency] = await db
      .insert(schema.currencies)
      .values({
        userId: user.id,
        code: code.trim().toUpperCase(),
        symbol: symbol.trim(),
        name: name.trim(),
      })
      .returning();

    return NextResponse.json({ currency }, { status: 201 });
  } catch (error) {
    console.error("[CURRENCIES_POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
