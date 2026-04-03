"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Bank } from "@/lib/db/schema";

export default function UploadPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/banks")
      .then((r) => r.json() as Promise<{ banks: Bank[] }>)
      .then((data) => setBanks(data.banks ?? []))
      .catch(() => toast.error("Eroare la încărcarea băncilor"));
  }, [user]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
      toast.error("Doar fișiere .csv, .xlsx sau .xls sunt acceptate");
      return;
    }
    setSelectedFile(file);
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

  const handleUpload = () => {
    toast.info("Upload va fi funcțional în Săptămâna 5, Lecția 5.1");
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
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900">📤 Upload Extras Bancar</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            ← Înapoi la Dashboard
          </button>
        </div>

        {/* Form card */}
        <div className="glass rounded-2xl p-8 mb-6 animate-fade-in delay-1">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 mb-6 ${
              isDragging
                ? "border-teal-500 bg-teal-400/20 scale-[1.01]"
                : selectedFile
                ? "border-green-500 bg-green-400/10"
                : "border-white/40 bg-white/20 hover:bg-white/30 hover:border-white/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">✅</span>
                <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="mt-1 text-xs text-red-500 hover:text-red-600 font-semibold"
                >
                  Elimină fișierul
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="text-5xl">📂</span>
                <p className="font-semibold text-gray-800">
                  {isDragging ? "Dă drumul fișierului..." : "Trage fișierul aici sau click pentru a selecta"}
                </p>
                <p className="text-sm text-gray-500">Acceptă: .csv, .xlsx, .xls</p>
              </div>
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

          {/* Buton Upload */}
          <button
            onClick={handleUpload}
            className="w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-lg"
          >
            ⬆️ Upload
          </button>
        </div>

        {/* Preview table */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in delay-2">
          <div className="px-6 py-4 border-b border-white/30">
            <h2 className="text-lg font-bold text-gray-900">Preview tranzacții</h2>
          </div>
          <div className="p-10 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-700 font-semibold">Selectează un fișier pentru a vedea preview-ul</p>
            <p className="text-gray-500 text-sm mt-1">Coloane: Dată, Descriere, Sumă, Valută</p>
          </div>
        </div>
      </div>
    </div>
  );
}
