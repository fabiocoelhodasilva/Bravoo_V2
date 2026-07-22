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
};

/* =========================================================
   Componente principal
========================================================= */

export default function MultiplicacaoPageView() {
  const router = useRouter();

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const rodadaProcessadaRef = useRef("");
  const inicioRodadaRef = useRef<number>(Date.now());

  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [tabuadaSelecionada, setTabuadaSelecionada] = useState(2);
  const [rodada, setRodada] = useState<Rodada>("ordem");
  const [ordemMultiplicadores, setOrdemMultiplicadores] =
    useState<number[]>(MULTIPLICADORES);

  const [questoesBanco, setQuestoesBanco] = useState<QuestaoBanco[]>([]);
  const [respostas, setRespostas] = useState<RespostasUsuario>({});
  const [camposValidados, setCamposValidados] = useState<CamposValidados>({});
  const [tabuadasFeitasHoje, setTabuadasFeitasHoje] = useState<number[]>([]);
  const [processandoRodada, setProcessandoRodada] = useState(false);
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
      await buscarTabuadasFeitasHoje(idUsuario);
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

  async function buscarTabuadasFeitasHoje(idUsuario: string) {
    try {
      const inicioHoje = new Date();
      inicioHoje.setHours(0, 0, 0, 0);

      const fimHoje = new Date();
      fimHoje.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("next_sessoes_atividade")
        .select("detalhe_id, total_itens")
        .eq("usuario_id", idUsuario)
        .eq("atividade_id", MULTIPLICACAO_ATIVIDADE_ID)
        .eq("materia_id", MATEMATICA_MATERIA_ID)
        .eq("assunto_id", TABUADA_ASSUNTO_ID)
        .gte("data_execucao", formatarDataHoraLocal(inicioHoje))
        .lte("data_execucao", formatarDataHoraLocal(fimHoje))
        .not("detalhe_id", "is", null)
        .gte("total_itens", MULTIPLICADORES.length);

      if (error) {
        console.error("Erro ao buscar tabuadas feitas hoje:", error);
        return;
      }

      const feitas = Array.from(
        new Set(
          (data ?? [])
            .map((item) =>
              item.detalhe_id
                ? TABUADA_POR_DETALHE_ID[item.detalhe_id]
                : null
            )
            .filter((numero): numero is number => typeof numero === "number")
        )
      );

      setTabuadasFeitasHoje(feitas);
    } catch (error) {
      console.error("Erro inesperado ao buscar tabuadas feitas hoje:", error);
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
     Correção principal:
     só finaliza quando cada campo tem a quantidade
     mínima de dígitos da resposta correta.
  ========================================================= */

  function verificarPreenchimentoAutomatico() {
    if (modoRevisao) return;
    if (processandoRodada) return;

    const chaveRodadaAtual = `${tabuadaSelecionada}-${rodada}`;

    if (rodadaProcessadaRef.current === chaveRodadaAtual) return;

    const todasRespondidas = questoesDaTabuadaSelecionada.every((questao) => {
      const chave = gerarChaveResposta(questao.tabuada, questao.multiplicador);
      const respostaUsuario = respostas[chave] ?? "";
      const respostaCorreta = questao.resposta_correta ?? "";

      return respostaUsuario.length >= respostaCorreta.length;
    });

    if (!todasRespondidas) return;

    rodadaProcessadaRef.current = chaveRodadaAtual;

    setTimeout(() => {
      finalizarRodadaAutomaticamente();
    }, 700);
  }


  /* =========================================================
     Verificação automática da rodada
  ========================================================= */

  useEffect(() => {
    verificarPreenchimentoAutomatico();
  }, [respostas, questoesDaTabuadaSelecionada, rodada, modoRevisao]);

  async function finalizarRodadaAutomaticamente() {
    setProcessandoRodada(true);

    const novosCamposValidados: CamposValidados = {};

    questoesDaTabuadaSelecionada.forEach((questao) => {
      const chave = gerarChaveResposta(questao.tabuada, questao.multiplicador);
      novosCamposValidados[chave] = true;
    });

    setCamposValidados((camposAtuais) => ({
      ...camposAtuais,
      ...novosCamposValidados,
    }));

    if (rodada === "ordem") {
      setTimeout(() => {
        setRodada("embaralhada");
        setOrdemMultiplicadores(embaralharArray(MULTIPLICADORES));
        inicioRodadaRef.current = Date.now();
        rodadaProcessadaRef.current = "";
        setProcessandoRodada(false);
      }, 700);

      return;
    }

    const resultadoGravacao = await registrarRodadaEmbaralhadaNoBanco();

    if (resultadoGravacao.sucesso) {
      setTabuadasFeitasHoje((atuais) =>
        atuais.includes(tabuadaSelecionada)
          ? atuais
          : [...atuais, tabuadaSelecionada]
      );

      setResultadoConclusao({
        tabuada: tabuadaSelecionada,
        acertos: resultadoGravacao.acertos,
        totalItens: resultadoGravacao.totalItens,
        tempoTotalSegundos: resultadoGravacao.tempoTotalSegundos,
      });

      setTimeout(() => {
        setResultadoConclusao(null);
        passarParaProximaTabuada();
        rodadaProcessadaRef.current = "";
        setProcessandoRodada(false);
      }, 2200);

      return;
    }

    setResultadoConclusao(null);
    rodadaProcessadaRef.current = "";
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

    if (tabuadasFeitasHoje.includes(tabuadaSelecionada)) {
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
      setResumoRevisao({
        tabuada: numero,
        acertos: sessao.acertos ?? 0,
        totalItens: sessao.total_itens ?? 0,
        tempoTotalSegundos: sessao.tempo_total_segundos ?? 0,
        dataExecucao: sessao.data_execucao,
      });
      rodadaProcessadaRef.current = "";
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

  function selecionarTabuada(numero: number, feitaHoje: boolean) {
    if (feitaHoje) {
      carregarRevisaoTabuada(numero);
      return;
    }

    trocarTabuada(numero);
  }

  function passarParaProximaTabuada() {
    const indiceAtual = TABUADAS.indexOf(tabuadaSelecionada);
    const proximaTabuada = TABUADAS[indiceAtual + 1];

    setModoRevisao(false);
    setResumoRevisao(null);
    setRespostasRevisao({});
    setRodada("ordem");
    setOrdemMultiplicadores(MULTIPLICADORES);
    inicioRodadaRef.current = Date.now();

    if (proximaTabuada) {
      setTabuadaSelecionada(proximaTabuada);
      limparEstadoDaTabuada(proximaTabuada);
    }
  }

  function trocarTabuada(numero: number) {
    setModoRevisao(false);
    setResumoRevisao(null);
    setRespostasRevisao({});
    setTabuadaSelecionada(numero);
    setRodada("ordem");
    setOrdemMultiplicadores(MULTIPLICADORES);
    limparEstadoDaTabuada(numero);
    inicioRodadaRef.current = Date.now();
    rodadaProcessadaRef.current = "";
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

        <div className="mb-5 flex w-full justify-center gap-1.5">
          {TABUADAS.map((numero) => {
            const selecionada = numero === tabuadaSelecionada;
            const feitaHoje = tabuadasFeitasHoje.includes(numero);

            return (
              <button
                key={numero}
                type="button"
                onClick={() => selecionarTabuada(numero, feitaHoje)}
                className={[
                  "relative flex h-[40px] flex-1 items-center justify-center rounded-[10px] border text-xs font-extrabold transition-all duration-200",
                  "before:absolute before:inset-[3px] before:rounded-[7px] before:border before:border-white/15 before:content-['']",
                  feitaHoje
                    ? "border-[var(--color-4)]/70 bg-[rgba(93,198,161,0.28)] text-white shadow-[0_0_14px_rgba(93,198,161,0.18)]"
                    : "border-[var(--color-1)]/55 bg-[rgba(201,74,74,0.22)] text-white/80 shadow-[0_0_14px_rgba(201,74,74,0.10)]",
                  selecionada
                    ? "ring-2 ring-[var(--color-2)] ring-offset-2 ring-offset-black shadow-[0_0_16px_rgba(233,137,29,0.45)]"
                    : "",
                ].join(" ")}
              >
                <span className="relative z-10">{numero}x</span>
              </button>
            );
          })}
        </div>

        <section className="w-full rounded-[28px] border border-white/10 bg-[#111111] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-4">
          <div className="mb-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-center">
            <h2 className="text-xl font-extrabold">
              Tabuada do {tabuadaSelecionada}
            </h2>

            <p className="mt-1 text-xs font-bold text-white/45">
              {modoRevisao
                ? "Revisão dos resultados"
                : rodada === "ordem"
                  ? "Primeira rodada: em ordem"
                  : "Segunda rodada: embaralhada"}
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
        </section>

        <div className="mt-8 flex justify-center">
          <BotaoVoltar />
        </div>
      </main>
    </div>
  );
}