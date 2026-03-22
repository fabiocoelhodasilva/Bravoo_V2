"use client";

import { useRouter } from "next/navigation";
import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import GlobeScene from "@/components/geografia/GlobeScene";

export default function Nivel1PaisesPage() {
  const router = useRouter();

  function handleLogout() {
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="flex min-h-[calc(100vh-48px)] flex-col items-center px-4 pt-4 pb-6">
        <h1 className="text-center text-3xl font-bold gradient-text mb-4">
          Nível 1 — América do Sul
        </h1>

        <div className="flex-1 w-full flex items-center justify-center">
          <div className="w-full max-w-[900px] aspect-square max-h-[70vh] sm:max-h-[72vh]">
            <GlobeScene modo="america-sul" />
          </div>
        </div>

        <div className="mt-4">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}