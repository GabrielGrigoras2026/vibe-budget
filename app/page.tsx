/**
 * 🏠 HOME PAGE - VIBE BUDGET STARTER
 *
 * Aceasta este pagina de start a aplicației Vibe Budget.
 * În timpul cursului vom construi împreună:
 * - Sistem de autentificare (login/register)
 * - Dashboard cu rezumat financiar
 * - Management bănci, categorii, valute
 * - Lista tranzacții + upload CSV/Excel
 * - Rapoarte și grafice
 * - AI insights (health score, recomandări)
 */

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-teal-300 to-orange-300 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4 drop-shadow">
          💰 Vibe Budget
        </h1>
        <p className="text-xl text-white/80 mb-10">
          Aplicație de gestiune financiară personală
        </p>
        <div className="flex items-center justify-center">
          <a
            href="/login"
            className="px-10 py-3.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl text-lg"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
