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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50  ">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900  mb-6">
            💰 Vibe Budget
          </h1>
          <p className="text-xl text-gray-600  mb-8">
            Aplicație de gestiune financiară personală
          </p>

          <div className="flex items-center justify-center gap-4">
            <a
              href="/register"
              className="px-8 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Înregistrează-te
            </a>
            <a
              href="/login"
              className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
