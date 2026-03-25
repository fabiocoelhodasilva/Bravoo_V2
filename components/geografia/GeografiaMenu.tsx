"use client";

import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import HomeFeatureCard from "@/components/ui/HomeFeatureCard";
import GamificationBar from "@/components/gamification/GamificationBar";
import { supabase } from "@/lib/supabaseClient";

type GeografiaMenuProps = {
  constancyCount: number;
  coins: number;
  constancyRank: number;
  coinsRank: number;
};

export default function GeografiaMenu({
  constancyCount,
  coins,
  constancyRank,
  coinsRank,
}: GeografiaMenuProps) {
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

        {/* TÍTULO */}
        <h1 className="text-center text-4xl font-bold mb-6 gradient-text">
          Geografia
        </h1>

        {/* GAMIFICAÇÃO */}
        <GamificationBar
          constancyCount={constancyCount}
          coins={coins}
          constancyRank={constancyRank}
          coinsRank={coinsRank}
        />

        {/* CARDS FUNCIONAIS */}
        <div className="flex flex-col gap-5 w-full max-w-sm animate-fade-in mt-6">

          {/* América do Sul */}
          <HomeFeatureCard
            title="América do Sul — Países"
            href="/geografia/america-do-sul/paises"
            colorClass="bg-[var(--color-5)] hover:brightness-110"
          />

          {/* América Central */}
          <HomeFeatureCard
            title="América Central — Países"
            href="/geografia/america-central/paises"
            colorClass="bg-[var(--color-6)] hover:brightness-110"
          />

        </div>

        {/* BOTÃO VOLTAR */}
        <div className="mt-12 mb-8">
          <BotaoVoltar />
        </div>

      </main>
    </div>
  );
}