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

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState<Summary>({ venituri: 0, cheltuieli: 0, sold: 0 });
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchSummary();
  }, [user]);

  const fetchSummary = async () => {
    try {
      const supabase = createClient();
      const now = new Date();
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

      const { data } = await supabase
        .from("transactions")
        .select("amount")
        .gte("date", firstDay)
        .lte("date", lastDayStr);

      if (!data) return;

      let venituri = 0;
      let cheltuieli = 0;

      data.forEach((t: Pick<Transaction, "amount">) => {
        const amount = Number(t.amount);
        if (amount > 0) venituri += amount;
        else cheltuieli += Math.abs(amount);
      });

      setSummary({ venituri, cheltuieli, sold: venituri - cheltuieli });
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

  const luna = new Date().toLocaleString("ro-RO", { month: "long", year: "numeric" });

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
        </div>

        {/* Placeholder tranzacții */}
        <div className="glass rounded-2xl p-8 animate-fade-in delay-3 text-center">
          <p className="text-4xl mb-4">📂</p>
          <p className="text-gray-700 font-semibold mb-1">Nicio tranzacție încă</p>
          <p className="text-gray-500 text-sm">Importă un extras bancar pentru a vedea datele tale financiare.</p>
        </div>
      </div>
    </div>
  );
}
