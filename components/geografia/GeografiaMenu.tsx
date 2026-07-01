"use client";

/* =========================================================
   Imports
========================================================= */

import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import HomeFeatureCard from "@/components/ui/HomeFeatureCard";
import GeografiaResumoDashboard from "@/components/gamification/GeografiaResumoDashboard";
import { supabase } from "@/lib/supabase/client";

/* =========================================================
   Componente principal
========================================================= */

export default function GeografiaMenu() {
  const router = useRouter();

  /* =========================================================
     Logout
  ========================================================= */

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

  /* =========================================================
     Renderização
  ========================================================= */

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="flex flex-col items-center px-3 pt-3 sm:px-4 sm:pt-10">
        <h1 className="mb-3 text-center text-[1.55rem] font-bold leading-tight gradient-text sm:mb-6 sm:text-4xl">
          Geografia
        </h1>

        <div className="w-full max-w-sm">
          <GeografiaResumoDashboard />
        </div>

        <div className="mt-4 flex w-full max-w-sm animate-fade-in flex-col gap-3 sm:mt-6 sm:gap-5">
          <HomeFeatureCard
            title="América do Sul — Países"
            href="/geografia/america-do-sul/paises"
            colorClass="bg-[var(--color-5)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="América Central — Países"
            href="/geografia/america-central/paises"
            colorClass="bg-[var(--color-6)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="América do Norte — Países"
            href="/geografia/america-do-norte/paises"
            colorClass="bg-[var(--color-7)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Europa — Países"
            href="/geografia/europa"
            colorClass="bg-[var(--color-2)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Brasil"
            href="/geografia/brasil"
            colorClass="bg-[var(--color-4)] hover:brightness-110"
          />
        </div>

        <div className="mt-8 mb-6 sm:mt-12 sm:mb-8">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}