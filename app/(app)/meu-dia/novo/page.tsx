"use client";

import { useRouter } from "next/navigation";
import {
  NovaTarefaForm,
  type NovaTarefaFormValues,
} from "@/components/meu-dia/NovaTarefaForm";
import HeaderInterno from "@/components/ui/HeaderInterno";
import { supabase } from "@/lib/supabase/client";

function obterDataHojeLocal(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export default function NovaTarefaPage() {
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

  async function handleSubmit(values: NovaTarefaFormValues) {
    try {
      const tituloLimpo = values.titulo.trim();
      const descricaoLimpa = values.descricao.trim();

      if (!tituloLimpo) {
        console.error("Título da tarefa vazio.");
        return;
      }

      const {
        data: { user },
        error: erroAuth,
      } = await supabase.auth.getUser();

      if (erroAuth || !user) {
        console.error("Usuário não autenticado:", erroAuth);
        router.replace("/login");
        return;
      }

      const dataHoje = obterDataHojeLocal();

      const payload = {
        usuario_id: user.id,
        titulo: tituloLimpo,
        descricao: descricaoLimpa || null,
        recorrente: values.recorrente,
        frequencia: values.recorrente ? values.frequencia : null,
        dias_semana:
          values.recorrente && values.frequencia === "semanal"
            ? values.diasSemana
            : null,
        data_inicio: dataHoje,
        data_fim: values.recorrente ? null : dataHoje,
      };

      const { error } = await supabase
        .from("next_meu_dia_tarefas")
        .insert(payload);

      if (error) {
        console.error("Erro ao criar tarefa:", error);
        throw error;
      }

      router.push("/meu-dia");
    } catch (error) {
      console.error("Erro inesperado ao salvar nova tarefa:", error);
      throw error;
    }
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