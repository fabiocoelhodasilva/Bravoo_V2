"use client";

import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import HomeFeatureCard from "@/components/ui/HomeFeatureCard";
import GamificationBar from "@/components/gamification/GamificationBar";

export default function GeografiaMenu() {
  const router = useRouter();

  function handleLogout() {
    router.push("/");
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
          constancyCount={7}
          coins={128}
          constancyRank={12}
          coinsRank={7}
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