"use client";

/* =========================================================
   Imports
========================================================= */

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import HeaderInterno from "@/components/ui/HeaderInterno";
import BotaoVoltar from "@/components/ui/BotaoVoltar";
import { supabase } from "@/lib/supabase/client";
import { salvarSessaoAtividade } from "@/lib/sessoes/sessoes-service";
import { tabuadaAtingiuPercentualMinimo } from "@/lib/gamificacao/matematica/tabuada-rules";
import {
  alterarMetaTabuada,
  buscarMetaTabuada,
  META_TABUADA_PADRAO,
} from "@/lib/gamificacao/matematica/tabuada-joias-actions";

/* =========================================================
   IDs fixos
========================================================= */

const MATEMATICA_MATERIA_ID = "24b7c418-81b4-47c2-b96f-f051786fa187";
const TABUADA_ASSUNTO_ID = "84d7724b-2272-4014-960d-b04733430473";
const MULTIPLICACAO_ATIVIDADE_ID = "ab1333a9-41dd-4c06-8232-4fe600c9c4ab";

/* =========================================================
   Dados fixos da atividade
========================================================= */

const TABUADAS = [2, 3, 4, 5, 6, 7, 8, 9];
const MULTIPLICADORES = [2, 3, 4, 5, 6, 7, 8, 9, 10];

const DETALHES_TABUADA: Record<number, string> = {
  2: "c6202a56-b5f0-45f3-8381-537ec25fd53c",
  3: "2e2982a5-a475-467b-b2fc-5839c84039b4",
  4: "f06ae1dc-2bfc-4826-88bc-e273fd7b6327",
  5: "a7ad8c2d-af3e-4906-90ea-6dbf541b0cc2",
  6: "982e9ec4-182e-472e-9b15-cc29933b55ea",
  7: "feef8da4-b19c-41bb-ae1a-e65cecfaf3c1",
  8: "22f2dbb1-3112-4150-8f6b-b152ad95bb34",
  9: "aaf4598f-4bc3-4c91-8565-c0212f1a969f",
};

const TABUADA_POR_DETALHE_ID: Record<string, number> = Object.fromEntries(
  Object.entries(DETALHES_TABUADA).map(([tabuada, detalheId]) => [
    detalheId,
    Number(tabuada),
  ])
);

/* =========================================================
   Tipos
========================================================= */

type Rodada = "ordem" | "embaralhada";

type QuestaoBanco = {
  id: string;
  enunciado: string;
  resposta_correta: string;
  nivel_dificuldade: string | null;
};

type QuestaoTela = {
  id: string | null;
  enunciado: string;
  resposta_correta: string;
  nivel_dificuldade: string | null;
  tabuada: number;
  multiplicador: number;
};

type RespostasUsuario = Record<string, string>;
type CamposValidados = Record<string, boolean>;

type ResultadoAquecimento = {
  tabuada: number;
  acertos: number;
  totalItens: number;
  tempoTotalSegundos: number;
};

type ResultadoConclusao = {
  tabuada: number;
  acertos: number;
  totalItens: number;
  tempoTotalSegundos: number;
};

type ResultadoGravacaoRodada = {
  sucesso: boolean;
  acertos: number;
  totalItens: number;
  tempoTotalSegundos: number;
};

type RespostaRevisao = {
  questaoId: string;
  enunciado: string;
  respostaCorreta: string;
  respostaUsuario: string;
  correta: boolean;
  multiplicador: number;
};

type ResumoRevisao = {
  tabuada: number;
  acertos: number;
  totalItens: number;
  tempoTotalSegundos: number;
  dataExecucao: string;
  atingiuMinimo: boolean;
};

/* =========================================================
   Componente principal
========================================================= */

