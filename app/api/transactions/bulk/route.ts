import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db, schema } from "@/lib/db";
import { and, eq, gte, lte } from "drizzle-orm";
import { autoCategorizTransaction } from "@/lib/auto-categorization";

interface BulkTransaction {
  bankId?: string;
  date: string;        // YYYY-MM-DD
  description: string;
  amount: number;
  currency: string;
  type: "income" | "expense";
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verifică autentificarea
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parsează body
    const body = await request.json() as BulkTransaction[];

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: "Body-ul trebuie să fie un array nevid de tranzacții" },
        { status: 400 }
      );
    }

    // 3. Fetch categoriile userului o singură dată (refolosit per tranzacție)
    const categories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.userId, user.id));

    // 4. Auto-categorizare + construire valori pentru insert
    let autoCategorized = 0;

    const values = await Promise.all(
      body.map(async (tx) => {
        const categoryId = await autoCategorizTransaction(
          tx.description,
          user.id,
          categories
        );

        if (categoryId) {
          autoCategorized++;
        }

        return {
          userId: user.id,
          bankId: tx.bankId ?? null,
          categoryId,
          date: tx.date,
          description: tx.description.trim(),
          amount: tx.amount,
          currency: tx.currency ?? "RON",
        };
      })
    );

    // 5. Batch insert
    await db.insert(schema.transactions).values(values);

    // 6. Răspuns
    return NextResponse.json(
      {
        message: `${values.length} tranzacții importate cu succes`,
        totalImported: values.length,
        autoCategorized,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[TRANSACTIONS_BULK_POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Verifică autentificarea
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parsează perioada din body
    const body = await request.json() as { dateFrom?: string; dateTo?: string };
    const { dateFrom, dateTo } = body;

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "Perioada (dateFrom și dateTo) este obligatorie" },
        { status: 400 }
      );
    }

    // 3. Șterge tranzacțiile din perioadă aparținând userului
    const deleted = await db
      .delete(schema.transactions)
      .where(
        and(
          eq(schema.transactions.userId, user.id),
          gte(schema.transactions.date, dateFrom),
          lte(schema.transactions.date, dateTo)
        )
      )
      .returning();

    return NextResponse.json({
      message: `${deleted.length} tranzacții șterse`,
      deletedCount: deleted.length,
    });
  } catch (error) {
    console.error("[TRANSACTIONS_BULK_DELETE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
