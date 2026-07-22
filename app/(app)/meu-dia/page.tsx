"use client";

/* =========================================================
   Imports
========================================================= */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  MeuDiaPageView,
  type TipoExclusaoTarefa,
} from "@/components/meu-dia/MeuDiaPageView";
import JoiaConquistadaModal from "@/components/gamification/JoiaConquistadaModal";
import { JOIAS } from "@/components/gamification/JoiaIcon";
import { supabase } from "@/lib/supabase/client";
import { sincronizarJoiaMeuDiaPorConclusao } from "@/lib/gamificacao/minhajornada/meu-dia-joias-actions";
import { carregarTotalTopaziosMeuDia } from "@/lib/gamificacao/minhajornada/meu-dia-resumo-service";
import { carregarJoiasSemana } from "@/lib/gamificacao/geral/carregar-joias-semana";

/* =========================================================
   Constantes
========================================================= */

const MATERIA_MEU_DIA_ID = "7f5e2d41-9c84-4d2a-b8c1-1f4e8a6b7001";
const CACHE_PREFIX = "bravoo_meu_dia_v2_";
const EVENTO_JOIA_CONQUISTADA = "bravoo:joia-conquistada";
const JOIA_MEU_DIA = JOIAS.laranja;
const IMAGEM_JOIA_MEU_DIA = JOIA_MEU_DIA.imagem;

/* =========================================================
   Tipos
========================================================= */

