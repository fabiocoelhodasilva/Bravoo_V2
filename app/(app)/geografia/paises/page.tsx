"use client";

import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import HomeFeatureCard from "@/components/ui/HomeFeatureCard";

export default function PaisesPage() {
  const router = useRouter();

  function handleLogout() {
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="flex flex-col items-center px-4 pt-10">
        <h1 className="text-center text-4xl font-bold mb-10 gradient-text">
          Países
        </h1>

        <div className="flex flex-col gap-5 w-full max-w-sm animate-fade-in">
          {/* América do Sul — Países (azul principal) */}
          <HomeFeatureCard
            title="América do Sul — Países"
            href="/geografia/paises/nivel-01"
            colorClass="bg-[var(--color-5)] hover:brightness-110"
          />

          {/* América do Sul — Capitais (azul mais suave da mesma família) */}
          <HomeFeatureCard
            title="América do Sul — Capitais"
            href="/geografia/paises/capitais-america-sul"
            colorClass="bg-[var(--color-5)]/70 hover:brightness-110"
          />

          {/* Mantidos */}
          <HomeFeatureCard
            title="Nível 2 — Américas"
            href="/geografia/paises/nivel-2"
            colorClass="bg-[var(--color-4)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Nível 3 — Mundo"
            href="/geografia/paises/nivel-3"
            colorClass="bg-[var(--color-6)] hover:brightness-110"
          />
        </div>

        <div className="mt-12 mb-8">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}