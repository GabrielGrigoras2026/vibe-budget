"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Bank } from "@/lib/db/schema";
import { parseCSV, parseExcel, ParsedTransaction } from "@/lib/utils/file-parser";

export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ totalImported: number; autoCategorized: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/banks")
      .then((r) => r.json() as Promise<{ banks: Bank[] }>)
      .then((data) => setBanks(data.banks ?? []))
      .catch(() => toast.error("Eroare la încărcarea băncilor"));
  }, [user]);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
      toast.error("Doar fișiere .csv, .xlsx sau .xls sunt acceptate");
      return;
    }
    setSelectedFile(file);
    setParsedTransactions([]);

    // Parsare fișier
    let result;
    if (ext === "csv") {
      result = await parseCSV(file);
    } else {
      result = await parseExcel(file);
    }

    if (!result.success || result.transactions.length === 0) {
      toast.error(result.error ?? "Nu s-au găsit tranzacții în fișier");
      return;
    }

    setParsedTransactions(result.transactions);
    toast.success(`${result.transactions.length} tranzacții găsite în fișier`);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0] ?? null;
    handleFileChange(file);
  };

  const handleUpload = async () => {
    if (!selectedBankId || parsedTransactions.length === 0) return;

    setIsImporting(true);
    try {
      const EXCLUDED_DESCRIPTIONS = ["rulaj zi", "sold final zi", "rulaj total cont", "sold anterior"];
      const INCOME_KEYWORDS = ["procesare borderou plata", "procesare borderou plată"];

      const body = parsedTransactions
        .filter((tx) => !EXCLUDED_DESCRIPTIONS.some((excl) => tx.description.toLowerCase().trim() === excl))
        .map((tx) => {
          const descLower = tx.description.toLowerCase();
          const isIncome = INCOME_KEYWORDS.some((kw) => descLower.includes(kw));
          const amount = isIncome ? Math.abs(tx.amount) : tx.amount;
          return {
            bankId: selectedBankId,
            date: tx.date,
            description: tx.description,
            amount,
            currency: tx.currency ?? "RON",
            type: (isIncome || tx.type === "credit") ? "income" : "expense",
          };
        });

      const res = await fetch("/api/transactions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json() as { message?: string; totalImported?: number; autoCategorized?: number; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Eroare la import");
        return;
      }

      setImportResult({
        totalImported: data.totalImported ?? 0,
        autoCategorized: data.autoCategorized ?? 0,
      });
    } catch {
      toast.error("Eroare de rețea. Încearcă din nou.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedTransactions([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const previewTransactions = parsedTransactions.slice(0, 10);
  const remainingCount = parsedTransactions.length - 10;

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
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900">📤 Upload</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap ml-4"
          >
            ← Înapoi
          </button>
        </div>

        {/* Form card */}
        <div className="glass rounded-2xl p-8 mb-6 animate-fade-in delay-1">
          {/* Selectare fișier */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-green-500 bg-green-400/10">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">✅</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setParsedTransactions([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="ml-3 flex-shrink-0 text-sm text-red-500 hover:text-red-600 font-semibold"
                >
                  Elimină
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 rounded-2xl border-2 border-dashed border-white/40 bg-white/20 hover:bg-white/30 hover:border-teal-400 transition-all duration-200 flex flex-col items-center gap-2"
              >
                <span className="text-4xl">📂</span>
                <span className="font-semibold text-gray-800">Selectează fișier CSV sau Excel</span>
                <span className="text-sm text-gray-500">Acceptă: .csv, .xlsx, .xls</span>
              </button>
            )}
          </div>

          {/* Dropdown bancă */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Selectează banca</label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/60 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">— Alege banca —</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Buton Import */}
          <button
            onClick={handleUpload}
            disabled={!selectedBankId || isImporting || parsedTransactions.length === 0}
            className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isImporting
              ? "⏳ Se importă..."
              : `⬆️ Importă ${parsedTransactions.length} tranzacții`}
          </button>
        </div>

        {/* Succes import */}
        {importResult && (
          <div className="glass rounded-2xl p-8 mb-6 animate-fade-in text-center">
            <p className="text-5xl mb-4">🎉</p>
            <p className="text-xl font-bold text-gray-900 mb-1">
              {importResult.totalImported} tranzacții importate
            </p>
            <p className="text-gray-600 mb-6">
              {importResult.autoCategorized} categorizate automat
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-white/60 hover:bg-white/80 text-gray-700 font-semibold rounded-xl border border-white/40 transition-all duration-200"
              >
                📂 Încarcă alt fișier
              </button>
              <button
                onClick={() => router.push("/dashboard/transactions")}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-200"
              >
                💸 Vezi tranzacțiile
              </button>
            </div>
          </div>
        )}

        {/* Preview table */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in delay-2">
          <div className="px-6 py-4 border-b border-white/30">
            <h2 className="text-lg font-bold text-gray-900">Preview tranzacții</h2>
          </div>

          {parsedTransactions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-700 font-semibold">Selectează un fișier pentru a vedea preview-ul</p>
              <p className="text-gray-500 text-sm mt-1">Coloane: Dată, Descriere, Sumă, Valută</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20 bg-white/10">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Dată</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Descriere</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Sumă</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Valută</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewTransactions.map((tx, index) => {
                      const [y, m, d] = tx.date.split("-");
                      const formattedDate = `${d}.${m}.${y}`;
                      return (
                        <tr key={index} className="border-b border-white/10 hover:bg-white/10 transition-colors">
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formattedDate}</td>
                          <td className="px-4 py-3 text-gray-800 max-w-[240px] truncate">{tx.description}</td>
                          <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${tx.amount < 0 ? "text-red-600" : "text-green-600"}`}>
                            {tx.amount < 0 ? "" : "+"}{tx.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{tx.currency ?? "RON"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer tabel */}
              <div className="px-6 py-4 border-t border-white/20 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Total: <span className="font-semibold text-gray-800">{parsedTransactions.length} tranzacții găsite în fișier</span>
                  {remainingCount > 0 && (
                    <span className="ml-2 text-gray-500">...și încă {remainingCount} tranzacții</span>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
