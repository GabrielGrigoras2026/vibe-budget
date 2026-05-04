"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password.length < 6) {
      setError("Parola trebuie să aibă cel puțin 6 caractere");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/confirm");
    } catch {
      setError("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-teal-300 to-orange-300" />
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-teal-500/40 blur-3xl" />
      <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full bg-orange-400/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-md glass rounded-2xl p-8 shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💰 Vibe Budget</h1>
          <p className="text-gray-600">Creează-ți contul gratuit</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Nume
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/70 border border-white/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-gray-400 backdrop-blur-sm"
              placeholder="Ion Popescu"
            />
          </div>

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

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-8 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Se creează contul..." : "Creează cont"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-6 text-center">
          Ai deja cont?{" "}
          <Link
            href="/login"
            className="text-teal-600 font-semibold hover:text-orange-500 transition-colors"
          >
            Intră în cont
          </Link>
        </p>
      </div>
    </div>
  );
}
