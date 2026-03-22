"use client";

import { useRouter } from "next/navigation";
import { NovaTarefaForm } from "@/components/meu-dia/NovaTarefaForm";
import HeaderInterno from "@/components/ui/HeaderInterno";

export default function NovaTarefaPage() {
  const router = useRouter();

  async function handleLogout() {
    console.log("logout");
  }

  async function handleSubmit(values: { titulo: string }) {
    console.log("Nova tarefa:", values);

    // depois vamos trocar isso pelo insert no Supabase
    router.push("/meu-dia");
  }

  function handleCancel() {
    router.back();
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <HeaderInterno onLogout={handleLogout} />

      <div className="flex-1 w-full max-w-[1100px] mx-auto px-4 pt-[60px] pb-[90px]">
        <div className="mb-3">
          <h2 className="text-[1.2rem] sm:text-[1.5rem] font-semibold tracking-[-0.2px] text-[#f8f8f8]">
            Nova tarefa
          </h2>
        </div>

        <NovaTarefaForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </main>
  );
}