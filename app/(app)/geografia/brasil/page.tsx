"use client";

import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import HomeFeatureCard from "@/components/ui/HomeFeatureCard";
import { supabase } from "@/lib/supabase/client";

export default function BrasilMenuPage() {
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
          Brasil
        </h1>

        <div className="mt-2 flex w-full max-w-sm animate-fade-in flex-col gap-5">

          <HomeFeatureCard
            title="Regiões do Brasil"
            href="/geografia/brasil/regioes"
            colorClass="bg-[var(--color-2)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Estados do Brasil"
            href="/geografia/brasil/estados"
            colorClass="bg-[var(--color-5)] hover:brightness-110"
          />

          <HomeFeatureCard
            title="Capitais do Brasil"
            href="/geografia/brasil/capitais"
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