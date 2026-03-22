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
    <div className="min-h-screen bg-black text-white font-sans">
      <HeaderInterno onLogout={handleLogout} />

      <div className="h-[48px]" />

      <main className="relative w-full h-[calc(100vh-48px)]">
        <GlobeScene modo="america-sul" />

        <div className="absolute bottom-6 w-full flex justify-center z-10">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}