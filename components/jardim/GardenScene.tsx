"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

import {
  getEstadoJardimUsuario,
  lerEstadoJardim,
  invalidarEstadoJardim,
  observarInvalidacaoJardim,
  tempoAteViradaJardim,
} from "@/lib/gamificacao/jardim/jardim-estado-client";

import JardinsMapaPanel from "./JardinsMapaPanel";
import BottomNavJardim from "./BottomNavJardim";
import OracaoDashboardPanel from "./OracaoDashboardPanel";
import ProgressoJardimPanel from "./ProgressoJardimPanel";

import {
  criarCarregadorJardim,
  type ResumoOracao,
} from "@/lib/gamificacao/jardim/jardim-dados-client";

import {
  getImagensJardim,
  getNomeJardim,
  preloadImagem,
} from "@/lib/gamificacao/jardim/jardim-assets";

import {
  getEstadoJornadaJardim,
} from "@/lib/gamificacao/jardim/jardins-config";

type Vista = "mapa" | "jardim" | "oracao" | "progresso";

const RESUMO_PADRAO = {
  minutosHoje: 0,
  minutosAno: 0,
  metaDiaria: 5,
  persistenciaDias: 0,
};

export default function GardenScene() {
  const router = useRouter();

  const { contaId, perfilAtivoId } = useAuth();

  // Uma única área, sem novas rotas nem entradas adicionais no histórico.
  const [vista, setVista] = useState<Vista>("mapa");

  const [carregador] = useState(criarCarregadorJardim);

  const [resumoOracao, setResumoOracao] =
    useState<ResumoOracao | null>(null);

  const [pontuacaoJardim, setPontuacaoJardim] =
    useState<number | null>(() =>
      contaId && perfilAtivoId
        ? lerEstadoJardim({
            contaId,
            perfilId: perfilAtivoId,
          })?.pontuacao ?? null
        : null,
    );

  const [usuarioJardimId, setUsuarioJardimId] =
    useState<string | null>(null);

  const [carregandoResumo, setCarregandoResumo] =
    useState(true);

  const [carregandoPontuacao, setCarregandoPontuacao] =
    useState(true);

  const [erroResumo, setErroResumo] = useState(false);
  const [erroPontuacao, setErroPontuacao] = useState(false);

  const [revisaoProgresso, setRevisaoProgresso] =
    useState(0);

  const geracao = useRef(0);

  /* =========================================================
     RESUMO
     ========================================================= */

  // Pontuação e resumo publicam seus resultados
  // independentemente do Progresso.
  const carregarResumo = useCallback(async () => {
    const versao = geracao.current;

    setCarregandoResumo(true);

    try {
      const resumo = await carregador.resumo();

      if (versao !== geracao.current) return;

      setResumoOracao(resumo);
      setErroResumo(false);
    } catch (error) {
      if (versao === geracao.current) {
        setErroResumo(true);
      }

      console.error(
        "Erro ao carregar resumo do jardim:",
        error,
      );
    } finally {
      if (versao === geracao.current) {
        setCarregandoResumo(false);
      }
    }
  }, [carregador]);

  /* =========================================================
     PONTUAÇÃO DO JARDIM
     ========================================================= */

  const carregarPontuacao = useCallback(
    async (silencioso = false) => {
      if (!contaId || !perfilAtivoId) return;

      const versao = geracao.current;

      setCarregandoPontuacao(true);

      try {
        const resultado = await getEstadoJardimUsuario({
          contaId,
          perfilId: perfilAtivoId,
        });

        if (versao !== geracao.current) return;

        setPontuacaoJardim(resultado.pontuacao);
        setErroPontuacao(false);
      } catch (error) {
        if (
          versao === geracao.current &&
          !silencioso
        ) {
          setErroPontuacao(true);
        }

        console.error(
          "Erro ao carregar pontuação do jardim:",
          error,
        );
      } finally {
        if (versao === geracao.current) {
          setCarregandoPontuacao(false);
        }
      }
    },
    [contaId, perfilAtivoId],
  );

  /* =========================================================
     CARREGAMENTO INICIAL
     ========================================================= */

  useEffect(() => {
    let ativo = true;

    void carregador
      .usuario()
      .then((id) => {
        if (ativo) {
          setUsuarioJardimId(id);
        }
      })
      .catch((error) =>
        console.error(
          "Erro ao identificar usuário do jardim:",
          error,
        ),
      );

    void carregarPontuacao();
    void carregarResumo();
    void carregador.preloadProgresso();

    return () => {
      ativo = false;
    };
  }, [
    carregador,
    carregarPontuacao,
    carregarResumo,
  ]);

  /* =========================================================
     INVALIDAÇÃO / VIRADA DO DIA
     ========================================================= */

  useEffect(() => {
    let ativo = true;
    let timer: number;

    const atualizar = () => {
      // Agrupa os eventos síncronos de oração/joia
      // antes de reutilizar a consulta.
      void Promise.resolve().then(() => {
        if (
          ativo &&
          document.visibilityState === "visible"
        ) {
          void carregarPontuacao(true);
        }
      });
    };

    const agendarVirada = () => {
      timer = window.setTimeout(() => {
        atualizar();
        agendarVirada();
      }, tempoAteViradaJardim());
    };

    agendarVirada();

    const pararObservacao =
      observarInvalidacaoJardim(atualizar);

    document.addEventListener(
      "visibilitychange",
      atualizar,
    );

    return () => {
      ativo = false;

      window.clearTimeout(timer);

      pararObservacao();

      document.removeEventListener(
        "visibilitychange",
        atualizar,
      );
    };
  }, [carregarPontuacao]);

  /* =========================================================
     JARDIM ATUAL
     ========================================================= */

  /**
   * Descobre em qual jardim o usuário está
   * e qual é seu progresso dentro dele.
   *
   * Exemplos:
   *
   * 11 pontos:
   * Jardim do Deserto
   * 11/11
   *
   * 12 pontos:
   * Jardim das Flores
   * 1/8
   *
   * 20 pontos:
   * Jardim das Flores
   * 9/8
   */
  const estadoJornada = useMemo(
    () =>
      getEstadoJornadaJardim(
        pontuacaoJardim ?? 0,
      ),
    [pontuacaoJardim],
  );

  /**
   * Seleciona as imagens do jardim atual.
   *
   * O catálogo de assets limita SOMENTE
   * a etapa visual disponível.
   *
   * Portanto, Flores 9/8 continua usando
   * a última imagem do Jardim das Flores.
   */
  const imagensJardim = useMemo(
    () =>
      getImagensJardim(
        estadoJornada.jardimAtual,
        estadoJornada.progressoNoJardim,
      ),
    [
      estadoJornada.jardimAtual,
      estadoJornada.progressoNoJardim,
    ],
  );

  const nomeJardimAtual = useMemo(
    () =>
      getNomeJardim(
        estadoJornada.jardimAtual,
      ),
    [estadoJornada.jardimAtual],
  );

  /* =========================================================
     PRELOAD DA IMAGEM DO JARDIM
     ========================================================= */

  useEffect(() => {
    if (pontuacaoJardim === null) return;

    // Carrega só a versão usada pelo dispositivo
    // e acompanha mudanças de largura.
    const media = window.matchMedia(
      "(max-width: 767px)",
    );

    const preload = () => {
      preloadImagem(
        media.matches
          ? imagensJardim.mobile
          : imagensJardim.desktop,
      );
    };

    preload();

    media.addEventListener(
      "change",
      preload,
    );

    return () => {
      media.removeEventListener(
        "change",
        preload,
      );
    };
  }, [
    imagensJardim,
    pontuacaoJardim,
  ]);

  /* =========================================================
     NAVEGAÇÃO INTERNA
     ========================================================= */

  function abrirVista(proxima: Vista) {
    setVista(proxima);

    if (erroResumo) {
      void carregarResumo();
    }

    if (erroPontuacao) {
      void carregarPontuacao();
    }

    if (proxima === "mapa") {
      void carregador.preloadProgresso();
    }
  }

  /* =========================================================
     ATUALIZAÇÃO APÓS ORAÇÃO
     ========================================================= */

  // Uma única atualização após gravações,
  // compartilhada com oração e progresso.
  async function atualizarAposOracaoRegistrada() {
    geracao.current += 1;

    carregador.invalidar();
    invalidarEstadoJardim();

    // O painel emite também o evento de joia
    // nesta mesma chamada síncrona.
    //
    // Inicia a leitura depois dele, para não
    // invalidar o pedido recém-iniciado.
    await Promise.resolve();

    setRevisaoProgresso(
      (valor) => valor + 1,
    );

    void carregador.preloadProgresso();

    await Promise.all([
      carregarResumo(),
      carregarPontuacao(),
    ]);
  }

  /* =========================================================
     RESUMO DA ORAÇÃO
     ========================================================= */

  const resumo =
    resumoOracao ?? RESUMO_PADRAO;

  const oracaoConcluidaHoje =
    resumo.minutosHoje >=
    Math.max(1, resumo.metaDiaria);

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
      {/* =====================================================
          MAPA DOS JARDINS
          ===================================================== */}

      {vista === "mapa" ? (
        <JardinsMapaPanel
          pontuacao={pontuacaoJardim}
          usuarioId={usuarioJardimId}
          carregando={
            carregandoPontuacao &&
            pontuacaoJardim === null
          }
          erro={erroPontuacao}
          onTentarNovamente={() =>
            void carregarPontuacao()
          }
          onClose={() => router.back()}
          onEntrarJardim={() =>
            abrirVista("jardim")
          }
        />
      ) : (
        <>
          {/* =================================================
              CENÁRIO DO JARDIM ATUAL
              ================================================= */}

          {pontuacaoJardim !== null ? (
            <picture className="absolute inset-x-0 top-0 bottom-[102px] block w-full md:bottom-0">
              <source
                media="(max-width: 767px)"
                srcSet={imagensJardim.mobile}
              />

              <img
                src={imagensJardim.desktop}
                alt={nomeJardimAtual}
                className="h-full w-full select-none object-cover object-center"
                draggable={false}
              />
            </picture>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              role="status"
            >
              {erroPontuacao ? (
                <button
                  type="button"
                  onClick={() =>
                    void carregarPontuacao()
                  }
                >
                  Tentar carregar o jardim
                  novamente
                </button>
              ) : (
                "Carregando seu jardim..."
              )}
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-[125px] bg-gradient-to-b from-black/28 via-black/8 to-transparent" />
        </>
      )}

      {/* =====================================================
          NAVEGAÇÃO INFERIOR
          ===================================================== */}

      {vista !== "mapa" && (
        <BottomNavJardim
          ativo={
            vista === "progresso"
              ? "progresso"
              : "oracao"
          }
          oracaoConcluidaHoje={
            oracaoConcluidaHoje
          }
          onVoltar={() => router.back()}
          onOracao={() =>
            abrirVista("oracao")
          }
          onJardins={() =>
            abrirVista("mapa")
          }
          onProgresso={() =>
            abrirVista("progresso")
          }
        />
      )}

      {/* =====================================================
          PAINEL DE ORAÇÃO
          ===================================================== */}

      {vista === "oracao" && (
        <OracaoDashboardPanel
          onClose={() =>
            setVista("jardim")
          }
          dadosIniciais={resumoOracao}
          dadosIniciaisCarregando={
            carregandoResumo
          }
          erroCarregamento={
            erroResumo
          }
          onTentarNovamente={() =>
            void carregarResumo()
          }
          onOracaoRegistrada={
            atualizarAposOracaoRegistrada
          }
        />
      )}

      {/* =====================================================
          PAINEL DE PROGRESSO
          ===================================================== */}

      {vista === "progresso" && (
        <ProgressoJardimPanel
          onClose={() =>
            setVista("jardim")
          }
          dados={resumo}
          totalJoias={
            resumoOracao
              ?.totalJoiasEspiritual ?? 0
          }
          carregando={
            carregandoResumo
          }
          carregador={carregador}
          revisao={revisaoProgresso}
          erroResumo={erroResumo}
          onTentarResumo={() =>
            void carregarResumo()
          }
        />
      )}
    </section>
  );
}