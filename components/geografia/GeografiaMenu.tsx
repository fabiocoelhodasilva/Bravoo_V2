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
        <h1 className="text-center text-4xl font-bold mb-6 gradient-text">
          Geografia
        </h1>

        <GamificationBar
          constancyCount={constancyCount}
          coins={coins}
          constancyRank={constancyRank}
          coinsRank={coinsRank}
        />

        <div className="flex flex-col gap-5 w-full max-w-sm animate-fade-in">
          <HomeFeatureCard
            title="América do Sul — Países"
            href="/geografia/america-do-sul/paises"
            colorClass="bg-[var(--color-5)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="América do Sul — Capitais"
            href="/geografia/america-do-sul/capitais"
            colorClass="bg-[var(--color-5)]/70 hover:brightness-110"
          />

          <HomeFeatureCard
            title="Estados do Brasil"
            href="/geografia/estados"
            colorClass="bg-[var(--color-4)] hover:brightness-110"
          />
        </div>

        <div className="mt-12 mb-8">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}