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

    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[CATEGORIES_GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { name?: string; type?: string; icon?: string; description?: string };
    const { name, type, icon, description } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Numele categoriei este obligatoriu" }, { status: 400 });
    }

    const VALID_TYPES = ["income", "expense", "transfer", "savings"];
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Tipul trebuie să fie income, expense, transfer sau savings" }, { status: 400 });
    }

    const [category] = await db
      .insert(schema.categories)
      .values({
        userId: user.id,
        name: name.trim(),
        type,
        icon: icon ?? "📁",
        description: description?.trim() ?? null,
        isSystemCategory: false,
      })
      .returning();

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("[CATEGORIES_POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
