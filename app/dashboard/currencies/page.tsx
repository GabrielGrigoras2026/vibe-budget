"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Currency } from "@/lib/db/schema";

const PRESETS = [
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

export default function CurrenciesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurr, setLoadingCurr] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formSymbol, setFormSymbol] = useState("");
  const [formName, setFormName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchCurrencies();
  }, [user]);

  const fetchCurrencies = async () => {
    try {
      const res = await fetch("/api/currencies");
      const data = await res.json() as { currencies: Currency[] };
      setCurrencies(data.currencies ?? []);
    } catch {
      toast.error("Eroare la încărcarea valutelor");
    } finally {
      setLoadingCurr(false);
    }
  };

  const hasCode = (code: string) =>
    currencies.some((c) => c.code === code.toUpperCase());

  const addCurrency = async (code: string, symbol: string, name: string) => {
    if (hasCode(code)) {
      toast.error(`Valuta ${code} există deja`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, symbol, name }),
      });
      const data = await res.json() as { currency: Currency; error?: string };
      if (!res.ok) { toast.error(data.error ?? "Eroare la salvare"); return; }
      setCurrencies((prev) => [...prev, data.currency]);
      toast.success(`${code} adăugat!`);
    } catch {
      toast.error("Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManual = async () => {
    if (!formCode.trim() || !formSymbol.trim() || !formName.trim()) {
      toast.error("Toate câmpurile sunt obligatorii");
      return;
    }
    await addCurrency(formCode, formSymbol, formName);
    setModalOpen(false);
    setFormCode("");
    setFormSymbol("");
    setFormName("");
  };

  const handleDelete = async (currency: Currency) => {
    if (!window.confirm(`Ștergi valuta "${currency.code}"?`)) return;
    try {
      const res = await fetch(`/api/currencies/${currency.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Eroare la ștergere"); return; }
      setCurrencies((prev) => prev.filter((c) => c.id !== currency.id));
      toast.success("Valută ștearsă!");
    } catch {
      toast.error("Eroare la ștergere");
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
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">💱 Valute</h1>
            <p className="text-gray-700">Gestionează valutele folosite în tranzacții</p>
          </div>
          <div className="flex flex-col items-end gap-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              ← Înapoi la Dashboard
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              + Adaugă valută
            </button>
          </div>
        </div>

        {/* Preseturi */}
        <div className="glass rounded-2xl p-5 mb-6 animate-fade-in delay-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Preseturi rapide</p>
          <div className="flex flex-wrap gap-3">
            {PRESETS.map((preset) => {
              const exists = hasCode(preset.code);
              return (
                <button
                  key={preset.code}
                  onClick={() => addCurrency(preset.code, preset.symbol, preset.name)}
                  disabled={exists || saving}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    exists
                      ? "bg-white/30 text-gray-400 cursor-not-allowed"
                      : "bg-teal-500 hover:bg-teal-400 text-white hover:scale-105 hover:shadow-md"
                  }`}
                >
                  {exists ? "✓ " : ""}{preset.code} {preset.symbol}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabel */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in delay-2">
          {loadingCurr ? (
            <div className="p-10 text-center text-gray-700">Se încarcă valutele...</div>
          ) : currencies.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-4xl mb-3">💱</p>
              <p className="text-gray-700 font-semibold">Nicio valută adăugată încă</p>
              <p className="text-gray-500 text-sm mt-1">Folosește preseturile de mai sus sau adaugă manual.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Cod</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Simbol</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Nume</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((currency) => (
                  <tr key={currency.id} className="border-b border-white/20 last:border-0 hover:bg-white/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{currency.code}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{currency.symbol}</td>
                    <td className="px-6 py-4 text-gray-700">{currency.name}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(currency)}
                        className="px-4 py-1.5 bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        Șterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal adaugă manual */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative glass rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Adaugă valută</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cod (ex: RON, EUR)</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="MDL"
                  maxLength={5}
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Simbol (ex: lei, €)</label>
                <input
                  type="text"
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value)}
                  placeholder="L"
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nume complet</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Moldovan Leu"
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveManual()}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSaveManual}
                disabled={saving}
                className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                {saving ? "Se salvează..." : "Salvează"}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 bg-white/60 hover:bg-white/80 text-gray-700 font-semibold rounded-xl transition-all duration-300"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
