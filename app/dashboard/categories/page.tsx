"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Category } from "@/lib/db/schema";

const ICONS = [
  "💰", "💳", "🏠", "🍔", "🚗", "✈️",
  "🏥", "📚", "🎮", "👗", "💼", "🎁",
  "⚡", "📱", "🐾", "🌿", "🏋️", "🎵",
  "🛒", "🍷", "💊", "🔧", "🏦", "📊",
];

export default function CategoriesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"income" | "expense" | "transfer" | "savings">("expense");
  const [formIcon, setFormIcon] = useState("📁");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json() as { categories: Category[] };
      setCategories(data.categories ?? []);
    } catch {
      toast.error("Eroare la încărcarea categoriilor");
    } finally {
      setLoadingCats(false);
    }
  };

  const openAddModal = (defaultType: "income" | "expense" | "transfer" | "savings" = "expense") => {
    setEditingCategory(null);
    setFormName("");
    setFormType(defaultType);
    setFormIcon("📁");
    setFormDescription("");
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormType(cat.type as "income" | "expense" | "transfer" | "savings");
    setFormIcon(cat.icon ?? "📁");
    setFormDescription(cat.description ?? "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormName("");
    setFormType("expense");
    setFormIcon("📁");
    setFormDescription("");
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Numele categoriei este obligatoriu");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, type: formType, icon: formIcon, description: formDescription }),
        });
        const data = await res.json() as { category: Category; error?: string };
        if (!res.ok) { toast.error(data.error ?? "Eroare la salvare"); return; }
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? data.category : c)));
        toast.success("Categorie actualizată!");
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, type: formType, icon: formIcon, description: formDescription }),
        });
        const data = await res.json() as { category: Category; error?: string };
        if (!res.ok) { toast.error(data.error ?? "Eroare la salvare"); return; }
        setCategories((prev) => [...prev, data.category]);
        toast.success("Categorie adăugată!");
      }
      closeModal();
    } catch {
      toast.error("Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.isSystemCategory) return;
    if (!window.confirm(`Ștergi categoria "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Eroare la ștergere"); return; }
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success("Categorie ștearsă!");
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

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");
  const transfer = categories.filter((c) => c.type === "transfer");
  const savings = categories.filter((c) => c.type === "savings");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-400 via-teal-300 to-orange-300 flex items-center justify-center">
        <div className="glass rounded-2xl px-8 py-6 text-gray-700 font-semibold">Se încarcă...</div>
      </div>
    );
  }

  const CategoryTable = ({ items, emptyLabel }: { items: Category[]; emptyLabel: string }) => (
    <div className="glass rounded-2xl overflow-hidden">
      {loadingCats ? (
        <div className="p-8 text-center text-gray-700">Se încarcă...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-700 font-semibold">{emptyLabel}</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/30">
              <th className="text-left px-3 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Icon</th>
              <th className="text-left px-2 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Nume</th>
              <th className="text-left px-2 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Tip</th>
              <th className="text-right px-3 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {items.map((cat) => (
              <tr key={cat.id} className="border-b border-white/20 last:border-0 hover:bg-white/20 transition-colors">
                <td className="px-3 py-4 text-2xl">{cat.icon ?? "📁"}</td>
                <td className="px-2 py-4 font-semibold text-gray-900">{cat.name}</td>
                <td className="px-2 py-4">
                  {cat.isSystemCategory && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-white/40 text-gray-600 rounded-full">sistem</span>
                  )}
                </td>
                <td className="px-3 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      Editează
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={cat.isSystemCategory ?? false}
                      className="px-4 py-1.5 bg-red-500 hover:bg-red-400 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
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
  );

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
            <h1 className="text-4xl font-bold text-gray-900">🏷️ Categorii</h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              ← Înapoi
            </button>
          </div>
          <p className="text-gray-700 mb-4">Gestionează categoriile de venituri și cheltuieli</p>
          <button
            onClick={() => openAddModal("expense")}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            + Adaugă categorie
          </button>
        </div>

        {/* Venituri */}
        <div className="mb-8 animate-fade-in delay-1">
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-900">📈 Venituri</h2>
          </div>
          <CategoryTable items={income} emptyLabel="Nicio categorie de venit" />
        </div>

        {/* Cheltuieli */}
        <div className="mb-8 animate-fade-in delay-2">
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-900">📉 Cheltuieli</h2>
          </div>
          <CategoryTable items={expense} emptyLabel="Nicio categorie de cheltuială" />
        </div>

        {/* Transferuri */}
        <div className="mb-8 animate-fade-in delay-2">
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-900">🔄 Transferuri</h2>
          </div>
          <CategoryTable items={transfer} emptyLabel="Nicio categorie de transfer" />
        </div>

        {/* Economii */}
        <div className="animate-fade-in delay-2">
          <div className="mb-3">
            <h2 className="text-xl font-bold text-gray-900">🐷 Economii</h2>
          </div>
          <CategoryTable items={savings} emptyLabel="Nicio categorie de economii" />
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative glass rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCategory ? "Editează categorie" : "Adaugă categorie"}
            </h2>

            <div className="space-y-5">
              {/* Nume */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nume categorie</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: Salariu, Chirie, Mâncare..."
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  autoFocus
                />
              </div>

              {/* Tip */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tip</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormType("income")}
                    className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${formType === "income" ? "bg-green-500 text-white" : "bg-white/60 text-gray-700 hover:bg-white/80"}`}
                  >
                    📈 Venit
                  </button>
                  <button
                    onClick={() => setFormType("expense")}
                    className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${formType === "expense" ? "bg-red-500 text-white" : "bg-white/60 text-gray-700 hover:bg-white/80"}`}
                  >
                    📉 Cheltuială
                  </button>
                  <button
                    onClick={() => setFormType("transfer")}
                    className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${formType === "transfer" ? "bg-blue-500 text-white" : "bg-white/60 text-gray-700 hover:bg-white/80"}`}
                  >
                    🔄 Transfer
                  </button>
                  <button
                    onClick={() => setFormType("savings")}
                    className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${formType === "savings" ? "bg-teal-500 text-white" : "bg-white/60 text-gray-700 hover:bg-white/80"}`}
                  >
                    🐷 Economii
                  </button>
                </div>
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icon — selectat: <span className="text-xl">{formIcon}</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setFormIcon(emoji)}
                      className={`text-2xl p-2 rounded-xl transition-all hover:scale-110 ${formIcon === emoji ? "bg-teal-400/60 ring-2 ring-teal-500" : "bg-white/40 hover:bg-white/70"}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords pentru auto-categorizare */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Keywords auto-categorizare
                </label>
                <p className="text-xs text-gray-500 mb-2">Cuvinte cheie separate prin virgulă (ex: mega image, kaufland, lidl)</p>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="ex: mega image, kaufland, lidl, profi"
                  className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
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
