import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db, schema } from "@/lib/db";
import { and, eq, gte, ilike, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const bankId = searchParams.get("bankId");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    const conditions = [eq(schema.transactions.userId, user.id)];
    if (dateFrom) conditions.push(gte(schema.transactions.date, dateFrom));
    if (dateTo) conditions.push(lte(schema.transactions.date, dateTo));
    if (bankId) conditions.push(eq(schema.transactions.bankId, bankId));
    if (categoryId) conditions.push(eq(schema.transactions.categoryId, categoryId));
    if (search) conditions.push(ilike(schema.transactions.description, `%${search}%`));

    const transactions = await db
      .select()
      .from(schema.transactions)
      .where(and(...conditions))
      .orderBy(schema.transactions.date);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("[TRANSACTIONS_GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      date?: string;
      description?: string;
      amount?: number;
      currency?: string;
      bankId?: string;
      categoryId?: string;
    };
    const { date, description, amount, currency, bankId, categoryId } = body;

    if (!date || !description || description.trim() === "" || amount === undefined) {
      return NextResponse.json({ error: "Data, descrierea și suma sunt obligatorii" }, { status: 400 });
    }

    const [transaction] = await db
      .insert(schema.transactions)
      .values({
        userId: user.id,
        date,
        description: description.trim(),
        amount,
        currency: currency ?? "RON",
        bankId: bankId ?? null,
        categoryId: categoryId ?? null,
      })
      .returning();

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
