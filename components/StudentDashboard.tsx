"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import GradientTitle from "./GradientTitle";
import HomeFeatureCard from "./ui/HomeFeatureCard";
import { supabase } from "@/lib/supabase/client";

export default function StudentDashboard() {
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState("");

  useEffect(() => {
    router.prefetch("/objetivos");
    router.prefetch("/jardim");
    router.prefetch("/geografia");
  }, [router]);

  useEffect(() => {
    async function carregarNomeUsuario() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const nomeMetadata =
        user.user_metadata?.nome ||
        user.user_metadata?.name ||
        user.user_metadata?.full_name;

      const nomeEmail = user.email?.split("@")[0] ?? "";

      const nomeFinal = nomeMetadata || nomeEmail;

      if (nomeFinal) {
        const primeiroNome = nomeFinal.trim().split(" ")[0];
        setNomeUsuario(primeiroNome);
      }
    }

    void carregarNomeUsuario();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center font-sans">
      <Header />

      <GradientTitle>
        {nomeUsuario
          ? `Olá ${nomeUsuario}, escolha um tema!`
          : "Escolha um tema"}
      </GradientTitle>

      <div className="flex flex-col gap-5 w-full max-w-sm px-4 animate-fade-in">
        <HomeFeatureCard
          title="Minha Jornada"
          href="/objetivos"
          colorClass="bg-[var(--color-2)] hover:brightness-110"
        />

        <HomeFeatureCard
          title="Espiritual"
          href="/jardim"
          colorClass="bg-[var(--color-1)] hover:brightness-110"
        />

        <HomeFeatureCard
          title="Geografia"
          href="/geografia"
          colorClass="bg-[var(--color-5)] hover:brightness-110"
        />

        <HomeFeatureCard
          title="Matemática"
          colorClass="bg-[var(--color-4)]"
          disabled
        />

        <HomeFeatureCard
          title="Virtudes"
          colorClass="bg-[var(--color-6)]"
          disabled
        />
      </div>
    </div>
  );
}