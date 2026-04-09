import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { db, schema } from "@/lib/db";
import { and, eq, gte, lte } from "drizzle-orm";

interface CategoryGroup {
  categoryId: string | null;
  categoryName: string;
  icon: string;
  total: number;
}

interface MonthGroup {
  month: string;
  label: string;
  total: number;
}

interface PivotRow {
  categoryId: string | null;
  categoryName: string;
  icon: string;
  byMonth: Record<string, number>; // month "YYYY-MM" -> total
  total: number;
  average: number;
}

function getDateFrom(period: string): string | null {
  const now = new Date();
  if (period === "current") {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  }
  if (period === "3months") {
    const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  }
  if (period === "6months") {
    const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  }
  return null; // "all" sau "custom" (datele vin separat)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "3months";
    const customDateFrom = searchParams.get("dateFrom");
    const customDateTo = searchParams.get("dateTo");

    const dateFrom = period === "custom" ? customDateFrom : getDateFrom(period);
    const dateTo = period === "custom" ? customDateTo : null;

    // Fetch cheltuieli (amount < 0) cu join la categories
    const conditions = [eq(schema.transactions.userId, user.id)];
    if (dateFrom) conditions.push(gte(schema.transactions.date, dateFrom));
    if (dateTo) conditions.push(lte(schema.transactions.date, dateTo));

    const rows = await db
      .select({
        date: schema.transactions.date,
        amount: schema.transactions.amount,
        categoryId: schema.transactions.categoryId,
        categoryName: schema.categories.name,
        categoryIcon: schema.categories.icon,
      })
      .from(schema.transactions)
      .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
      .where(and(...conditions));

    // Separăm cheltuieli și venituri
    const expenses = rows.filter((r) => Number(r.amount) < 0);
    const totalVenituri = Math.round(
      rows.filter((r) => Number(r.amount) > 0).reduce((sum, r) => sum + Number(r.amount), 0) * 100
    ) / 100;

    // Grupare pe categorie
    const catMap = new Map<string, CategoryGroup>();
    for (const row of expenses) {
      const key = row.categoryId ?? "__none__";
      const existing = catMap.get(key);
      const abs = Math.abs(Number(row.amount));
      if (existing) {
        existing.total += abs;
      } else {
        catMap.set(key, {
          categoryId: row.categoryId,
          categoryName: row.categoryName ?? "Necategorizat",
          icon: row.categoryIcon ?? "❓",
          total: abs,
        });
      }
    }
    const byCategory = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

    // Grupare pe lună
    const monthMap = new Map<string, number>();
    for (const row of expenses) {
      const monthKey = row.date.slice(0, 7); // "YYYY-MM"
      monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + Math.abs(Number(row.amount)));
    }

    const MONTHS_RO = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const byMonth: MonthGroup[] = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => {
        const [year, m] = month.split("-");
        const label = `${MONTHS_RO[parseInt(m, 10) - 1]} ${year}`;
        return { month, label, total: Math.round(total * 100) / 100 };
      });

    const totalCheltuieli = Math.round(byCategory.reduce((sum, c) => sum + c.total, 0) * 100) / 100;

    // Pivot: categorii × luni
    const pivotMap = new Map<string, PivotRow>();
    const monthCount = byMonth.length || 1;
    for (const row of expenses) {
      const key = row.categoryId ?? "__none__";
      const monthKey = row.date.slice(0, 7);
      const abs = Math.abs(Number(row.amount));
      if (!pivotMap.has(key)) {
        pivotMap.set(key, {
          categoryId: row.categoryId,
          categoryName: row.categoryName ?? "Necategorizat",
          icon: row.categoryIcon ?? "❓",
          byMonth: {},
          total: 0,
          average: 0,
        });
      }
      const pivotRow = pivotMap.get(key)!;
      pivotRow.byMonth[monthKey] = Math.round(((pivotRow.byMonth[monthKey] ?? 0) + abs) * 100) / 100;
      pivotRow.total = Math.round((pivotRow.total + abs) * 100) / 100;
    }
    const pivot: PivotRow[] = Array.from(pivotMap.values())
      .map((r) => ({ ...r, average: Math.round((r.total / monthCount) * 100) / 100 }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({ byCategory, byMonth, totalVenituri, totalCheltuieli, pivot });
  } catch (error) {
    console.error("[REPORTS_GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
