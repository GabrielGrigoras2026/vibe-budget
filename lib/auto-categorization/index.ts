/**
 * AUTO-CATEGORIZARE TRANZACȚII
 *
 * Când importăm tranzacții din CSV/Excel, încercăm să le atribuim automat
 * o categorie pe baza descrierii. Folosim 3 niveluri de matching, în ordinea
 * priorității:
 *
 * 1. Keywords personalizate ale userului (userKeywords) — cea mai specifică
 * 2. Descrierea categoriei (categories.description) — keywords globale
 * 3. Numele categoriei (categories.name) — fallback general
 */

import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { Category } from "@/lib/db/schema";

/**
 * Încearcă să găsească o categorie potrivită pentru o tranzacție.
 *
 * @param description - Descrierea tranzacției (ex: "MEGA IMAGE 123", "Netflix subscription")
 * @param userId - ID-ul userului (pentru a căuta keywords personalizate)
 * @param categories - Lista categoriilor userului (fetch-uită o singură dată în bulk import)
 * @returns categoryId dacă s-a găsit o potrivire, null altfel
 */
export async function autoCategorizTransaction(
  description: string,
  userId: string,
  categories: Category[]
): Promise<string | null> {
  const descLower = description.toLowerCase();

  // NIVEL 1: Keywords personalizate ale userului
  // Dacă userul a salvat "mega image" → "Mâncare", le folosim cu prioritate
  const userKeywords = await db
    .select()
    .from(schema.userKeywords)
    .where(and(eq(schema.userKeywords.userId, userId)));

  for (const kw of userKeywords) {
    if (descLower.includes(kw.keyword.toLowerCase())) {
      return kw.categoryId;
    }
  }

  // NIVEL 2: Descrierea categoriei (keywords globale)
  // Ex: categoria "Transport" are description "Benzină, taxi, metrou, parcări"
  for (const category of categories) {
    if (!category.description) continue;
    const keywords = category.description.split(",").map((k) => k.trim().toLowerCase());
    for (const keyword of keywords) {
      if (keyword && descLower.includes(keyword)) {
        return category.id;
      }
    }
  }

  // NIVEL 3: Numele categoriei
  // Dacă description conține chiar numele categoriei (ex: "Netflix" și categoria se numește "Netflix")
  for (const category of categories) {
    if (descLower.includes(category.name.toLowerCase())) {
      return category.id;
    }
  }

  // Nu s-a găsit nicio potrivire
  return null;
}