type TarefaMeuDia = {
  id: string;
  titulo: string;
  concluida: boolean;
  recorrente: boolean;
  dataInicio: string | null;
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

type MeuDiaCache = {
  tarefas: TarefaMeuDia[];
  totalTopazios: number;
  diasSeguidos: number;
  joiasSemana: Record<string, string>;
};

/* =========================================================
   Funções auxiliares
========================================================= */

function obterDataHojeLocal(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function parseIsoDateLocal(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatIsoDateLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function addDays(data: Date, quantidade: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + quantidade);
  return novaData;
}

function getStartOfWeekSunday(data: Date) {
  const diaSemana = data.getDay();
  return addDays(data, -diaSemana);
}

function obterIntervaloSemana(dataReferencia: string) {
  const data = parseIsoDateLocal(dataReferencia);
  const inicioSemana = getStartOfWeekSunday(data);
  const fimSemana = addDays(inicioSemana, 6);

  return {
    inicio: formatIsoDateLocal(inicioSemana),
    fim: formatIsoDateLocal(fimSemana),
  };
}

function getCacheKey(usuarioId: string, dataReferencia: string) {
  return `${CACHE_PREFIX}${usuarioId}_${dataReferencia}`;
}

function limparCacheMeuDiaUsuario(usuarioId: string) {
  try {
    const prefixoUsuario = `${CACHE_PREFIX}${usuarioId}_`;
    const chavesParaRemover: string[] = [];

    for (let index = 0; index < sessionStorage.length; index += 1) {
      const chave = sessionStorage.key(index);

      if (chave?.startsWith(prefixoUsuario)) {
        chavesParaRemover.push(chave);
      }
    }

    chavesParaRemover.forEach((chave) => sessionStorage.removeItem(chave));
  } catch {
    // Evita quebrar a página caso o navegador bloqueie o sessionStorage.
  }
}

function registrarErroDev(mensagem: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(mensagem, error);
  }
}

function notificarAtualizacaoJoias() {
  window.dispatchEvent(new Event(EVENTO_JOIA_CONQUISTADA));
}

function carregarMeuDiaDoCache(
  usuarioId: string,
  dataReferencia: string
): MeuDiaCache | null {
  try {
    const cache = sessionStorage.getItem(getCacheKey(usuarioId, dataReferencia));
    if (!cache) return null;

    const cacheParseado = JSON.parse(cache) as Partial<MeuDiaCache>;

    return {
      tarefas: cacheParseado.tarefas ?? [],
      totalTopazios: Number(cacheParseado.totalTopazios ?? 0),
      diasSeguidos: Number(cacheParseado.diasSeguidos ?? 0),
      joiasSemana: cacheParseado.joiasSemana ?? {},
    };
  } catch {
    return null;
  }
}

function salvarMeuDiaNoCache(
  usuarioId: string,
  dataReferencia: string,
  cache: MeuDiaCache
) {
  try {
    sessionStorage.setItem(
      getCacheKey(usuarioId, dataReferencia),
      JSON.stringify(cache)
    );
  } catch {
    // Evita quebrar a página caso o navegador bloqueie o sessionStorage.
  }
}

function formatarTarefasMeuDia(
  data: MeuDiaHojeStatusRow[] | null
): TarefaMeuDia[] {
  return (data ?? []).map((item) => ({
    id: item.tarefa_id,
    titulo: item.titulo,
    concluida: item.concluida,
    recorrente: item.recorrente,
    dataInicio: item.data_inicio,
  }));
}

function calcularDiasSeguidosParaExibicao(params: {
  diasSeguidosSalvo: number;
  ultimaDataAtividade: string | null | undefined;
}) {
  const { diasSeguidosSalvo, ultimaDataAtividade } = params;

  if (!ultimaDataAtividade) return 0;

  const hojeIso = obterDataHojeLocal();
  const hoje = new Date(`${hojeIso}T00:00:00`);
  const ultima = new Date(`${ultimaDataAtividade}T00:00:00`);

  const diferencaDias = Math.floor(
    (hoje.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diferencaDias <= 1) {
    return diasSeguidosSalvo;
  }

  return 0;
}

/* =========================================================
   Componente principal
========================================================= */

export default function MeuDiaPage() {
  const router = useRouter();

  const componenteAtivoRef = useRef(true);
  const carregandoMeuDiaRef = useRef(false);

  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  const [tarefas, setTarefas] = useState<TarefaMeuDia[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [salvandoIds, setSalvandoIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const [totalTopazios, setTotalTopazios] = useState(0);
  const [diasSeguidos, setDiasSeguidos] = useState(0);
  const [joiasSemana, setJoiasSemana] = useState<Record<string, string>>({});
  const [joiaConquistada, setJoiaConquistada] = useState(false);

  const [dataSelecionada, setDataSelecionada] = useState<string>(
    obterDataHojeLocal()
  );

  /* =========================================================
     Controle de montagem
  ========================================================= */

  useEffect(() => {
    componenteAtivoRef.current = true;

    return () => {
      componenteAtivoRef.current = false;
    };
  }, []);

  /* =========================================================
     Busca total de topázios
  ========================================================= */

  const carregarTotalTopazios = useCallback(async (idUsuario: string) => {
    return carregarTotalTopaziosMeuDia({
      supabase,
      usuarioId: idUsuario,
    });
  }, []);

  /* =========================================================
     Busca persistência atual do Meu Dia
  ========================================================= */

  const carregarDiasSeguidosMeuDia = useCallback(async (idUsuario: string) => {
    try {
      const { data, error } = await supabase
        .from("next_sequencia_dias_usuario")
        .select("dias_seguidos, ultima_data_atividade")
        .eq("usuario_id", idUsuario)
        .eq("materia_id", MATERIA_MEU_DIA_ID)
        .maybeSingle();

      if (error) {
        registrarErroDev("Erro ao buscar persistência do Meu Dia:", error);
        return 0;
      }

      return calcularDiasSeguidosParaExibicao({
        diasSeguidosSalvo: Number(data?.dias_seguidos ?? 0),
        ultimaDataAtividade: data?.ultima_data_atividade ?? null,
      });
    } catch (error) {
      registrarErroDev("Erro inesperado ao buscar persistência:", error);
      return 0;
    }
  }, []);

  /* =========================================================
     Busca joias da semana visível
  ========================================================= */

  const carregarJoiasSemanaMeuDia = useCallback(
    async (idUsuario: string, dataReferencia: string) => {
      const intervaloSemana = obterIntervaloSemana(dataReferencia);

      return carregarJoiasSemana({
        supabase,
        usuarioId: idUsuario,
        materiaId: MATERIA_MEU_DIA_ID,
        dataInicio: intervaloSemana.inicio,
        dataFim: intervaloSemana.fim,
        imagemJoia: IMAGEM_JOIA_MEU_DIA,
      });
    },
    []
  );

  /* =========================================================
     Carrega Meu Dia com cache rápido + atualização real
  ========================================================= */

  const carregarMeuDia = useCallback(
    async (dataReferencia: string) => {
      if (carregandoMeuDiaRef.current) return;

      carregandoMeuDiaRef.current = true;

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

        if (!componenteAtivoRef.current) return;

        setUsuarioId(user.id);

        const cache = carregarMeuDiaDoCache(user.id, dataReferencia);

        if (cache) {
          setTarefas(cache.tarefas);
          setTotalTopazios(cache.totalTopazios);
          setDiasSeguidos(cache.diasSeguidos);
          setJoiasSemana(cache.joiasSemana);
          setCarregando(false);
        }

        const [
          tarefasResponse,
          totalTopaziosAtualizado,
          diasSeguidosAtualizado,
          joiasSemanaAtualizadas,
        ] = await Promise.all([
          supabase.rpc("fn_next_meu_dia_status", {
            p_usuario_id: user.id,
            p_data: dataReferencia,
          }),
          carregarTotalTopazios(user.id),
          carregarDiasSeguidosMeuDia(user.id),
          carregarJoiasSemanaMeuDia(user.id, dataReferencia),
        ]);

        if (!componenteAtivoRef.current) return;

        if (tarefasResponse.error) {
          registrarErroDev(
            "Erro ao buscar tarefas do Meu Dia:",
            tarefasResponse.error
          );

          if (!cache) {
            setTarefas([]);
          }

          return;
        }

        const tarefasFormatadas = formatarTarefasMeuDia(
          tarefasResponse.data as MeuDiaHojeStatusRow[] | null
        );

        setTarefas(tarefasFormatadas);
        setTotalTopazios(totalTopaziosAtualizado);
        setDiasSeguidos(diasSeguidosAtualizado);
        setJoiasSemana(joiasSemanaAtualizadas);

        salvarMeuDiaNoCache(user.id, dataReferencia, {
          tarefas: tarefasFormatadas,
          totalTopazios: totalTopaziosAtualizado,
          diasSeguidos: diasSeguidosAtualizado,
          joiasSemana: joiasSemanaAtualizadas,
        });
      } catch (error) {
        registrarErroDev("Erro inesperado ao carregar Meu Dia:", error);

        if (componenteAtivoRef.current) {
          setTarefas([]);
          setJoiasSemana({});
        }
      } finally {
        carregandoMeuDiaRef.current = false;

        if (componenteAtivoRef.current) {
          setCarregando(false);
        }
      }
    },
    [router, carregarTotalTopazios, carregarDiasSeguidosMeuDia, carregarJoiasSemanaMeuDia]
  );

  useEffect(() => {
    void carregarMeuDia(dataSelecionada);
  }, [carregarMeuDia, dataSelecionada]);

  /* =========================================================
     Logout
  ========================================================= */

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        registrarErroDev("Erro ao fazer logout:", error);
        return;
      }

      router.replace("/login");
    } catch (error) {
      registrarErroDev("Erro inesperado ao fazer logout:", error);
    }
  }, [router]);

  /* =========================================================
     Atualiza tarefa com resposta otimista
  ========================================================= */

  const handleToggleTarefa = useCallback(
    async (tarefaId: string) => {
      const tarefaAtual = tarefas.find((item) => item.id === tarefaId);
      if (!tarefaAtual) return;

      const idUsuario = usuarioId;

      if (!idUsuario) {
        router.replace("/login");
        return;
      }

      const novoStatus = !tarefaAtual.concluida;

      const tarefasAtualizadas = tarefas.map((item) =>
        item.id === tarefaId ? { ...item, concluida: novoStatus } : item
      );

      setTarefas(tarefasAtualizadas);

      salvarMeuDiaNoCache(idUsuario, dataSelecionada, {
        tarefas: tarefasAtualizadas,
        totalTopazios,
        diasSeguidos,
        joiasSemana,
      });

      setSalvandoIds((prev) =>
        prev.includes(tarefaId) ? prev : [...prev, tarefaId]
      );

      try {
        const { error } = await supabase
          .from("next_meu_dia_tarefas_realizadas")
          .upsert(
            {
              tarefa_id: tarefaId,
              usuario_id: idUsuario,
              data_referencia: dataSelecionada,
              concluida: novoStatus,
              concluida_em: novoStatus ? new Date().toISOString() : null,
              excluida: false,
            },
            {
              onConflict: "tarefa_id,data_referencia",
            }
          );

        if (error) {
          throw error;
        }

        const resultadoJoia = await sincronizarJoiaMeuDiaPorConclusao(
          dataSelecionada
        );

        if (resultadoJoia.joiaConquistada) {
          setJoiaConquistada(true);
        }

        if (resultadoJoia.joiaConquistada || resultadoJoia.joiaRemovida) {
          notificarAtualizacaoJoias();
        }

        const [
          totalAtualizado,
          diasSeguidosAtualizado,
          joiasSemanaAtualizadas,
        ] = await Promise.all([
          carregarTotalTopazios(idUsuario),
          carregarDiasSeguidosMeuDia(idUsuario),
          carregarJoiasSemanaMeuDia(idUsuario, dataSelecionada),
        ]);

        if (!componenteAtivoRef.current) return;

        setTotalTopazios(totalAtualizado);
        setDiasSeguidos(diasSeguidosAtualizado);
        setJoiasSemana(joiasSemanaAtualizadas);

        salvarMeuDiaNoCache(idUsuario, dataSelecionada, {
          tarefas: tarefasAtualizadas,
          totalTopazios: totalAtualizado,
          diasSeguidos: diasSeguidosAtualizado,
          joiasSemana: joiasSemanaAtualizadas,
        });
      } catch (error) {
        registrarErroDev("Erro ao atualizar tarefa do Meu Dia:", error);

        const tarefasRestauradas = tarefas.map((item) =>
          item.id === tarefaId
            ? { ...item, concluida: tarefaAtual.concluida }
            : item
        );

        setTarefas(tarefasRestauradas);

        salvarMeuDiaNoCache(idUsuario, dataSelecionada, {
          tarefas: tarefasRestauradas,
          totalTopazios,
          diasSeguidos,
          joiasSemana,
        });
      } finally {
        setSalvandoIds((prev) => prev.filter((id) => id !== tarefaId));
      }
    },
    [
      tarefas,
      usuarioId,
      router,
      dataSelecionada,
      totalTopazios,
      diasSeguidos,
      carregarTotalTopazios,
      carregarDiasSeguidosMeuDia,
      carregarJoiasSemanaMeuDia,
      joiasSemana,
    ]
  );

  /* =========================================================
     Exclui tarefa
  ========================================================= */

  const handleDeleteTarefa = useCallback(
    async (tarefaId: string, tipoExclusao: TipoExclusaoTarefa) => {
      const hoje = obterDataHojeLocal();

      if (dataSelecionada < hoje) {
        throw new Error("Não é permitido excluir tarefas de dias passados.");
      }

      const idUsuario = usuarioId;

      if (!idUsuario) {
        router.replace("/login");
        return;
      }

      const tarefaAtual = tarefas.find((item) => item.id === tarefaId);

      if (!tarefaAtual) {
        throw new Error("Tarefa não encontrada.");
      }

      const tipoExclusaoSeguro = tarefaAtual.recorrente
        ? tipoExclusao
        : "apenas_esta";

      setDeletingIds((prev) =>
        prev.includes(tarefaId) ? prev : [...prev, tarefaId]
      );

      try {
        if (tipoExclusaoSeguro === "apenas_esta") {
          const { error } = await supabase
            .from("next_meu_dia_tarefas_realizadas")
            .upsert(
              {
                tarefa_id: tarefaId,
                usuario_id: idUsuario,
                data_referencia: dataSelecionada,
                concluida: false,
                concluida_em: null,
                excluida: true,
              },
              {
                onConflict: "tarefa_id,data_referencia",
              }
            );

          if (error) {
            throw error;
          }
        } else {
          const dataAnterior = formatIsoDateLocal(
            addDays(parseIsoDateLocal(dataSelecionada), -1)
          );

          const encerrarAntesDoInicio =
            tarefaAtual.dataInicio !== null &&
            dataSelecionada <= tarefaAtual.dataInicio;

          const atualizacao = encerrarAntesDoInicio
            ? { ativa: false }
            : { data_fim: dataAnterior };

          const { error } = await supabase
            .from("next_meu_dia_tarefas")
            .update(atualizacao)
            .eq("id", tarefaId)
            .eq("usuario_id", idUsuario);

          if (error) {
            throw error;
          }
        }

        const tarefasAtualizadas = tarefas.filter(
          (item) => item.id !== tarefaId
        );

        setTarefas(tarefasAtualizadas);
        limparCacheMeuDiaUsuario(idUsuario);

        const resultadoJoia = await sincronizarJoiaMeuDiaPorConclusao(
          dataSelecionada
        );

        if (resultadoJoia.joiaConquistada || resultadoJoia.joiaRemovida) {
          notificarAtualizacaoJoias();
        }

        const [
          totalAtualizado,
          diasSeguidosAtualizado,
          joiasSemanaAtualizadas,
        ] = await Promise.all([
          carregarTotalTopazios(idUsuario),
          carregarDiasSeguidosMeuDia(idUsuario),
          carregarJoiasSemanaMeuDia(idUsuario, dataSelecionada),
        ]);

        if (!componenteAtivoRef.current) return;

        setTotalTopazios(totalAtualizado);
        setDiasSeguidos(diasSeguidosAtualizado);
        setJoiasSemana(joiasSemanaAtualizadas);

        salvarMeuDiaNoCache(idUsuario, dataSelecionada, {
          tarefas: tarefasAtualizadas,
          totalTopazios: totalAtualizado,
          diasSeguidos: diasSeguidosAtualizado,
          joiasSemana: joiasSemanaAtualizadas,
        });
      } catch (error) {
        registrarErroDev("Erro ao excluir tarefa do Meu Dia:", error);
        throw error;
      } finally {
        setDeletingIds((prev) => prev.filter((id) => id !== tarefaId));
      }
    },
    [
      tarefas,
      usuarioId,
      router,
      dataSelecionada,
      carregarTotalTopazios,
      carregarDiasSeguidosMeuDia,
      carregarJoiasSemanaMeuDia,
    ]
  );

  /* =========================================================
     Renderização
  ========================================================= */

  return (
    <>
      <MeuDiaPageView
        onLogout={handleLogout}
        tarefasIniciais={carregando ? [] : tarefas}
        onToggleTarefa={handleToggleTarefa}
        onDeleteTarefa={handleDeleteTarefa}
        salvandoIds={salvandoIds}
        deletingIds={deletingIds}
        dataSelecionada={dataSelecionada}
        onSelecionarData={setDataSelecionada}
        totalTopazios={totalTopazios}
        diasSeguidos={diasSeguidos}
        joiasSemana={joiasSemana}
      />

      <JoiaConquistadaModal
        aberto={joiaConquistada}
        nomeJoia={JOIA_MEU_DIA.nome}
        nomeMateria={JOIA_MEU_DIA.materia}
        imagemJoia={JOIA_MEU_DIA.imagem}
        cor="laranja"
        mensagem="Parabéns! Você completou suas atividades e conquistou o Topázio da Minha Jornada."
        onFechar={() => setJoiaConquistada(false)}
      />
    </>
  );
}