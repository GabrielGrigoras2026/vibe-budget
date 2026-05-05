"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "confirmare-esuata") {
      setUrlError("Linkul de confirmare a expirat sau este invalid. Înregistrează-te din nou.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        toast.error("Email sau parolă incorectă");
        return;
      }

      toast.success("Bine ai revenit!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Eroare de conexiune");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Fundal gradient teal → portocaliu */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-teal-300 to-orange-300" />

      {/* Cercuri decorative blur */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-teal-500/40 blur-3xl" />
      <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full bg-orange-400/40 blur-3xl" />

      {/* Card glass */}
      <div className="relative z-10 w-full max-w-md glass rounded-2xl p-8 shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💰 Vibe Budget</h1>
          <p className="text-gray-600">Intră în contul tău</p>
        </div>

        {urlError && (
          <div className="mb-4 bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
            {urlError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white/70 border border-white/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-gray-400 backdrop-blur-sm"
              placeholder="email@exemplu.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Parolă
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/70 border border-white/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-gray-400 backdrop-blur-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-8 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Se încarcă..." : "Intră în cont"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-6 text-center">
          Nu ai cont?{" "}
          <Link
            href="/register"
            className="text-teal-600 font-semibold hover:text-orange-500 transition-colors"
          >
            Înregistrează-te
          </Link>
        </p>
      </div>
    </div>
  );
}
