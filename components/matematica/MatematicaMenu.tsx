"use client";

/* =========================================================
   Imports
========================================================= */

import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import HomeFeatureCard from "@/components/ui/HomeFeatureCard";
import MatematicaResumoDashboard from "@/components/gamification/MatematicaResumoDashboard";
import { supabase } from "@/lib/supabase/client";

/* =========================================================
   Componente principal
========================================================= */

export default function MatematicaMenu() {
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
          Matemática
        </h1>

        <div className="w-full max-w-sm">
          <MatematicaResumoDashboard />
        </div>

        <div className="mt-4 flex w-full max-w-sm animate-fade-in flex-col gap-3 sm:mt-6 sm:gap-5">
          <HomeFeatureCard
            title="Multiplicação"
            href="/matematica/multiplicacao"
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