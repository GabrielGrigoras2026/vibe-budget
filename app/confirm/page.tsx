import Link from "next/link";

export default function ConfirmPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-teal-300 to-orange-300" />
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-teal-500/40 blur-3xl" />
      <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full bg-orange-400/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-md glass rounded-2xl p-8 shadow-2xl text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Verifică-ți emailul
        </h1>
        <p className="text-gray-600 mb-2">
          Am trimis un link de confirmare la adresa ta.
        </p>
        <p className="text-gray-600 mb-6">
          Deschide emailul pe calculator și dă click pe link pentru a activa contul.
        </p>
        <div className="bg-white/50 rounded-xl px-4 py-3 text-sm text-gray-500 mb-6">
          Linkul este valabil 24 de ore. Dacă nu găsești emailul, verifică și folderul Spam.
        </div>
        <p className="text-sm text-gray-600">
          Nu ai primit emailul?{" "}
          <Link
            href="/register"
            className="text-teal-600 font-semibold hover:text-orange-500 transition-colors"
          >
            Încearcă din nou
          </Link>
        </p>
      </div>
    </div>
  );
}
