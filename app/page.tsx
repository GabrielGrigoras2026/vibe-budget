import Link from "next/link";
import { BarChart3, Lightbulb, CreditCard } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Rapoarte clare",
    description: "Vizualizează cheltuielile pe categorii și perioade",
  },
  {
    icon: Lightbulb,
    title: "AI inteligent",
    description: "Categorizare automată a tranzacțiilor",
  },
  {
    icon: CreditCard,
    title: "Multi-bancă",
    description: "Importă din ING, BCR, Revolut, PayPal și altele",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="text-center max-w-3xl w-full">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">
          Vibe Budget
        </h1>
        <p className="text-xl text-gray-700 font-medium mb-2">
          Gestionează-ți bugetul inteligent
        </p>
        <p className="text-gray-500 mb-10 text-sm max-w-xl mx-auto">
          Importă extrase bancare, organizează tranzacțiile pe categorii și vezi
          rapoarte detaliate. În plus primești notificări și sfaturi de
          gestionare eficientă
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 flex flex-col items-center text-center border border-gray-200 shadow-sm"
            >
              <Icon className="w-8 h-8 text-indigo-500 mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
              <p className="text-gray-500 text-sm">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
          >
            Înscrie-te
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-white hover:bg-gray-50 text-indigo-600 font-semibold rounded-xl transition-all duration-200 hover:scale-105 border border-gray-300"
          >
            Am deja cont
          </Link>
        </div>
      </div>
    </div>
  );
}
