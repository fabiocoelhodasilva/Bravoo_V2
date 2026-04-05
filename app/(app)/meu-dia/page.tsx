"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MeuDiaPageView } from "@/components/meu-dia/MeuDiaPageView";
import { supabase } from "@/lib/supabase/client";

type TarefaMeuDia = {
  id: string;
  titulo: string;
  concluida: boolean;
};

type MeuDiaHojeStatusRow = {
  tarefa_id: string;
  usuario_id: string;
  titulo: string;
  descricao: string | null;
  ativa: boolean;
  recorrente: boolean;
  frequencia: string | null;
  dias_semana: number[] | null;
  data_inicio: string | null;
  data_fim: string | null;
  tarefa_created_at: string;
  tarefa_updated_at: string;
  tarefa_realizada_id: string | null;
  concluida: boolean;
  concluida_em: string | null;
  data_referencia: string | null;
  realizada_created_at: string | null;
  realizada_updated_at: string | null;
};

function obterDataHojeLocal(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export default function MeuDiaPage() {
  const router = useRouter();

  const [tarefas, setTarefas] = useState<TarefaMeuDia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoIds, setSalvandoIds] = useState<string[]>([]);

  const carregarMeuDia = useCallback(async () => {
    try {
      setCarregando(true);

      const {
        data: { user },
        error: erroAuth,
      } = await supabase.auth.getUser();

      if (erroAuth || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("vw_next_meu_dia_hoje_status")
        .select("*")
        .eq("usuario_id", user.id)
        .order("tarefa_created_at", { ascending: true });

      if (error) {
        console.error("Erro ao buscar tarefas do Meu Dia:", error);
        setTarefas([]);
        return;
      }

      const tarefasFormatadas: TarefaMeuDia[] = (
        (data as MeuDiaHojeStatusRow[] | null) ?? []
      ).map((item) => ({
        id: item.tarefa_id,
        titulo: item.titulo,
        concluida: item.concluida,
      }));

      setTarefas(tarefasFormatadas);
    } catch (error) {
      console.error("Erro inesperado ao carregar Meu Dia:", error);
      setTarefas([]);
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => {
    void carregarMeuDia();
  }, [carregarMeuDia]);

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

  async function handleToggleTarefa(tarefaId: string) {
    const tarefaAtual = tarefas.find((item) => item.id === tarefaId);
    if (!tarefaAtual) return;

    const novoStatus = !tarefaAtual.concluida;

    setTarefas((prev) =>
      prev.map((item) =>
        item.id === tarefaId ? { ...item, concluida: novoStatus } : item
      )
    );
    setSalvandoIds((prev) => [...prev, tarefaId]);

    try {
      const {
        data: { user },
        error: erroAuth,
      } = await supabase.auth.getUser();

      if (erroAuth || !user) {
        throw erroAuth ?? new Error("Usuário não autenticado.");
      }

      const hoje = obterDataHojeLocal();

      const { error } = await supabase
        .from("next_meu_dia_tarefas_realizadas")
        .upsert(
          {
            tarefa_id: tarefaId,
            usuario_id: user.id,
            data_referencia: hoje,
            concluida: novoStatus,
            concluida_em: novoStatus ? new Date().toISOString() : null,
          },
          {
            onConflict: "tarefa_id,data_referencia",
          }
        );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Erro ao atualizar tarefa do Meu Dia:", error);

      setTarefas((prev) =>
        prev.map((item) =>
          item.id === tarefaId
            ? { ...item, concluida: tarefaAtual.concluida }
            : item
        )
      );
    } finally {
      setSalvandoIds((prev) => prev.filter((id) => id !== tarefaId));
    }
  }

  return (
    <MeuDiaPageView
      onLogout={handleLogout}
      tarefasIniciais={carregando ? [] : tarefas}
      onToggleTarefa={handleToggleTarefa}
      salvandoIds={salvandoIds}
    />
  );
}