"use client";

import Header from "./Header";
import GradientTitle from "./GradientTitle";
import HomeFeatureCard from "./ui/HomeFeatureCard";

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center font-sans">
      <Header />

      <GradientTitle>Escolha um Tema</GradientTitle>

      <div className="flex flex-col gap-5 w-full max-w-sm px-4 animate-fade-in">

        <HomeFeatureCard
          title="Minha Jornada"
          href="/objetivos"
          colorClass="bg-[var(--color-2)] hover:brightness-110"
        />

        <HomeFeatureCard
          title="Bíblia"
          href="/biblia"
          colorClass="bg-[var(--color-1)] hover:brightness-110"
        />

        <HomeFeatureCard
          title="Geografia"
          href="/geografia"
          colorClass="bg-[var(--color-5)] hover:brightness-110"
        />

        <HomeFeatureCard
          title="Matemática"
          href="/matematica"
          colorClass="bg-[var(--color-4)] hover:brightness-110"
        />

        <HomeFeatureCard
          title="Virtudes"
          href="/virtudes"
          colorClass="bg-[var(--color-6)] hover:brightness-110"
        />

        <HomeFeatureCard
          title="Meus Resultados"
          href="/relatorios"
          colorClass="bg-[var(--color-7)] hover:brightness-110"
        />

      </div>
    </div>
  );
}