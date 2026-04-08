"use client";

import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import HomeFeatureCard from "@/components/ui/HomeFeatureCard";
import { supabase } from "@/lib/supabase/client";

export default function EuropaMenuPage() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao fazer logout:", error);
        return;
      }

      router.replace("/login");
    } catch (error) {
      console.error("Erro inesperado ao fazer logout:", error);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="flex flex-col items-center px-4 pt-10">
        <h1 className="mb-6 text-center text-4xl font-bold gradient-text">
          Europa
        </h1>

        <div className="mt-2 flex w-full max-w-sm animate-fade-in flex-col gap-5">

          <HomeFeatureCard
            title="Fase 1"
            href="/geografia/europa/paises?fase=1"
            colorClass="bg-[var(--color-2)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Fase 2"
            href="/geografia/europa/paises?fase=2"
            colorClass="bg-[var(--color-5)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Fase 3"
            href="/geografia/europa/paises?fase=3"
            colorClass="bg-[var(--color-6)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Fase 4"
            href="/geografia/europa/paises?fase=4"
            colorClass="bg-[var(--color-7)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Fase 5"
            href="/geografia/europa/paises?fase=5"
            colorClass="bg-[var(--color-4)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Fase 6 - Europa Completa"
            href="/geografia/europa/paises"
            colorClass="bg-[var(--color-5)] hover:brightness-110"
          />

        </div>

        <div className="mt-12 mb-8">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}