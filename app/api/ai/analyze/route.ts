import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import Anthropic from "@anthropic-ai/sdk";

interface CategorySummary {
  categoryName: string;
  icon: string;
  total: number;
}

interface MonthSummary {
  label: string;
  total: number;
}

interface AnalyzeRequest {
  totalVenituri: number;
  totalCheltuieli: number;
  byCategory: CategorySummary[];
  byMonth: MonthSummary[];
  period: string;
}

interface AIInsight {
  healthScore: number;
  healthExplanation: string;
  tips: string[];
  positiveObservation: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as AnalyzeRequest;
    const { totalVenituri, totalCheltuieli, byCategory, byMonth, period } = body;

    if (!byCategory || byCategory.length === 0) {
      return NextResponse.json({ error: "Nu există date suficiente pentru analiză" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const categoriesText = byCategory
      .map((c) => `  - ${c.icon} ${c.categoryName}: ${c.total.toFixed(2)} RON`)
      .join("\n");

    const monthsText = byMonth
      .map((m) => `  - ${m.label}: ${m.total.toFixed(2)} RON`)
      .join("\n");

    const balanta = totalVenituri - totalCheltuieli;
    const rataEconomii = totalVenituri > 0 ? ((balanta / totalVenituri) * 100).toFixed(1) : "0";

    const prompt = `Ești un coach financiar personal care analizează datele financiare ale unui utilizator român.

DATE FINANCIARE (perioada: ${period}):
- Total venituri: ${totalVenituri.toFixed(2)} RON
- Total cheltuieli: ${totalCheltuieli.toFixed(2)} RON
- Balanță: ${balanta.toFixed(2)} RON
- Rata de economisire: ${rataEconomii}%

CHELTUIELI PE CATEGORII:
${categoriesText}

TREND LUNAR (cheltuieli):
${monthsText}

Analizează aceste date și răspunde STRICT în formatul JSON de mai jos, fără text în afara JSON-ului:

{
  "healthScore": <număr între 0 și 100>,
  "healthExplanation": "<o propoziție scurtă care explică scorul>",
  "tips": [
    "<sfat 1 concret și personalizat bazat pe date>",
    "<sfat 2 concret și personalizat bazat pe date>",
    "<sfat 3 concret și personalizat bazat pe date>"
  ],
  "positiveObservation": "<un lucru pozitiv concret pe care îl face bine utilizatorul>"
}

Reguli:
- Scorul 0-100: 80+ = excelent, 60-79 = bun, 40-59 = mediu, sub 40 = necesită atenție
- Sfaturile să fie concrete, bazate pe datele reale (menționează categorii și sume)
- Limba română, ton prietenos și motivant
- Nu inventa date care nu există`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001" as string,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    let insight: AIInsight;
    try {
      // Extragem JSON-ul din răspuns (poate fi înconjurat de ```json ... ```)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      insight = JSON.parse(jsonText) as AIInsight;
    } catch {
      console.error("[AI_ANALYZE] Failed to parse JSON:", responseText);
      return NextResponse.json({ error: "Eroare la procesarea răspunsului AI" }, { status: 500 });
    }

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("[AI_ANALYZE] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
