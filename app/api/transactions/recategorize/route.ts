import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db, schema } from "@/lib/db";
import { eq, isNull } from "drizzle-orm";
import { autoCategorizTransaction } from "@/lib/auto-categorization";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch toate tranzacțiile fără categorie ale userului
    const uncategorized = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, user.id));

    const withoutCategory = uncategorized.filter((tx) => tx.categoryId === null);

    if (withoutCategory.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    // Fetch categoriile userului o singură dată
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    // Rulează auto-categorizare pe fiecare tranzacție fără categorie
    let updated = 0;
    for (const tx of withoutCategory) {
      const categoryId = await autoCategorizTransaction(tx.description, user.id, categories);
      if (categoryId) {
        await db
          .update(schema.transactions)
          .set({ categoryId })
          .where(eq(schema.transactions.id, tx.id));
        updated++;
      }
    }

    return NextResponse.json({ updated, total: withoutCategory.length });
  } catch (error) {
    console.error("[TRANSACTIONS_RECATEGORIZE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
