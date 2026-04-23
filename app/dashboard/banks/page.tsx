"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Bank } from "@/lib/db/schema";

export default function BanksPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchBanks();
  }, [user]);

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/banks");
      const data = await res.json() as { banks: Bank[] };
      setBanks(data.banks ?? []);
    } catch {
      toast.error("Eroare la încărcarea băncilor");
    } finally {
      setLoadingBanks(false);
    }
  };

  const openAddModal = () => {
    setEditingBank(null);
    setFormName("");
    setFormColor("#6366f1");
    setModalOpen(true);
  };

  const openEditModal = (bank: Bank) => {
    setEditingBank(bank);
    setFormName(bank.name);
    setFormColor(bank.color ?? "#6366f1");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBank(null);
    setFormName("");
    setFormColor("#6366f1");
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Numele băncii este obligatoriu");
      return;
    }

    setSaving(true);
    try {
      if (editingBank) {
        const res = await fetch(`/api/banks/${editingBank.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, color: formColor }),
        });
        const data = await res.json() as { bank: Bank; error?: string };
        if (!res.ok) {
          toast.error(data.error ?? "Eroare la salvare");
          return;
        }
        setBanks((prev) => prev.map((b) => (b.id === editingBank.id ? data.bank : b)));
        toast.success("Bancă actualizată!");
      } else {
        const res = await fetch("/api/banks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, color: formColor }),
        });
        const data = await res.json() as { bank: Bank; error?: string };
        if (!res.ok) {
          toast.error(data.error ?? "Eroare la salvare");
          return;
        }
        setBanks((prev) => [...prev, data.bank]);
        toast.success("Bancă adăugată!");
      }
      closeModal();
    } catch {
      toast.error("Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bank: Bank) => {
    if (!window.confirm(`Ștergi banca "${bank.name}"?`)) return;

    try {
      const res = await fetch(`/api/banks/${bank.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Eroare la ștergere");
        return;
      }
      setBanks((prev) => prev.filter((b) => b.id !== bank.id));
      toast.success("Bancă ștearsă!");
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
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">🏦 Bănci</h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              ← Înapoi
            </button>
          </div>
          <p className="text-gray-700 mb-4">Gestionează conturile tale bancare</p>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            + Adaugă bancă
          </button>
        </div>

        {/* Tabel bănci */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in delay-1">
          {loadingBanks ? (
            <div className="p-10 text-center text-gray-700">Se încarcă băncile...</div>
          ) : banks.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-4xl mb-3">🏦</p>
              <p className="text-gray-700 font-semibold">Nicio bancă adăugată încă</p>
              <p className="text-gray-500 text-sm mt-1">Apasă &quot;Adaugă bancă&quot; pentru a începe.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Culoare</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Nume bancă</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank) => (
                  <tr key={bank.id} className="border-b border-white/20 last:border-0 hover:bg-white/20 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        className="w-7 h-7 rounded-lg border border-white/40 shadow-sm"
                        style={{ backgroundColor: bank.color ?? "#6366f1" }}
                      />
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{bank.name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(bank)}
                          className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          Editează
                        </button>
                        <button
                          onClick={() => handleDelete(bank)}
                          className="px-4 py-1.5 bg-red-500 hover:bg-red-400 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          Șterge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal adaugă / editează */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative glass rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingBank ? "Editează bancă" : "Adaugă bancă"}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nume bancă
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: ING Bank, Revolut, BT..."
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Culoare
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border border-white/40 cursor-pointer bg-transparent"
                  />
                  <span className="text-sm text-gray-600 font-mono">{formColor}</span>
                </div>
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
