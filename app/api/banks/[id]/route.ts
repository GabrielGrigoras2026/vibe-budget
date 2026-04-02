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
    const body = await request.json() as { name?: string; color?: string };
    const { name, color } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Numele băncii este obligatoriu" }, { status: 400 });
    }

    const [bank] = await db
      .update(schema.banks)
      .set({
        name: name.trim(),
        color: color ?? "#6366f1",
        updatedAt: new Date(),
      })
      .where(and(eq(schema.banks.id, id), eq(schema.banks.userId, user.id)))
      .returning();

    if (!bank) {
      return NextResponse.json({ error: "Banca nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ bank });
  } catch (error) {
    console.error("[BANKS_PUT] Error:", error);
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

    const [deleted] = await db
      .delete(schema.banks)
      .where(and(eq(schema.banks.id, id), eq(schema.banks.userId, user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Banca nu a fost găsită" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BANKS_DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
