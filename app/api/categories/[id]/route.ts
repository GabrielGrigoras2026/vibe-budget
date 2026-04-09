import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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
      .update(schema.categories)
      .set({
        name: name.trim(),
        type,
        icon: icon ?? "📁",
        description: description?.trim() ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)))
      .returning();

    if (!category) {
      return NextResponse.json({ error: "Categoria nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("[CATEGORIES_PUT] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verificăm că categoria există și aparține userului
    const existing = await db
      .select()
      .from(schema.categories)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Categoria nu a fost găsită" }, { status: 404 });
    }

    if (existing[0].isSystemCategory) {
      return NextResponse.json({ error: "Categoriile de sistem nu pot fi șterse" }, { status: 403 });
    }

    await db
      .delete(schema.categories)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CATEGORIES_DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
