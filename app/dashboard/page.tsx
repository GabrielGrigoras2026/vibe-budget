"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Transaction } from "@/lib/db/schema";

interface Summary {
  venituri: number;
  cheltuieli: number;
  sold: number;
}

interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState<Summary>({ venituri: 0, cheltuieli: 0, sold: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const now = new Date();
  const isCurrentMonth = selectedMonth.month === now.getMonth() + 1 && selectedMonth.year === now.getFullYear();

  const goToPrevMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.month === 1) return { month: 12, year: prev.year - 1 };
      return { month: prev.month - 1, year: prev.year };
    });
  };

  const goToNextMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.month === 12) return { month: 1, year: prev.year + 1 };
      return { month: prev.month + 1, year: prev.year };
    });
  };

  useEffect(() => {
    if (!user) return;
    fetchSummary();
  }, [user, selectedMonth]);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const supabase = createClient();
      const firstDay = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}-01`;
      const lastDayDate = new Date(selectedMonth.year, selectedMonth.month, 0);
      const lastDayStr = `${lastDayDate.getFullYear()}-${String(lastDayDate.getMonth() + 1).padStart(2, "0")}-${String(lastDayDate.getDate()).padStart(2, "0")}`;

      const { data } = await supabase
        .from("transactions")
        .select("id, date, description, amount, currency")
        .gte("date", firstDay)
        .lte("date", lastDayStr)
        .order("date", { ascending: false });

      if (!data) return;

      let venituri = 0;
      let cheltuieli = 0;

      data.forEach((t: RecentTransaction) => {
        const amount = Number(t.amount);
        if (amount > 0) venituri += amount;
        else cheltuieli += Math.abs(amount);
      });

      setSummary({ venituri, cheltuieli, sold: venituri - cheltuieli });
      setRecentTransactions(data.slice(0, 5));
    } catch {
      // Fără date încă
    } finally {
      setLoadingSummary(false);
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

  const formatRON = (amount: number) =>
    new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(amount) + " RON";

  const luna = new Date(selectedMonth.year, selectedMonth.month - 1, 1)
    .toLocaleString("ro-RO", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-400 via-teal-300 to-orange-300 flex items-center justify-center">
        <div className="glass rounded-2xl px-8 py-6 text-gray-700 font-semibold">
          Se încarcă...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Fundal gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-teal-400 via-teal-300 to-orange-300 -z-10" />
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 rounded-full bg-teal-500/30 blur-3xl -z-10" />
      <div className="fixed bottom-[-100px] right-[-100px] w-96 h-96 rounded-full bg-orange-400/30 blur-3xl -z-10" />

      {/* Navbar glass */}
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
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-1">
            Bună ziua! 👋
          </h1>
          <p className="text-gray-700">Rezumat financiar — <span className="font-semibold capitalize">{luna}</span></p>
        </div>

        {/* Selector lună */}
        <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in delay-1">
          <button
            onClick={goToPrevMonth}
            className="w-10 h-10 glass glass-hover rounded-xl font-bold text-gray-700 text-lg transition-all hover:scale-105"
          >
            ←
          </button>
          <span className="text-lg font-bold text-gray-900 capitalize min-w-[160px] text-center">{luna}</span>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="w-10 h-10 glass glass-hover rounded-xl font-bold text-gray-700 text-lg transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            →
          </button>
        </div>

        {/* Cards rezumat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 animate-fade-in delay-1">
          {/* Sold total */}
          <div className="glass glass-hover rounded-2xl p-6 col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">💳</span>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Sold luna</p>
            </div>
            <p className={`text-3xl font-bold ${summary.sold >= 0 ? "text-teal-600" : "text-red-500"}`}>
              {loadingSummary ? "—" : formatRON(summary.sold)}
            </p>
          </div>

          {/* Venituri */}
          <div className="glass glass-hover rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📈</span>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Venituri</p>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {loadingSummary ? "—" : formatRON(summary.venituri)}
            </p>
          </div>

          {/* Cheltuieli */}
          <div className="glass glass-hover rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📉</span>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Cheltuieli</p>
            </div>
            <p className="text-3xl font-bold text-red-500">
              {loadingSummary ? "—" : formatRON(summary.cheltuieli)}
            </p>
          </div>
        </div>

        {/* Acces rapid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10 animate-fade-in delay-2">
          <a href="/dashboard/transactions" className="glass glass-hover rounded-2xl p-6 text-center cursor-pointer">
            <p className="text-4xl mb-3">💸</p>
            <p className="font-bold text-gray-900 mb-1">Tranzacții</p>
            <p className="text-sm text-gray-600">Lista completă</p>
          </a>
          <a href="/dashboard/upload" className="glass glass-hover rounded-2xl p-6 text-center cursor-pointer">
            <p className="text-4xl mb-3">📤</p>
            <p className="font-bold text-gray-900 mb-1">Upload</p>
            <p className="text-sm text-gray-600">Importă extras bancar</p>
          </a>
          <a href="/dashboard/banks" className="glass glass-hover rounded-2xl p-6 text-center cursor-pointer">
            <p className="text-4xl mb-3">🏦</p>
            <p className="font-bold text-gray-900 mb-1">Bănci</p>
            <p className="text-sm text-gray-600">Gestionează băncile tale</p>
          </a>
          <a href="/dashboard/categories" className="glass glass-hover rounded-2xl p-6 text-center cursor-pointer">
            <p className="text-4xl mb-3">🏷️</p>
            <p className="font-bold text-gray-900 mb-1">Categorii</p>
            <p className="text-sm text-gray-600">Categorii venituri și cheltuieli</p>
          </a>
          <a href="/dashboard/currencies" className="glass glass-hover rounded-2xl p-6 text-center cursor-pointer">
            <p className="text-4xl mb-3">💱</p>
            <p className="font-bold text-gray-900 mb-1">Valute</p>
            <p className="text-sm text-gray-600">Administrează valutele</p>
          </a>
          <a href="/dashboard/reports" className="glass glass-hover rounded-2xl p-6 text-center cursor-pointer">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-bold text-gray-900 mb-1">Rapoarte</p>
            <p className="text-sm text-gray-600">Grafice și statistici</p>
          </a>
        </div>

        {/* Tranzacții recente */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in delay-3">
          <div className="px-6 py-4 border-b border-white/30 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Tranzacții recente</h2>
            <a href="/dashboard/transactions" className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Vezi toate →
            </a>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-4xl mb-3">📂</p>
              <p className="text-gray-700 font-semibold">Nicio tranzacție în {luna}</p>
              <p className="text-gray-500 text-sm mt-1">Importă un extras bancar pentru a vedea datele tale financiare.</p>
            </div>
          ) : (
            <table className="w-full">
              <tbody>
                {recentTransactions.map((tx) => {
                  const [y, m, d] = tx.date.split("-");
                  const amount = Number(tx.amount);
                  return (
                    <tr key={tx.id} className="border-b border-white/20 last:border-0 hover:bg-white/20 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{`${d}.${m}.${y}`}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 truncate max-w-[200px]">{tx.description}</td>
                      <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {amount >= 0 ? "+" : ""}{new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(amount)} {tx.currency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