export default function MultiplicacaoPageView() {
  const router = useRouter();

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const inicioRodadaRef = useRef<number>(Date.now());

  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [tabuadaSelecionada, setTabuadaSelecionada] = useState(2);
  const [rodada, setRodada] = useState<Rodada>("ordem");
  const [ordemMultiplicadores, setOrdemMultiplicadores] =
    useState<number[]>(MULTIPLICADORES);

  const [questoesBanco, setQuestoesBanco] = useState<QuestaoBanco[]>([]);
  const [respostas, setRespostas] = useState<RespostasUsuario>({});
  const [camposValidados, setCamposValidados] = useState<CamposValidados>({});
  const [tabuadasTentadasHoje, setTabuadasTentadasHoje] = useState<number[]>([]);
  const [tabuadasConcluidasHoje, setTabuadasConcluidasHoje] =
    useState<number[]>([]);

  const [tabuadasMetaHoje, setTabuadasMetaHoje] = useState<number[]>([
    ...META_TABUADA_PADRAO,
  ]);
  const [metaTabuadaConfigurada, setMetaTabuadaConfigurada] = useState(false);
  const [modalMetaAberto, setModalMetaAberto] = useState(false);
  const [tabuadasMetaEdicao, setTabuadasMetaEdicao] = useState<number[]>([
    ...META_TABUADA_PADRAO,
  ]);
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [mensagemMeta, setMensagemMeta] = useState("");

  const [processandoRodada, setProcessandoRodada] = useState(false);
  const [resultadoAquecimento, setResultadoAquecimento] =
    useState<ResultadoAquecimento | null>(null);
  const [resultadoConclusao, setResultadoConclusao] =
    useState<ResultadoConclusao | null>(null);

  const [modoRevisao, setModoRevisao] = useState(false);
  const [resumoRevisao, setResumoRevisao] = useState<ResumoRevisao | null>(null);
  const [respostasRevisao, setRespostasRevisao] = useState<
    Record<string, RespostaRevisao>
  >({});

  /* =========================================================
     Inicialização
  ========================================================= */

  useEffect(() => {
    inicializarPagina();
  }, []);

  /* =========================================================
     Formatações
  ========================================================= */

  function formatarDataHoraLocal(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    const hora = String(data.getHours()).padStart(2, "0");
    const minuto = String(data.getMinutes()).padStart(2, "0");
    const segundo = String(data.getSeconds()).padStart(2, "0");

    return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
  }

  function formatarTextoAcertos(acertos: number, totalItens: number) {
    return `${acertos} acertos de ${totalItens} questões`;
  }

  function formatarTempo(tempoTotalSegundos: number) {
    const minutos = Math.floor(tempoTotalSegundos / 60);
    const segundos = tempoTotalSegundos % 60;

    if (minutos <= 0) {
      return `${segundos} segundos`;
    }

    if (segundos === 0) {
      return `${minutos}min`;
    }

    return `${minutos}min e ${segundos} seg`;
  }

  /* =========================================================
     Funções auxiliares da tabuada
  ========================================================= */

  function gerarEnunciado(tabuada: number, multiplicador: number) {
    return `${tabuada} x ${multiplicador}`;
  }

  function gerarChaveResposta(
    tabuada: number,
    multiplicador: number,
    rodadaAtual: Rodada = rodada
  ) {
    return `${tabuada}x${multiplicador}-${rodadaAtual}`;
  }

  function extrairNumerosDoEnunciado(enunciado: string) {
    const numeros = enunciado.match(/\d+/g);

    if (!numeros || numeros.length < 2) {
      return null;
    }

    return {
      tabuada: Number(numeros[0]),
      multiplicador: Number(numeros[1]),
    };
  }

  function buscarQuestaoNoBanco(tabuada: number, multiplicador: number) {
    return questoesBanco.find((questao) => {
      const numeros = extrairNumerosDoEnunciado(questao.enunciado);

      if (!numeros) return false;

      return (
        numeros.tabuada === tabuada &&
        numeros.multiplicador === multiplicador
      );
    });
  }

  function embaralharArray(array: number[]) {
    const novoArray = [...array];

    for (let i = novoArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [novoArray[i], novoArray[j]] = [novoArray[j], novoArray[i]];
    }

    return novoArray;
  }

  /* =========================================================
     Questões exibidas na tela
  ========================================================= */

  const questoesDaTabuadaSelecionada = useMemo<QuestaoTela[]>(() => {
    return ordemMultiplicadores.map((multiplicador) => {
      const enunciado = gerarEnunciado(tabuadaSelecionada, multiplicador);
      const questaoBanco = buscarQuestaoNoBanco(
        tabuadaSelecionada,
        multiplicador
      );

      return {
        id: questaoBanco?.id ?? null,
        enunciado,
        resposta_correta:
          questaoBanco?.resposta_correta ??
          String(tabuadaSelecionada * multiplicador),
        nivel_dificuldade: questaoBanco?.nivel_dificuldade ?? null,
        tabuada: tabuadaSelecionada,
        multiplicador,
      };
    });
  }, [tabuadaSelecionada, ordemMultiplicadores, questoesBanco]);

  const todasRespostasPreenchidas = useMemo(() => {
    if (modoRevisao) return false;

    return questoesDaTabuadaSelecionada.every((questao) => {
      const chave = gerarChaveResposta(
        questao.tabuada,
        questao.multiplicador
      );

      return Boolean((respostas[chave] ?? "").trim());
    });
  }, [
    modoRevisao,
    questoesDaTabuadaSelecionada,
    respostas,
    rodada,
  ]);

  /* =========================================================
     Carregamento inicial
  ========================================================= */

  async function inicializarPagina() {
    const { data } = await supabase.auth.getUser();
    const idUsuario = data.user?.id ?? null;

    setUsuarioId(idUsuario);
    inicioRodadaRef.current = Date.now();

    await buscarQuestoesTabuada();

    if (idUsuario) {
      const [statusHoje, metaAtual] = await Promise.all([
        buscarStatusTabuadasHoje(idUsuario),
        buscarMetaTabuada({
          supabase,
          usuarioId: idUsuario,
        }),
      ]);

      const tabuadasMeta =
        metaAtual.tabuadas.length > 0
          ? metaAtual.tabuadas
          : [...META_TABUADA_PADRAO];

      setTabuadasMetaHoje(tabuadasMeta);
      setTabuadasMetaEdicao(tabuadasMeta);
      setMetaTabuadaConfigurada(metaAtual.configurada);

      const primeiraPendente = tabuadasMeta.find(
        (numero) => !statusHoje.concluidas.includes(numero)
      );

      setTabuadaSelecionada(primeiraPendente ?? tabuadasMeta[0] ?? 2);
    }
  }

  async function buscarQuestoesTabuada() {
    try {
      const { data, error } = await supabase
        .from("next_questoes")
        .select("id, enunciado, resposta_correta, nivel_dificuldade")
        .eq("materia_id", MATEMATICA_MATERIA_ID)
        .eq("assunto_id", TABUADA_ASSUNTO_ID)
        .eq("tipo_questao", "digitar")
        .eq("ativa", true);

      if (error) {
        console.error("Erro ao buscar questões da tabuada:", error);
        return;
      }

      setQuestoesBanco(data ?? []);
    } catch (error) {
      console.error("Erro inesperado ao buscar questões:", error);
    }
  }

  async function buscarStatusTabuadasHoje(idUsuario: string) {
    try {
      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);

      const fimHoje = new Date();
      fimHoje.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("next_sessoes_atividade")
        .select("detalhe_id, total_itens, acertos")
        .eq("usuario_id", idUsuario)
        .eq("atividade_id", MULTIPLICACAO_ATIVIDADE_ID)
        .eq("materia_id", MATEMATICA_MATERIA_ID)
        .eq("assunto_id", TABUADA_ASSUNTO_ID)
        .gte("data_execucao", formatarDataHoraLocal(inicioHoje))
        .lte("data_execucao", formatarDataHoraLocal(fimHoje))
        .not("detalhe_id", "is", null)
        .gte("total_itens", MULTIPLICADORES.length);

      if (error) {
        console.error("Erro ao buscar status das tabuadas de hoje:", error);

        return {
          tentadas: [] as number[],
          concluidas: [] as number[],
        };
      }

      const sessoesHoje = data ?? [];

      const tentadas = Array.from(
        new Set(
          sessoesHoje
            .map((item) =>
              item.detalhe_id
                ? TABUADA_POR_DETALHE_ID[item.detalhe_id]
                : null
            )
            .filter((numero): numero is number => typeof numero === "number")
        )
      );

      const concluidas = Array.from(
        new Set(
          sessoesHoje
            .filter((item) =>
              tabuadaAtingiuPercentualMinimo({
                acertos: item.acertos,
                totalItens: item.total_itens,
              })
            )
            .map((item) =>
              item.detalhe_id
                ? TABUADA_POR_DETALHE_ID[item.detalhe_id]
                : null
            )
            .filter((numero): numero is number => typeof numero === "number")
        )
      );

      setTabuadasTentadasHoje(tentadas);
      setTabuadasConcluidasHoje(concluidas);

      return {
        tentadas,
        concluidas,
      };
    } catch (error) {
      console.error("Erro inesperado ao buscar status das tabuadas de hoje:", error);

      return {
        tentadas: [] as number[],
        concluidas: [] as number[],
      };
    }
  }

  /* =========================================================
     Meta diária da Tabuada
  ========================================================= */

  function abrirModalMeta() {
    setTabuadasMetaEdicao([...tabuadasMetaHoje]);
    setMensagemMeta("");
    setModalMetaAberto(true);
  }

  function alternarTabuadaNaMeta(numero: number) {
    setTabuadasMetaEdicao((atuais) => {
      if (atuais.includes(numero)) {
        return atuais.filter((item) => item !== numero);
      }

      return [...atuais, numero].sort((a, b) => a - b);
    });
  }

  async function salvarMetaTabuada() {
    if (!usuarioId || salvandoMeta) return;

    if (tabuadasMetaEdicao.length === 0) {
      setMensagemMeta("Selecione pelo menos uma tabuada.");
      return;
    }

    try {
      setSalvandoMeta(true);
      setMensagemMeta("");

      const resultado = await alterarMetaTabuada({
        supabase,
        usuarioId,
        tabuadas: tabuadasMetaEdicao,
      });

      const novasTabuadas =
        resultado.tabuadasMeta.length > 0
          ? resultado.tabuadasMeta
          : [...tabuadasMetaEdicao].sort((a, b) => a - b);

      setTabuadasMetaHoje(novasTabuadas);
      setTabuadasMetaEdicao(novasTabuadas);
      setMetaTabuadaConfigurada(true);
      setTabuadasConcluidasHoje(resultado.tabuadasValidas);

      const statusAtualizado = await buscarStatusTabuadasHoje(usuarioId);

      const primeiraPendente = novasTabuadas.find(
        (numero) => !statusAtualizado.concluidas.includes(numero)
      );

      const tabuadaDestino = primeiraPendente ?? novasTabuadas[0] ?? 2;

      if (!novasTabuadas.includes(tabuadaSelecionada)) {
        trocarTabuada(tabuadaDestino);
      }

      setModalMetaAberto(false);
      setMensagemMeta("Meta atualizada.");

      window.setTimeout(() => {
        setMensagemMeta("");
      }, 2200);
    } catch (error) {
      console.error("Erro ao salvar meta da Tabuada:", error);
      setMensagemMeta("Não foi possível salvar a meta agora.");
    } finally {
      setSalvandoMeta(false);
    }
  }

  /* =========================================================
     Respostas e validação visual
  ========================================================= */

  function atualizarResposta(questao: QuestaoTela, valor: string) {
    const apenasNumeros = valor.replace(/\D/g, "");
    const chave = gerarChaveResposta(questao.tabuada, questao.multiplicador);

    setRespostas((respostasAtuais) => ({
      ...respostasAtuais,
      [chave]: apenasNumeros,
    }));

    setCamposValidados((camposAtuais) => ({
      ...camposAtuais,
      [chave]: false,
    }));
  }

  function validarCampo(questao: QuestaoTela) {
    const chave = gerarChaveResposta(questao.tabuada, questao.multiplicador);

    if (!respostas[chave]) return;

    setCamposValidados((camposAtuais) => ({
      ...camposAtuais,
      [chave]: true,
    }));
  }

  function verificarStatus(questao: QuestaoTela) {
    const chave = gerarChaveResposta(questao.tabuada, questao.multiplicador);
    const respostaUsuario = respostas[chave];
    const campoValidado = camposValidados[chave];

    if (!respostaUsuario || !campoValidado) return "vazio";

    return respostaUsuario === questao.resposta_correta ? "correto" : "errado";
  }

  function focarCampoPorIndice(indice: number) {
    const questao = questoesDaTabuadaSelecionada[indice];

    if (!questao) return;

    const chave = gerarChaveResposta(questao.tabuada, questao.multiplicador);

    setTimeout(() => {
      inputRefs.current[chave]?.focus();
    }, 50);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    questao: QuestaoTela,
    indice: number
  ) {
    if (event.key !== "Enter") return;

    event.preventDefault();

    validarCampo(questao);
    focarCampoPorIndice(indice + 1);
  }

  /* =========================================================
     Conclusão manual das rodadas

     Regra:
     - qualquer resposta preenchida é aceita, certa ou errada;
     - a primeira rodada é aquecimento e NÃO grava no banco;
     - a segunda rodada é a rodada valendo e grava normalmente.
  ========================================================= */

  function calcularResultadoRodadaAtual() {
    const totalItens = questoesDaTabuadaSelecionada.length;

    const acertos = questoesDaTabuadaSelecionada.filter((questao) => {
      const chave = gerarChaveResposta(
        questao.tabuada,
        questao.multiplicador
      );

      return respostas[chave] === questao.resposta_correta;
    }).length;

    const tempoTotalSegundos = Math.max(
      1,
      Math.round((Date.now() - inicioRodadaRef.current) / 1000)
    );

    return {
      acertos,
      totalItens,
      tempoTotalSegundos,
    };
  }

  async function concluirRodada() {
    if (modoRevisao) return;
    if (processandoRodada) return;
    if (!todasRespostasPreenchidas) return;

    setProcessandoRodada(true);

    const novosCamposValidados: CamposValidados = {};

    questoesDaTabuadaSelecionada.forEach((questao) => {
      const chave = gerarChaveResposta(
        questao.tabuada,
        questao.multiplicador
      );

      novosCamposValidados[chave] = true;
    });

    setCamposValidados((camposAtuais) => ({
      ...camposAtuais,
      ...novosCamposValidados,
    }));

    /*
     * PRIMEIRA RODADA
     * Apenas aquecimento. Mostra resultado e tempo,
     * mas não chama salvarSessaoAtividade.
     */
    if (rodada === "ordem") {
      const resultado = calcularResultadoRodadaAtual();

      setResultadoAquecimento({
        tabuada: tabuadaSelecionada,
        acertos: resultado.acertos,
        totalItens: resultado.totalItens,
        tempoTotalSegundos: resultado.tempoTotalSegundos,
      });

      setProcessandoRodada(false);
      return;
    }

    /*
     * SEGUNDA RODADA
     * Agora vale: grava a sessão e aplica as regras
     * já existentes da Esmeralda/Mandala.
     */
    const resultadoGravacao = await registrarRodadaEmbaralhadaNoBanco();

    if (resultadoGravacao.sucesso) {
      setTabuadasTentadasHoje((atuais) =>
        atuais.includes(tabuadaSelecionada)
          ? atuais
          : [...atuais, tabuadaSelecionada]
      );

      if (
        tabuadaAtingiuPercentualMinimo({
          acertos: resultadoGravacao.acertos,
          totalItens: resultadoGravacao.totalItens,
        })
      ) {
        setTabuadasConcluidasHoje((atuais) =>
          atuais.includes(tabuadaSelecionada)
            ? atuais
            : [...atuais, tabuadaSelecionada]
        );
      }

      setResultadoConclusao({
        tabuada: tabuadaSelecionada,
        acertos: resultadoGravacao.acertos,
        totalItens: resultadoGravacao.totalItens,
        tempoTotalSegundos: resultadoGravacao.tempoTotalSegundos,
      });

      setTimeout(() => {
        setResultadoConclusao(null);
        passarParaProximaTabuada();
        setProcessandoRodada(false);
      }, 2200);

      return;
    }

    setResultadoConclusao(null);
    setProcessandoRodada(false);
  }

  function iniciarRodadaValendo() {
    if (!resultadoAquecimento) return;

    setResultadoAquecimento(null);
    setRodada("embaralhada");
    setOrdemMultiplicadores(embaralharArray(MULTIPLICADORES));
    inicioRodadaRef.current = Date.now();
    setProcessandoRodada(false);
  }


  /* =========================================================
     Registro no banco
  ========================================================= */

  async function registrarRodadaEmbaralhadaNoBanco(): Promise<ResultadoGravacaoRodada> {
    const totalItens = questoesDaTabuadaSelecionada.length;

    const acertos = questoesDaTabuadaSelecionada.filter((questao) => {
      const chave = gerarChaveResposta(
        questao.tabuada,
        questao.multiplicador
      );

      return respostas[chave] === questao.resposta_correta;
    }).length;

    const tempoTotalSegundos = Math.max(
      1,
      Math.round((Date.now() - inicioRodadaRef.current) / 1000)
    );

    if (!usuarioId) {
      return {
        sucesso: false,
        acertos,
        totalItens,
        tempoTotalSegundos,
      };
    }

    if (tabuadasConcluidasHoje.includes(tabuadaSelecionada)) {
      return {
        sucesso: true,
        acertos,
        totalItens,
        tempoTotalSegundos,
      };
    }

    try {
      const detalheTabuadaId = DETALHES_TABUADA[tabuadaSelecionada];

      if (!detalheTabuadaId) {
        console.error("Detalhe da tabuada não encontrado:", tabuadaSelecionada);

        return {
          sucesso: false,
          acertos,
          totalItens,
          tempoTotalSegundos,
        };
      }

      const questoesSemId = questoesDaTabuadaSelecionada.filter(
        (questao) => !questao.id
      );

      if (questoesSemId.length > 0) {
        console.error("Existem questões sem ID no Supabase:", questoesSemId);

        return {
          sucesso: false,
          acertos,
          totalItens,
          tempoTotalSegundos,
        };
      }

      /*
       * Toda sessão da Tabuada deve passar pelo serviço central.
       * Assim a plataforma grava a sessão, atualiza a persistência,
       * verifica a Esmeralda e verifica a Mandala no mesmo fluxo.
       */
      const resultadoSessao = await salvarSessaoAtividade({
        atividade_id: MULTIPLICACAO_ATIVIDADE_ID,
        materia_id: MATEMATICA_MATERIA_ID,
        assunto_id: TABUADA_ASSUNTO_ID,
        detalhe_id: detalheTabuadaId,
        pontuacao: acertos,
        acertos,
        total_itens: totalItens,
        tempo_total_segundos: tempoTotalSegundos,
      });

      const sessaoId = resultadoSessao.data?.sessao.id;

      if (!sessaoId) {
        console.error(
          "A sessão da tabuada foi processada, mas o ID não foi retornado."
        );

        return {
          sucesso: false,
          acertos,
          totalItens,
          tempoTotalSegundos,
        };
      }

      const respostasParaInserir = questoesDaTabuadaSelecionada.map(
        (questao) => {
          const chave = gerarChaveResposta(
            questao.tabuada,
            questao.multiplicador
          );

          return {
            sessao_id: sessaoId,
            usuario_id: usuarioId,
            atividade_id: MULTIPLICACAO_ATIVIDADE_ID,
            materia_id: MATEMATICA_MATERIA_ID,
            questao_id: questao.id,
            resposta_usuario: respostas[chave],
            correta: respostas[chave] === questao.resposta_correta,
            fase: "embaralhada",
            tempo_resposta_segundos: tempoTotalSegundos,
          };
        }
      );

      const { error: respostasError } = await supabase
        .from("next_respostas_atividade")
        .insert(respostasParaInserir);

      if (respostasError) {
        console.error("Erro ao gravar respostas da tabuada:", respostasError);

        return {
          sucesso: false,
          acertos,
          totalItens,
          tempoTotalSegundos,
        };
      }

      return {
        sucesso: true,
        acertos,
        totalItens,
        tempoTotalSegundos,
      };
    } catch (error) {
      console.error("Erro inesperado ao gravar tabuada:", error);

      return {
        sucesso: false,
        acertos,
        totalItens,
        tempoTotalSegundos,
      };
    }
  }

  /* =========================================================
     Revisão
  ========================================================= */

  async function carregarRevisaoTabuada(numero: number) {
    if (!usuarioId) return;

    const detalheTabuadaId = DETALHES_TABUADA[numero];

    if (!detalheTabuadaId) {
      console.error("Detalhe da tabuada não encontrado:", numero);
      return;
    }

    try {
      setProcessandoRodada(true);

      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);

      const fimHoje = new Date();
      fimHoje.setHours(23, 59, 59, 999);

      const { data: sessoesData, error: sessoesError } = await supabase
        .from("next_sessoes_atividade")
        .select("id, acertos, total_itens, tempo_total_segundos, data_execucao")
        .eq("usuario_id", usuarioId)
        .eq("atividade_id", MULTIPLICACAO_ATIVIDADE_ID)
        .eq("materia_id", MATEMATICA_MATERIA_ID)
        .eq("assunto_id", TABUADA_ASSUNTO_ID)
        .eq("detalhe_id", detalheTabuadaId)
        .gte("data_execucao", formatarDataHoraLocal(inicioHoje))
        .lte("data_execucao", formatarDataHoraLocal(fimHoje))
        .order("data_execucao", { ascending: false })
        .limit(1);

      if (sessoesError) {
        console.error("Erro ao buscar sessão para revisão:", sessoesError);
        return;
      }

      const sessao = sessoesData?.[0];

      if (!sessao) {
        setModoRevisao(false);
        trocarTabuada(numero);
        return;
      }

      const { data: respostasData, error: respostasError } = await supabase
        .from("next_respostas_atividade")
        .select(
          `
          questao_id,
          resposta_usuario,
          correta,
          next_questoes!inner(id, enunciado, resposta_correta, nivel_dificuldade)
        `
        )
        .eq("sessao_id", sessao.id);

      if (respostasError) {
        console.error("Erro ao buscar respostas para revisão:", respostasError);
        return;
      }

      const respostasPorChave: Record<string, RespostaRevisao> = {};
      const multiplicadoresRevisao: number[] = [];

      (respostasData ?? []).forEach((item: any) => {
        const questao = item.next_questoes;
        const numeros = extrairNumerosDoEnunciado(questao?.enunciado ?? "");

        if (!questao || !numeros) return;

        const chave = gerarChaveResposta(
          numeros.tabuada,
          numeros.multiplicador,
          "embaralhada"
        );

        respostasPorChave[chave] = {
          questaoId: item.questao_id,
          enunciado: questao.enunciado,
          respostaCorreta: questao.resposta_correta,
          respostaUsuario: item.resposta_usuario,
          correta: Boolean(item.correta),
          multiplicador: numeros.multiplicador,
        };

        multiplicadoresRevisao.push(numeros.multiplicador);
      });

      setTabuadaSelecionada(numero);
      setRodada("embaralhada");
      setOrdemMultiplicadores(
        [...new Set(multiplicadoresRevisao)].sort((a, b) => a - b)
      );
      setModoRevisao(true);
      setRespostasRevisao(respostasPorChave);
      const atingiuMinimo =
        tabuadasConcluidasHoje.includes(numero) ||
        tabuadaAtingiuPercentualMinimo({
          acertos: sessao.acertos,
          totalItens: sessao.total_itens,
        });

      setResumoRevisao({
        tabuada: numero,
        acertos: sessao.acertos ?? 0,
        totalItens: sessao.total_itens ?? 0,
        tempoTotalSegundos: sessao.tempo_total_segundos ?? 0,
        dataExecucao: sessao.data_execucao,
        atingiuMinimo,
      });
    } catch (error) {
      console.error("Erro inesperado ao carregar revisão:", error);
    } finally {
      setProcessandoRodada(false);
    }
  }

  /* =========================================================
     Trocas de tabuada
  ========================================================= */

  function limparEstadoDaTabuada(tabuada: number) {
    setRespostas((respostasAtuais) => {
      const novasRespostas = { ...respostasAtuais };

      MULTIPLICADORES.forEach((multiplicador) => {
        delete novasRespostas[gerarChaveResposta(tabuada, multiplicador, "ordem")];
        delete novasRespostas[
          gerarChaveResposta(tabuada, multiplicador, "embaralhada")
        ];
      });

      return novasRespostas;
    });

    setCamposValidados((camposAtuais) => {
      const novosCampos = { ...camposAtuais };

      MULTIPLICADORES.forEach((multiplicador) => {
        delete novosCampos[gerarChaveResposta(tabuada, multiplicador, "ordem")];
        delete novosCampos[
          gerarChaveResposta(tabuada, multiplicador, "embaralhada")
        ];
      });

      return novosCampos;
    });
  }

  function selecionarTabuada(numero: number, tentadaHoje: boolean) {
    if (tentadaHoje) {
      carregarRevisaoTabuada(numero);
      return;
    }

    trocarTabuada(numero);
  }

  function tentarNovamenteTabuada(numero: number) {
    if (tabuadasConcluidasHoje.includes(numero)) {
      return;
    }

    trocarTabuada(numero);
  }

  function passarParaProximaTabuada() {
    setResultadoAquecimento(null);

    const indiceAtual = tabuadasMetaHoje.indexOf(tabuadaSelecionada);
    const proximaTabuada =
      indiceAtual >= 0 ? tabuadasMetaHoje[indiceAtual + 1] : tabuadasMetaHoje[0];

    setModoRevisao(false);
    setResumoRevisao(null);
    setRespostasRevisao({});
    setRodada("ordem");
    setOrdemMultiplicadores(MULTIPLICADORES);
    inicioRodadaRef.current = Date.now();

    if (proximaTabuada) {
      setTabuadaSelecionada(proximaTabuada);
      limparEstadoDaTabuada(proximaTabuada);
      return;
    }

    limparEstadoDaTabuada(tabuadaSelecionada);
  }

  function trocarTabuada(numero: number) {
    setResultadoAquecimento(null);
    setModoRevisao(false);
    setResumoRevisao(null);
    setRespostasRevisao({});
    setTabuadaSelecionada(numero);
    setRodada("ordem");
    setOrdemMultiplicadores(MULTIPLICADORES);
    limparEstadoDaTabuada(numero);
    inicioRodadaRef.current = Date.now();
  }

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

      {modalMetaAberto && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[340px] rounded-[28px] border border-white/10 bg-[#111111] px-5 py-5 shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f1e6a7]">
                  Minha meta de hoje
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-white">
                  Escolha as tabuadas
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setModalMetaAberto(false)}
                disabled={salvandoMeta}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base font-bold text-white/80 transition hover:bg-white/15 disabled:opacity-50"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-xs font-bold leading-relaxed text-white/50">
              Selecione somente as tabuadas que fazem parte da meta diária.
            </p>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {TABUADAS.map((numero) => {
                const marcada = tabuadasMetaEdicao.includes(numero);

                return (
                  <button
                    key={numero}
                    type="button"
                    onClick={() => alternarTabuadaNaMeta(numero)}
                    disabled={salvandoMeta}
                    className={[
                      "h-[48px] rounded-[12px] border text-sm font-extrabold transition active:scale-[0.97] disabled:opacity-50",
                      marcada
                        ? "border-[var(--color-4)]/70 bg-[rgba(93,198,161,0.20)] text-[var(--color-4)]"
                        : "border-white/15 bg-white/[0.04] text-white/65",
                    ].join(" ")}
                  >
                    {numero}x
                  </button>
                );
              })}
            </div>

            {mensagemMeta && (
              <p className="mt-3 text-center text-xs font-bold text-[var(--color-1)]">
                {mensagemMeta}
              </p>
            )}

            <button
              type="button"
              onClick={salvarMetaTabuada}
              disabled={salvandoMeta || tabuadasMetaEdicao.length === 0}
              className="mt-5 w-full rounded-full bg-[var(--color-4)] px-5 py-3 text-sm font-extrabold text-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvandoMeta ? "Salvando..." : "Salvar meta"}
            </button>
          </div>
        </div>
      )}

      {resultadoAquecimento && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[340px] rounded-[28px] border border-[var(--color-2)]/55 bg-[#111111] px-6 py-6 text-center shadow-[0_0_35px_rgba(233,137,29,0.24)]">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-2)]/60 bg-[rgba(233,137,29,0.16)] text-3xl">
              🔥
            </div>

            <h2 className="text-2xl font-extrabold text-white">
              Rodada de aquecimento concluída!
            </h2>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
              <p className="text-sm font-extrabold text-[var(--color-4)]">
                {formatarTextoAcertos(
                  resultadoAquecimento.acertos,
                  resultadoAquecimento.totalItens
                )}
              </p>

              <p className="mt-2 text-sm font-extrabold text-[var(--color-2)]">
                {formatarTempo(resultadoAquecimento.tempoTotalSegundos)}
              </p>
            </div>

            <p className="mt-4 text-sm font-bold leading-relaxed text-white/70">
              Essa foi a rodada de aquecimento. Agora sim é pra valer!
            </p>

            <button
              type="button"
              onClick={iniciarRodadaValendo}
              className="mt-5 w-full rounded-full bg-[var(--color-4)] px-5 py-3 text-sm font-extrabold text-black shadow-md transition active:scale-[0.98]"
            >
              Começar rodada valendo
            </button>
          </div>
        </div>
      )}

      {resultadoConclusao && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[340px] rounded-[28px] border border-[var(--color-4)]/50 bg-[#111111] px-6 py-6 text-center shadow-[0_0_35px_rgba(93,198,161,0.28)]">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-4)]/60 bg-[rgba(93,198,161,0.18)] text-3xl">
              🏆
            </div>

            <h2 className="text-2xl font-extrabold text-white">
              Tabuada do {resultadoConclusao.tabuada} concluída!
            </h2>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
              <p className="text-sm font-extrabold text-[var(--color-4)]">
                {formatarTextoAcertos(
                  resultadoConclusao.acertos,
                  resultadoConclusao.totalItens
                )}
              </p>

              <p className="mt-2 text-sm font-extrabold text-[var(--color-2)]">
                {formatarTempo(resultadoConclusao.tempoTotalSegundos)}
              </p>
            </div>

            <p className="mt-4 text-xs font-bold leading-relaxed text-white/45">
              Para revisar os resultados, clique no card da tabuada.
            </p>
          </div>
        </div>
      )}

      <div className="h-[48px]" />

      <main className="mx-auto flex w-full max-w-[360px] flex-col items-center px-2 pt-4 pb-10 sm:max-w-[460px]">
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-bold gradient-text">Multiplicação</h1>
        </header>

        <section className="mb-5 w-full rounded-[22px] border border-white/10 bg-[#101010] px-3 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f1e6a7]">
                Minha meta de hoje
              </p>
              <p className="mt-1 text-[11px] font-bold text-white/45">
                {tabuadasMetaHoje.filter((numero) =>
                  tabuadasConcluidasHoje.includes(numero)
                ).length} de {tabuadasMetaHoje.length} concluídas
              </p>
            </div>

            <button
              type="button"
              onClick={abrirModalMeta}
              disabled={!usuarioId || salvandoMeta}
              className="shrink-0 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[11px] font-extrabold text-white/75 transition hover:bg-white/[0.09] active:scale-[0.98] disabled:opacity-50"
            >
              {metaTabuadaConfigurada ? "Alterar meta" : "Definir meta"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {tabuadasMetaHoje.map((numero) => {
              const selecionada = numero === tabuadaSelecionada;
              const tentadaHoje = tabuadasTentadasHoje.includes(numero);
              const concluidaHoje = tabuadasConcluidasHoje.includes(numero);

              return (
                <button
                  key={numero}
                  type="button"
                  onClick={() => selecionarTabuada(numero, tentadaHoje)}
                  className={[
                    "relative flex h-[42px] min-w-[48px] items-center justify-center rounded-[11px] border px-3 text-sm font-extrabold transition-all duration-200",
                    concluidaHoje
                      ? "border-[var(--color-4)]/70 bg-[rgba(93,198,161,0.22)] text-[var(--color-4)] shadow-[0_0_14px_rgba(93,198,161,0.15)]"
                      : tentadaHoje
                        ? "border-[var(--color-1)]/70 bg-[rgba(201,74,74,0.20)] text-[#f58f8f] shadow-[0_0_14px_rgba(201,74,74,0.12)]"
                        : "border-white/15 bg-white/[0.04] text-white/75",
                    selecionada
                      ? "ring-2 ring-white/65 ring-offset-2 ring-offset-black"
                      : "",
                  ].join(" ")}
                >
                  {numero}x
                </button>
              );
            })}
          </div>

          {mensagemMeta && !modalMetaAberto && (
            <p className="mt-3 text-center text-[11px] font-bold text-white/55">
              {mensagemMeta}
            </p>
          )}
        </section>

        <section className="w-full rounded-[28px] border border-white/10 bg-[#111111] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-4">
          <div className="mb-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-center">
            <h2 className="text-xl font-extrabold">
              Tabuada do {tabuadaSelecionada}
            </h2>

            <p className="mt-1 text-xs font-bold text-white/45">
              {modoRevisao
                ? "Revisão dos resultados"
                : rodada === "ordem"
                  ? "Rodada de aquecimento: em ordem"
                  : "Rodada valendo: embaralhada"}
            </p>

            {modoRevisao && resumoRevisao && (
              <div className="mt-3 flex flex-col items-center justify-center gap-1 text-[11px] font-extrabold text-white/55">
                <span className="rounded-full border border-[var(--color-4)]/35 bg-[rgba(93,198,161,0.12)] px-3 py-1 text-[var(--color-4)]">
                  {formatarTextoAcertos(
                    resumoRevisao.acertos,
                    resumoRevisao.totalItens
                  )}
                </span>

                <span className="rounded-full border border-[var(--color-2)]/35 bg-[rgba(233,137,29,0.12)] px-3 py-1 text-[var(--color-2)]">
                  {formatarTempo(resumoRevisao.tempoTotalSegundos)}
                </span>

                {!resumoRevisao.atingiuMinimo && (
                  <div className="mt-3 w-full rounded-2xl border border-[var(--color-2)]/45 bg-[rgba(233,137,29,0.10)] px-3 py-3">
                    <p className="text-xs font-extrabold leading-relaxed text-[var(--color-2)]">
                      Você precisa de pelo menos 6 acertos em 9 para concluir esta tabuada.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        tentarNovamenteTabuada(resumoRevisao.tabuada)
                      }
                      disabled={processandoRodada}
                      className="mt-3 w-full rounded-full bg-[var(--color-4)] px-4 py-2.5 text-xs font-extrabold text-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {questoesDaTabuadaSelecionada.map((questao, indice) => {
              const chave = gerarChaveResposta(
                questao.tabuada,
                questao.multiplicador
              );

              const status = verificarStatus(questao);

              return (
                <div
                  key={chave}
                  className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-xl font-extrabold text-white">
                      {questao.tabuada} × {questao.multiplicador}
                    </span>

                    <span className="text-base font-bold text-white/45">=</span>

                    {modoRevisao ? (
                      (() => {
                        const respostaRevisao = respostasRevisao[chave];

                        return (
                          <div className="flex min-w-[118px] items-center justify-start gap-2">
                            <div
                              className={[
                                "flex h-[42px] min-w-[58px] items-center justify-center rounded-xl border bg-black px-3 text-center text-xl font-extrabold text-white",
                                respostaRevisao?.correta
                                  ? "border-[var(--color-4)] bg-[rgba(93,198,161,0.20)] shadow-[0_0_12px_rgba(93,198,161,0.28)]"
                                  : "border-[var(--color-1)] bg-[rgba(201,74,74,0.18)] shadow-[0_0_12px_rgba(201,74,74,0.24)]",
                              ].join(" ")}
                            >
                              {respostaRevisao?.respostaUsuario ?? "-"}
                            </div>

                            <div className="flex min-w-[44px] flex-col items-start">
                              <span
                                className={[
                                  "text-base font-extrabold",
                                  respostaRevisao?.correta
                                    ? "text-[var(--color-4)]"
                                    : "text-[var(--color-1)]",
                                ].join(" ")}
                              >
                                {respostaRevisao?.correta ? "✓" : "✕"}
                              </span>

                              {!respostaRevisao?.correta && (
                                <span className="text-[10px] font-bold text-white/45">
                                  Correto: {questao.resposta_correta}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <input
                        ref={(element) => {
                          inputRefs.current[chave] = element;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        value={respostas[chave] ?? ""}
                        onChange={(event) =>
                          atualizarResposta(questao, event.target.value)
                        }
                        onBlur={() => validarCampo(questao)}
                        onKeyDown={(event) =>
                          handleKeyDown(event, questao, indice)
                        }
                        className={[
                          "h-[42px] w-[58px] rounded-xl border bg-black text-center text-xl font-extrabold text-white outline-none transition-all",
                          status === "vazio"
                            ? "border-white/20 focus:border-[var(--color-2)] focus:ring-2 focus:ring-[var(--color-2)]/40"
                            : "",
                          status === "correto"
                            ? "border-[var(--color-4)] bg-[rgba(93,198,161,0.20)] text-white shadow-[0_0_12px_rgba(93,198,161,0.28)]"
                            : "",
                          status === "errado"
                            ? "border-[var(--color-1)] bg-[rgba(201,74,74,0.18)] text-white shadow-[0_0_12px_rgba(201,74,74,0.24)]"
                            : "",
                        ].join(" ")}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!modoRevisao && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => void concluirRodada()}
                disabled={!todasRespostasPreenchidas || processandoRodada}
                className="w-full rounded-full bg-[var(--color-4)] px-5 py-3 text-sm font-extrabold text-black shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {processandoRodada
                  ? "Processando..."
                  : rodada === "ordem"
                    ? "Concluir rodada"
                    : "Concluir tabuada"}
              </button>

              {!todasRespostasPreenchidas && (
                <p className="mt-2 text-center text-[11px] font-bold text-white/35">
                  Preencha as 9 respostas para concluir.
                </p>
              )}
            </div>
          )}
        </section>

        <div className="mt-8 flex justify-center">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}
