"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import JardinsMapaPanel from "./JardinsMapaPanel";
import BottomNavJardim from "./BottomNavJardim";
import OracaoDashboardPanel from "./OracaoDashboardPanel";
import ProgressoJardimPanel from "./ProgressoJardimPanel";
import { criarCarregadorJardim, type ResumoOracao } from "@/lib/gamificacao/jardim/jardim-dados-client";
import { getImagensJardim, preloadImagem } from "@/lib/gamificacao/jardim/jardim-assets";

type Vista = "mapa" | "jardim" | "oracao" | "progresso";
const RESUMO_PADRAO = { minutosHoje: 0, minutosAno: 0, metaDiaria: 5, persistenciaDias: 0 };

export default function GardenScene() {
  const router = useRouter();
  // Uma única área, sem novas rotas nem entradas adicionais no histórico.
  const [vista, setVista] = useState<Vista>("mapa");
  const [carregador] = useState(criarCarregadorJardim);
  const [resumoOracao, setResumoOracao] = useState<ResumoOracao | null>(null);
  const [pontuacaoJardim, setPontuacaoJardim] = useState<number | null>(null);
  const [usuarioJardimId, setUsuarioJardimId] = useState<string | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [carregandoPontuacao, setCarregandoPontuacao] = useState(true);
  const [erroResumo, setErroResumo] = useState(false);
  const [erroPontuacao, setErroPontuacao] = useState(false);
  const [revisaoProgresso, setRevisaoProgresso] = useState(0);
  const geracao = useRef(0);

  // Pontuação e resumo publicam seus resultados independentemente do Progresso.
  const carregarResumo = useCallback(async () => {
    const versao = geracao.current;
    setCarregandoResumo(true);
    try {
      const resumo = await carregador.resumo();
      if (versao !== geracao.current) return;
      setResumoOracao(resumo);
      setErroResumo(false);
    } catch (error) {
      if (versao === geracao.current) setErroResumo(true);
      console.error("Erro ao carregar resumo do jardim:", error);
    } finally {
      if (versao === geracao.current) setCarregandoResumo(false);
    }
  }, [carregador]);

  const carregarPontuacao = useCallback(async () => {
    const versao = geracao.current;
    setCarregandoPontuacao(true);
    try {
      const resultado = await carregador.pontuacao();
      if (versao !== geracao.current) return;
      setPontuacaoJardim(resultado.pontuacao);
      setErroPontuacao(false);
    } catch (error) {
      if (versao === geracao.current) setErroPontuacao(true);
      console.error("Erro ao carregar pontuação do jardim:", error);
    } finally {
      if (versao === geracao.current) setCarregandoPontuacao(false);
    }
  }, [carregador]);

  useEffect(() => {
    let ativo = true;
    void carregador.usuario().then((id) => {
      if (ativo) setUsuarioJardimId(id);
    }).catch((error) => console.error("Erro ao identificar usuário do jardim:", error));
    void carregarPontuacao();
    void carregarResumo();
    void carregador.preloadProgresso();
    return () => { ativo = false; };
  }, [carregador, carregarPontuacao, carregarResumo]);

  // O catálogo continua responsável pela seleção e pelo limite visual do cenário.
  const imagensJardim = useMemo(
    () => getImagensJardim("deserto", pontuacaoJardim ?? 0),
    [pontuacaoJardim],
  );

  useEffect(() => {
    if (pontuacaoJardim === null) return;
    // Carrega só a versão usada pelo dispositivo e acompanha mudanças de largura.
    const media = window.matchMedia("(max-width: 767px)");
    const preload = () => {
      preloadImagem(media.matches ? imagensJardim.mobile : imagensJardim.desktop);
    };
    preload();
    media.addEventListener("change", preload);
    return () => media.removeEventListener("change", preload);
  }, [imagensJardim, pontuacaoJardim]);

  function abrirVista(proxima: Vista) {
    setVista(proxima);
    if (erroResumo) void carregarResumo();
    if (erroPontuacao) void carregarPontuacao();
    if (proxima === "mapa") void carregador.preloadProgresso();
  }

  // Uma única atualização após gravações, compartilhada com oração e progresso.
  async function atualizarAposOracaoRegistrada() {
    geracao.current += 1;
    carregador.invalidar();
    setRevisaoProgresso((valor) => valor + 1);
    void carregador.preloadProgresso();
    await Promise.all([carregarResumo(), carregarPontuacao()]);
  }

  const resumo = resumoOracao ?? RESUMO_PADRAO;
  const oracaoConcluidaHoje = resumo.minutosHoje >= Math.max(1, resumo.metaDiaria);

  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
      {/* O mapa aparece imediatamente, sem aguardar as consultas secundárias. */}
      {vista === "mapa" ? (
        <JardinsMapaPanel
          pontuacao={pontuacaoJardim}
          usuarioId={usuarioJardimId}
          carregando={carregandoPontuacao && pontuacaoJardim === null}
          erro={erroPontuacao}
          onTentarNovamente={() => void carregarPontuacao()}
          onClose={() => router.back()}
          onEntrarJardim={() => abrirVista("jardim")}
        />
      ) : (
        <>
          {/* CENÁRIO RESPONSIVO: preserva as imagens e o enquadramento atuais. */}
          {pontuacaoJardim !== null ? (
            <picture className="absolute inset-x-0 top-0 bottom-[102px] block w-full md:bottom-0">
              <source media="(max-width: 767px)" srcSet={imagensJardim.mobile} />
              <img src={imagensJardim.desktop} alt="Jardim do Deserto"
                className="h-full w-full select-none object-cover object-center" draggable={false} />
            </picture>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" role="status">
              {erroPontuacao ? (
                <button type="button" onClick={() => void carregarPontuacao()}>Tentar carregar o jardim novamente</button>
              ) : "Carregando seu jardim..."}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[125px] bg-gradient-to-b from-black/28 via-black/8 to-transparent" />
        </>
      )}

      {/* No mapa a navegação inferior some: o mapa vira a tela principal da jornada. */}
      {vista !== "mapa" && (
        <BottomNavJardim
          ativo={vista === "progresso" ? "progresso" : "oracao"}
          oracaoConcluidaHoje={oracaoConcluidaHoje}
          onVoltar={() => router.back()}
          onOracao={() => abrirVista("oracao")}
          onJardins={() => abrirVista("mapa")}
          onProgresso={() => abrirVista("progresso")}
        />
      )}

      {vista === "oracao" && (
        <OracaoDashboardPanel
          onClose={() => setVista("jardim")}
          dadosIniciais={resumoOracao}
          dadosIniciaisCarregando={carregandoResumo}
          erroCarregamento={erroResumo}
          onTentarNovamente={() => void carregarResumo()}
          onOracaoRegistrada={atualizarAposOracaoRegistrada}
        />
      )}
      {vista === "progresso" && (
        <ProgressoJardimPanel
          onClose={() => setVista("jardim")}
          dados={resumo}
          totalJoias={resumoOracao?.totalJoiasEspiritual ?? 0}
          carregando={carregandoResumo}
          carregador={carregador}
          revisao={revisaoProgresso}
          erroResumo={erroResumo}
          onTentarResumo={() => void carregarResumo()}
        />
      )}
    </section>
  );
}
