"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Period = "current" | "3months" | "6months" | "all" | "custom";

interface CategoryData {
  categoryId: string | null;
  categoryName: string;
  icon: string;
  total: number;
}

interface MonthData {
  month: string;
  label: string;
  total: number;
}

interface PivotRow {
  categoryId: string | null;
  categoryName: string;
  icon: string;
  byMonth: Record<string, number>;
  total: number;
  average: number;
}

interface AIInsight {
  healthScore: number;
  healthExplanation: string;
  tips: string[];
  positiveObservation: string;
}

const COLORS = ["#0d9488", "#f97316", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

const PERIOD_LABELS: Record<Period, string> = {
  current: "Luna curentă",
  "3months": "3 luni",
  "6months": "6 luni",
  all: "Tot",
  custom: "Perioadă",
};

const formatRON = (amount: number) =>
  new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(amount) + " RON";

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [period, setPeriod] = useState<Period>("3months");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [byCategoryData, setByCategoryData] = useState<CategoryData[]>([]);
  const [byMonthData, setByMonthData] = useState<MonthData[]>([]);
  const [totalVenituri, setTotalVenituri] = useState(0);
  const [totalCheltuieli, setTotalCheltuieli] = useState(0);
  const [pivotData, setPivotData] = useState<PivotRow[]>([]);
  const [showPct, setShowPct] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (period === "custom") return; // așteptăm ca userul să completeze datele
    fetchReports();
  }, [user, period]);

  const fetchReports = async (from?: string, to?: string) => {
    setAiInsight(null);
    setLoadingData(true);
    try {
      const url = period === "custom" && from && to
        ? `/api/reports?period=custom&dateFrom=${from}&dateTo=${to}`
        : `/api/reports?period=${period}`;
      const res = await fetch(url);
      const data = await res.json() as { byCategory?: CategoryData[]; byMonth?: MonthData[]; totalVenituri?: number; totalCheltuieli?: number; pivot?: PivotRow[]; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Eroare la încărcarea rapoartelor");
        return;
      }
      setByCategoryData(data.byCategory ?? []);
      setByMonthData(data.byMonth ?? []);
      setTotalVenituri(data.totalVenituri ?? 0);
      setTotalCheltuieli(data.totalCheltuieli ?? 0);
      setPivotData(data.pivot ?? []);
    } catch {
      toast.error("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleAnalyze = async () => {
    if (byCategoryData.length === 0) {
      toast.error("Nu există date de analizat pentru perioada selectată");
      return;
    }
    setLoadingAI(true);
    try {
      const periodLabel = period === "custom"
        ? "perioadă personalizată"
        : PERIOD_LABELS[period].toLowerCase();
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalVenituri, totalCheltuieli, byCategory: byCategoryData, byMonth: byMonthData, period: periodLabel }),
      });
      const data = await res.json() as { insight?: AIInsight; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Eroare la analiză");
        return;
      }
      setAiInsight(data.insight ?? null);
    } catch {
      toast.error("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Ai ieșit din cont");
      router.push("/login");
    } catch {
      toast.error("Eroare la delogare");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-400 via-teal-300 to-orange-300 flex items-center justify-center">
        <div className="glass rounded-2xl px-8 py-6 text-gray-700 font-semibold">Se încarcă...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Fundal gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-teal-400 via-teal-300 to-orange-300 -z-10" />
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 rounded-full bg-teal-500/30 blur-3xl -z-10" />
      <div className="fixed bottom-[-100px] right-[-100px] w-96 h-96 rounded-full bg-orange-400/30 blur-3xl -z-10" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-white/30 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">💰 Vibe Budget</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900">📊 Rapoarte</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            ← Înapoi la Dashboard
          </button>
        </div>

        {/* Selector perioadă */}
        <div className="flex gap-2 mb-4 flex-wrap animate-fade-in delay-1 items-center">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                period === p
                  ? "bg-teal-500 text-white shadow-lg scale-105"
                  : "glass glass-hover text-gray-700"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Selector dată custom */}
        {period === "custom" && (
          <div className="flex items-center gap-3 mb-8 flex-wrap animate-fade-in">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">De la</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 rounded-xl border border-white/40 bg-white/60 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Până la</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 rounded-xl border border-white/40 bg-white/60 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <button
              onClick={() => {
                if (!customFrom || !customTo) {
                  toast.error("Completează ambele date");
                  return;
                }
                if (customFrom > customTo) {
                  toast.error("Data de start trebuie să fie înainte de data de sfârșit");
                  return;
                }
                fetchReports(customFrom, customTo);
              }}
              className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl text-sm transition-all duration-200 hover:scale-105"
            >
              Aplică
            </button>
          </div>
        )}
        {period !== "custom" && <div className="mb-4" />}

        {/* Carduri rezumat financiar */}
        {!loadingData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 animate-fade-in delay-1">
            <div className="glass glass-hover rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📉</span>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total cheltuieli</p>
              </div>
              <p className="text-3xl font-bold text-red-500">-{formatRON(totalCheltuieli)}</p>
            </div>
            <div className="glass glass-hover rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📈</span>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total venituri</p>
              </div>
              <p className="text-3xl font-bold text-green-600">+{formatRON(totalVenituri)}</p>
            </div>
            <div className="glass glass-hover rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">⚖️</span>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Balanță</p>
              </div>
              <p className={`text-3xl font-bold ${totalVenituri - totalCheltuieli >= 0 ? "text-teal-600" : "text-red-500"}`}>
                {totalVenituri - totalCheltuieli >= 0 ? "+" : ""}{formatRON(totalVenituri - totalCheltuieli)}
              </p>
            </div>
          </div>
        )}

        {loadingData ? (
          <div className="glass rounded-2xl p-16 text-center animate-fade-in">
            <p className="text-4xl mb-3">⏳</p>
            <p className="text-gray-700 font-semibold">Se încarcă datele...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart — cheltuieli pe categorii */}
            <div className="glass rounded-2xl p-6 animate-fade-in delay-1">
              <h2 className="text-lg font-bold text-gray-900 mb-1">🥧 Cheltuieli pe categorii</h2>
              <p className="text-sm text-gray-500 mb-4">
                Total: <span className="font-semibold text-gray-800">{formatRON(totalCheltuieli)}</span>
              </p>

              {byCategoryData.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-600 font-semibold">Nicio cheltuială în perioada selectată</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={byCategoryData}
                        dataKey="total"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        strokeWidth={2}
                        stroke="rgba(255,255,255,0.6)"
                      >
                        {byCategoryData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatRON(value), "Cheltuieli"]}
                        contentStyle={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="mt-4 space-y-2">
                    {byCategoryData.map((cat, index) => {
                      const pct = totalCheltuieli > 0 ? ((cat.total / totalCheltuieli) * 100).toFixed(1) : "0.0";
                      return (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-gray-700">{cat.icon} {cat.categoryName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{formatRON(cat.total)}</span>
                            <span className="text-gray-400 text-xs w-12 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Bar Chart — cheltuieli pe luni */}
            <div className="glass rounded-2xl p-6 animate-fade-in delay-2">
              <h2 className="text-lg font-bold text-gray-900 mb-1">📅 Cheltuieli pe luni</h2>
              <p className="text-sm text-gray-500 mb-4">Evoluție lunară</p>

              {byMonthData.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-600 font-semibold">Nicio cheltuială în perioada selectată</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byMonthData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#4b5563" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [formatRON(value), "Cheltuieli"]}
                      contentStyle={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "12px" }}
                      cursor={{ fill: "rgba(255,255,255,0.2)" }}
                    />
                    <Bar dataKey="total" fill="#0d9488" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Tabel Pivot */}
        {!loadingData && pivotData.length > 0 && (
          <div className="mt-6 glass rounded-2xl overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-white/30 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-bold text-gray-900">📋 Raport Pivot — Categorii × Luni</h2>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPct}
                  onChange={(e) => setShowPct(e.target.checked)}
                  className="w-4 h-4 accent-teal-500"
                />
                Arată % față de luna anterioară
              </label>
            </div>

            {/* Legendă culori */}
            <div className="px-6 py-3 border-b border-white/20 flex flex-wrap gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-200 inline-block" />Critic (&gt;150%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-200 inline-block" />Ridicat (120–150%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-100 inline-block" />Normal (80–120%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-100 inline-block" />Sub medie (&lt;80%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white/40 border border-white/40 inline-block" />Fără cheltuieli</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "rgba(148,163,184,0.35)" }}>
                    <th className="text-left px-4 py-3 font-semibold text-gray-800 whitespace-nowrap" style={{ border: "1px solid rgba(100,116,139,0.4)" }}>Categorie</th>
                    {byMonthData.map((m) => (
                      <th key={m.month} className="text-right px-4 py-3 font-semibold text-gray-800 whitespace-nowrap" style={{ border: "1px solid rgba(100,116,139,0.4)" }}>{m.label}</th>
                    ))}
                    <th className="text-right px-4 py-3 font-semibold text-gray-800 whitespace-nowrap" style={{ border: "1px solid rgba(100,116,139,0.4)", backgroundColor: "rgba(99,102,241,0.2)" }}>Total</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-800 whitespace-nowrap" style={{ border: "1px solid rgba(100,116,139,0.4)", backgroundColor: "rgba(99,102,241,0.2)" }}>Medie/lună</th>
                  </tr>
                </thead>
                <tbody>
                  {pivotData.map((row, ri) => (
                    <tr key={ri} className="hover:brightness-95 transition-all">
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap" style={{ border: "1px solid rgba(100,116,139,0.35)" }}>
                        {row.icon} {row.categoryName}
                      </td>
                      {byMonthData.map((m, mi) => {
                        const val = row.byMonth[m.month] ?? 0;
                        const prevMonth = byMonthData[mi - 1];
                        const prevVal = prevMonth ? (row.byMonth[prevMonth.month] ?? 0) : null;
                        const pct = prevVal !== null && prevVal > 0 ? ((val / prevVal) * 100) : null;

                        let cellBg = "transparent";
                        if (val > 0) {
                          if (pct === null) cellBg = "transparent";
                          else if (pct > 150) cellBg = "rgba(239,68,68,0.25)";
                          else if (pct > 120) cellBg = "rgba(249,115,22,0.22)";
                          else if (pct >= 80) cellBg = "rgba(234,179,8,0.18)";
                          else cellBg = "rgba(34,197,94,0.22)";
                        }

                        return (
                          <td key={m.month} className="px-4 py-3 text-right whitespace-nowrap" style={{ border: "1px solid rgba(100,116,139,0.35)", backgroundColor: cellBg }}>
                            {val === 0 ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <div>
                                <div className="font-semibold text-gray-800">
                                  {new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val)}
                                </div>
                                {showPct && pct !== null && (
                                  <div className={`text-xs ${pct > 100 ? "text-red-600" : "text-green-700"}`}>
                                    {pct > 100 ? "+" : ""}{(pct - 100).toFixed(0)}%
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right font-bold text-gray-800 whitespace-nowrap" style={{ border: "1px solid rgba(100,116,139,0.35)", backgroundColor: "rgba(99,102,241,0.12)" }}>
                        {new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 0 }).format(row.total)} RON
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap" style={{ border: "1px solid rgba(100,116,139,0.35)", backgroundColor: "rgba(99,102,241,0.12)" }}>
                        {new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 0 }).format(row.average)} RON
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Creșteri / Scăderi */}
        {!loadingData && byMonthData.length >= 2 && pivotData.length > 0 && (() => {
          const lastMonth = byMonthData[byMonthData.length - 1];
          const prevMonth = byMonthData[byMonthData.length - 2];

          const changes = pivotData
            .map((row) => {
              const last = row.byMonth[lastMonth.month] ?? 0;
              const prev = row.byMonth[prevMonth.month] ?? 0;
              if (prev === 0 && last === 0) return null;
              const pct = prev > 0 ? ((last - prev) / prev) * 100 : null;
              return { ...row, last, prev, pct };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null && r.pct !== null);

          const cresteri = changes.filter((r) => r.pct! > 0).sort((a, b) => b.pct! - a.pct!).slice(0, 5);
          const scaderi = changes.filter((r) => r.pct! < 0).sort((a, b) => a.pct! - b.pct!).slice(0, 5);

          return (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {/* Top Creșteri */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">📈 Top Creșteri Lunare</h2>
                {cresteri.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">Nicio creștere semnificativă</p>
                ) : (
                  <div className="space-y-3">
                    {cresteri.map((r, i) => (
                      <div key={i} className="flex items-center justify-between glass rounded-xl px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{r.icon} {r.categoryName}</p>
                          <p className="text-xs text-gray-500">{lastMonth.label}</p>
                        </div>
                        <span className="font-bold text-red-500 text-sm">+{r.pct!.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Scăderi */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">📉 Top Scăderi Lunare</h2>
                {scaderi.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">Nicio scădere semnificativă</p>
                ) : (
                  <div className="space-y-3">
                    {scaderi.map((r, i) => (
                      <div key={i} className="flex items-center justify-between glass rounded-xl px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{r.icon} {r.categoryName}</p>
                          <p className="text-xs text-gray-500">{lastMonth.label}</p>
                        </div>
                        <span className="font-bold text-green-600 text-sm">{r.pct!.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Buton AI Analyze */}
        {!loadingData && byCategoryData.length > 0 && (
          <div className="mt-8 text-center animate-fade-in">
            <button
              onClick={handleAnalyze}
              disabled={loadingAI}
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-white font-bold rounded-2xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {loadingAI ? "⏳ Se analizează..." : "🤖 Analizează cheltuielile"}
            </button>
            <p className="text-sm text-gray-500 mt-2">Powered by Claude AI</p>
          </div>
        )}

        {/* Card AI Insights */}
        {aiInsight && (
          <div className="mt-6 glass rounded-2xl p-8 animate-fade-in">
            {/* Header + Health Score */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">🤖 AI Financial Coach</h2>
                <p className="text-sm text-gray-500">Analiză personalizată bazată pe datele tale</p>
              </div>
              <div className="text-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                    aiInsight.healthScore >= 80
                      ? "bg-green-500"
                      : aiInsight.healthScore >= 60
                      ? "bg-teal-500"
                      : aiInsight.healthScore >= 40
                      ? "bg-orange-400"
                      : "bg-red-500"
                  }`}
                >
                  {aiInsight.healthScore}
                </div>
                <p className="text-xs font-semibold text-gray-600 mt-1">Health Score</p>
              </div>
            </div>

            <p className="text-gray-700 font-medium mb-6 italic">"{aiInsight.healthExplanation}"</p>

            {/* Observație pozitivă */}
            <div className="glass rounded-xl p-4 mb-5 border border-green-300/40">
              <p className="text-sm font-bold text-green-700 mb-1">✅ Ce faci bine</p>
              <p className="text-gray-700 text-sm">{aiInsight.positiveObservation}</p>
            </div>

            {/* Sfaturi */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">💡 Sfaturi personalizate</p>
              <div className="space-y-3">
                {aiInsight.tips.map((tip, index) => (
                  <div key={index} className="flex gap-3 glass rounded-xl p-4">
                    <span className="text-teal-500 font-bold text-sm flex-shrink-0">{index + 1}.</span>
                    <p className="text-gray-700 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
