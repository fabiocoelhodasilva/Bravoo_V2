/**
 * Catálogo central das imagens dos jardins.
 *
 * Os arquivos ficam dentro de /public, por isso os caminhos usados
 * no app começam em /imagens/...
 */

export type JardimId = "deserto";

export type ImagensResponsivasJardim = {
  mobile: string;
  desktop: string;
};

type ConfiguracaoJardim = {
  nome: string;
  pasta: string;
  etapaVisualMaxima: number;
  nomeArquivoMobile: (etapa: number) => string;
  nomeArquivoDesktop: (etapa: number) => string;
};

const JARDINS: Record<JardimId, ConfiguracaoJardim> = {
  deserto: {
    nome: "Jardim do Deserto",
    pasta: "deserto",

    // Existem 11 imagens numeradas de 0 a 10.
    etapaVisualMaxima: 10,

    // Ex.: 0_meudeserto_9_16.png ... 10_meudeserto_9_16.png
    nomeArquivoMobile: (etapa) => `${etapa}_meudeserto_9_16.png`,

    // Ex.: 0_meudeserto_paisagem.png ... 10_meudeserto_paisagem.png
    nomeArquivoDesktop: (etapa) => `${etapa}_meudeserto_paisagem.png`,
  },
};

/**
 * A pontuação real do jardim pode crescer sem limite.
 * Esta função limita SOMENTE a imagem que existe para o jardim atual.
 *
 * Deserto:
 * 0 pontos  -> imagem 0
 * 1 ponto   -> imagem 1
 * ...
 * 10 pontos -> imagem 10
 * 11+       -> imagem 10
 */
export function getEtapaVisualJardim(
  jardimId: JardimId,
  pontuacaoJardim: number,
) {
  const jardim = JARDINS[jardimId];

  const pontuacaoSegura = Number.isFinite(pontuacaoJardim)
    ? Math.max(0, Math.floor(pontuacaoJardim))
    : 0;

  return Math.min(pontuacaoSegura, jardim.etapaVisualMaxima);
}

export function getImagensJardim(
  jardimId: JardimId,
  pontuacaoJardim: number,
): ImagensResponsivasJardim {
  const jardim = JARDINS[jardimId];
  const etapa = getEtapaVisualJardim(jardimId, pontuacaoJardim);
  const base = `/imagens/jardim/cenarios/${jardim.pasta}`;

  return {
    mobile: `${base}/mobile/${jardim.nomeArquivoMobile(etapa)}`,
    desktop: `${base}/desktop/${jardim.nomeArquivoDesktop(etapa)}`,
  };
}

export function getNomeJardim(jardimId: JardimId) {
  return JARDINS[jardimId].nome;
}
