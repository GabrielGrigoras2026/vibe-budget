"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Transaction, Bank, Category } from "@/lib/db/schema";

export default function TransactionsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  // Filtre
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modal descriere
  const [descriptionModal, setDescriptionModal] = useState<string | null>(null);

  // Selectare categorie inline
  const [editingCategoryTxId, setEditingCategoryTxId] = useState<string | null>(null);

  // Recategorizare
  const [recategorizing, setRecategorizing] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCurrency, setFormCurrency] = useState("RON");
  const [formBankId, setFormBankId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json() as { transactions: Transaction[] };
      setAllTransactions(data.transactions ?? []);
    } catch {
      toast.error("Eroare la încărcarea tranzacțiilor");
    } finally {
      setLoadingTx(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user, fetchTransactions]);

  const transactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      const bank = banks.find((b) => b.id === tx.bankId);
      const category = categories.find((c) => c.id === tx.categoryId);
      const q = search.toLowerCase();

      if (search) {
        const inDescription = tx.description.toLowerCase().includes(q);
        const inBank = bank?.name.toLowerCase().includes(q) ?? false;
        const inCategory = category?.name.toLowerCase().includes(q) ?? false;
        const inAmount = String(tx.amount).includes(q);
        const inDate = tx.date.includes(q);
        if (!inDescription && !inBank && !inCategory && !inAmount && !inDate) return false;
      }
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      if (bankFilter && tx.bankId !== bankFilter) return false;
      if (categoryFilter === "__none__" && tx.categoryId !== null) return false;
      if (categoryFilter && categoryFilter !== "__none__" && tx.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [allTransactions, search, dateFrom, dateTo, bankFilter, categoryFilter, banks, categories]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/banks").then((r) => r.json() as Promise<{ banks: Bank[] }>),
      fetch("/api/categories").then((r) => r.json() as Promise<{ categories: Category[] }>),
    ]).then(([banksData, categoriesData]) => {
      setBanks(banksData.banks ?? []);
      setCategories(categoriesData.categories ?? []);
    }).catch(() => {
      toast.error("Eroare la încărcarea datelor");
    });
  }, [user]);

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setBankFilter("");
    setCategoryFilter("");
  };

  const openModal = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setFormAmount("");
    setFormCurrency("RON");
    setFormBankId("");
    setFormCategoryId("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (!formDate || !formDescription.trim() || !formAmount) {
      toast.error("Data, descrierea și suma sunt obligatorii");
      return;
    }
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      toast.error("Suma trebuie să fie un număr diferit de zero");
      return;
    }

    const signedAmount = parsedAmount;

    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formDate,
          description: formDescription.trim(),
          amount: signedAmount,
          currency: formCurrency,
          bankId: formBankId || null,
          categoryId: formCategoryId || null,
        }),
      });
      const data = await res.json() as { transaction: Transaction; error?: string };
      if (!res.ok) { toast.error(data.error ?? "Eroare la salvare"); return; }
      setAllTransactions((prev: Transaction[]) => [data.transaction, ...prev]);
      toast.success("Tranzacție adăugată!");
      closeModal();
    } catch {
      toast.error("Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePeriod = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Selectează perioada De la și Până la înainte de ștergere");
      return;
    }
    const count = transactions.length;
    if (!window.confirm(`Ștergi ${count} tranzacții din perioada ${formatDate(dateFrom)} — ${formatDate(dateTo)}?`)) return;

    try {
      const res = await fetch("/api/transactions/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFrom, dateTo }),
      });
      const data = await res.json() as { deletedCount?: number; error?: string };
      if (!res.ok) { toast.error(data.error ?? "Eroare la ștergere"); return; }
      toast.success(`${data.deletedCount} tranzacții șterse!`);
      fetchTransactions();
    } catch {
      toast.error("Eroare la ștergere");
    }
  };

  const handleDelete = async (tx: Transaction) => {
    if (!window.confirm(`Ștergi tranzacția "${tx.description}"?`)) return;
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Eroare la ștergere"); return; }
      setAllTransactions((prev: Transaction[]) => prev.filter((t: Transaction) => t.id !== tx.id));
      toast.success("Tranzacție ștearsă!");
    } catch {
      toast.error("Eroare la ștergere");
    }
  };

  const handleRecategorize = async () => {
    setRecategorizing(true);
    try {
      const res = await fetch("/api/transactions/recategorize", { method: "POST" });
      const data = await res.json() as { updated?: number; total?: number; error?: string };
      if (!res.ok) { toast.error(data.error ?? "Eroare la recategorizare"); return; }
      if (data.updated === 0) {
        toast.success("Toate tranzacțiile au deja categorie!");
      } else {
        toast.success(`${data.updated} din ${data.total} tranzacții recategorizate!`);
        fetchTransactions();
      }
    } catch {
      toast.error("Eroare de rețea. Încearcă din nou.");
    } finally {
      setRecategorizing(false);
    }
  };

  const handleSetCategory = async (txId: string, categoryId: string | null) => {
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });
      const data = await res.json() as { transaction?: Transaction; error?: string };
      if (!res.ok) { toast.error(data.error ?? "Eroare la actualizare"); return; }
      setAllTransactions((prev) => prev.map((t) => t.id === txId ? { ...t, categoryId } : t));
      setEditingCategoryTxId(null);
      toast.success(categoryId ? "Categorie actualizată!" : "Categorie eliminată!");
    } catch {
      toast.error("Eroare la actualizare");
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

  const formatDate = (date: string) => {
    const [y, m, d] = date.split("-");
    return `${d}.${m}.${y}`;
  };

  const formatAmount = (amount: number, currency: string) => {
    const formatted = new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(Math.abs(amount));
    return `${amount >= 0 ? "+" : "-"}${formatted} ${currency}`;
  };

  const getBankById = (id: string | null) => banks.find((b) => b.id === id) ?? null;
  const getCategoryById = (id: string | null) => categories.find((c) => c.id === id) ?? null;


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
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900">💸 Tranzacții</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            ← Înapoi la Dashboard
          </button>
        </div>

        {/* Filtre */}
        <div className="glass rounded-2xl p-5 mb-6 animate-fade-in delay-1">
          {/* Rândul 1: buton Adaugă + căutare */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={openModal}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg whitespace-nowrap"
            >
              + Adaugă Tranzacție
            </button>
            <button
              onClick={handleRecategorize}
              disabled={recategorizing}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {recategorizing ? "⏳ Se procesează..." : "🔄 Recategorizează"}
            </button>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută după descriere..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/40 bg-white/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
            />
          </div>
          {/* Rândul 2: filtre date + bancă + categorie */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">De la</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 rounded-xl border border-white/40 bg-white/60 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Până la</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 rounded-xl border border-white/40 bg-white/60 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
              />
            </div>
            {dateFrom && dateTo && (
              <button
                onClick={handleDeletePeriod}
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 whitespace-nowrap"
              >
                🗑️ Șterge perioada
              </button>
            )}
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-white/40 bg-white/60 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
            >
              <option value="">Bancă</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-white/40 bg-white/60 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
            >
              <option value="">Categorie</option>
              <option value="__none__">❓ Fără categorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabel */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in delay-2">
          {loadingTx ? (
            <div className="p-10 text-center text-gray-700">Se încarcă tranzacțiile...</div>
          ) : transactions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-4xl mb-3">📂</p>
              <p className="text-gray-700 font-semibold">Nicio tranzacție găsită</p>
              <p className="text-gray-500 text-sm mt-1">Adaugă o tranzacție sau modifică filtrele.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Dată</th>
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Descriere</th>
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Bancă</th>
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Categorie</th>
                  <th className="text-right px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Sumă</th>
                  <th className="text-right px-5 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const bank = getBankById(tx.bankId ?? null);
                  const category = getCategoryById(tx.categoryId ?? null);
                  const amount = Number(tx.amount);
                  return (
                    <tr key={tx.id} className="border-b border-white/20 last:border-0 hover:bg-white/20 transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td
                        className="px-5 py-4 text-sm font-semibold text-gray-900 max-w-[200px] truncate cursor-pointer hover:text-teal-600 transition-colors"
                        onClick={() => setDescriptionModal(tx.description)}
                        title="Click pentru detalii"
                      >{tx.description}</td>
                      <td className="px-5 py-4">
                        {bank ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: bank.color ?? "#6366f1" }}
                            />
                            <span className="text-sm text-gray-700">{bank.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {editingCategoryTxId === tx.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              autoFocus
                              defaultValue={tx.categoryId ?? ""}
                              onChange={(e) => handleSetCategory(tx.id, e.target.value || null)}
                              onBlur={() => setEditingCategoryTxId(null)}
                              className="px-2 py-1 rounded-lg border border-white/40 bg-white/80 text-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                            >
                              <option value="">— Fără categorie —</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                              ))}
                            </select>
                          </div>
                        ) : category ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-gray-700">{category.icon} {category.name}</span>
                            <button
                              onClick={() => setEditingCategoryTxId(tx.id)}
                              className="text-gray-400 hover:text-teal-600 transition-colors text-xs"
                              title="Schimbă categoria"
                            >✏️</button>
                            <button
                              onClick={() => handleSetCategory(tx.id, null)}
                              className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                              title="Elimină categoria"
                            >✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingCategoryTxId(tx.id)}
                            className="text-teal-600 hover:text-teal-700 text-xs font-semibold transition-colors"
                          >
                            + Adaugă
                          </button>
                        )}
                      </td>
                      <td className={`px-5 py-4 text-sm font-bold text-right whitespace-nowrap ${amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {formatAmount(amount, tx.currency)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDelete(tx)}
                          className="px-4 py-1.5 bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          Șterge
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal descriere completă */}
      {descriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDescriptionModal(null)} />
          <div className="relative glass rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Descriere tranzacție</h2>
            <p className="text-gray-800 break-all mb-6 leading-relaxed">{descriptionModal}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(descriptionModal);
                  toast.success("Copiat!");
                }}
                className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-200"
              >
                📋 Copiază
              </button>
              <button
                onClick={() => setDescriptionModal(null)}
                className="flex-1 py-2.5 bg-white/60 hover:bg-white/80 text-gray-700 font-semibold rounded-xl transition-all duration-200"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative glass rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Adaugă tranzacție</h2>

            <div className="space-y-4">
              {/* Dată */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dată</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Sumă + Valută */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sumă (- pentru cheltuieli)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="-50.00"
                    className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    autoFocus
                  />
                </div>
                <div className="w-28">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Valută</label>
                  <input
                    type="text"
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value.toUpperCase())}
                    maxLength={5}
                    className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              {/* Descriere */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descriere</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="ex: Salariu, Chirie, Cumpărături..."
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Bancă */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bancă (opțional)</label>
                <select
                  value={formBankId}
                  onChange={(e) => setFormBankId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">— Fără bancă —</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Categorie */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categorie (opțional)</label>
                <select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">— Fără categorie —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                {saving ? "Se salvează..." : "Salvează"}
              </button>
              <button
                onClick={closeModal}
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
