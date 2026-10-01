/**
 * Catálogo central das imagens dos jardins.
 *
 * Os arquivos ficam dentro de /public, por isso os caminhos usados
 * no app começam em /imagens/...
 */

export type JardimId = "deserto" | "flores";

/** Preload compartilhado pelo cenário e pelo painel de itens do jardim. */
export function preloadImagem(src: string) {
  const imagem = new Image();
  imagem.src = src;
}

export type ImagensResponsivasJardim = {
  mobile: string;
  desktop: string;
};

type ConfiguracaoJardim = {
  nome: string;
  pasta: string;

  /**
   * Menor e maior etapa visual aceita pelo jardim.
   *
   * IMPORTANTE:
   * Isso limita somente a imagem exibida.
   * A pontuação real do usuário continua crescendo normalmente.
   */
  etapaVisualMinima: number;
  etapaVisualMaxima: number;

  nomeArquivoMobile: (etapa: number) => string;
  nomeArquivoDesktop: (etapa: number) => string;
};

const JARDINS: Record<JardimId, ConfiguracaoJardim> = {
  /* =========================================================
     JARDIM 1 — DESERTO
     ========================================================= */

  deserto: {
    nome: "Jardim do Deserto",
    pasta: "deserto",

    // Existem 11 imagens numeradas de 0 a 10.
    etapaVisualMinima: 0,
    etapaVisualMaxima: 10,

    // Ex.: 0_meudeserto_9_16.png ... 10_meudeserto_9_16.png
    nomeArquivoMobile: (etapa) =>
      `${etapa}_meudeserto_9_16.png`,

    // Ex.: 0_meudeserto_paisagem.png ... 10_meudeserto_paisagem.png
    nomeArquivoDesktop: (etapa) =>
      `${etapa}_meudeserto_paisagem.png`,
  },

  /* =========================================================
     JARDIM 2 — FLORES
     ========================================================= */

  flores: {
    nome: "Jardim das Flores",
    pasta: "flores",

    /**
     * O Jardim das Flores possui 8 etapas visuais.
     *
     * Progresso no jardim:
     * 1 -> arquivo 04
     * 2 -> arquivo 05
     * 3 -> arquivo 06
     * 4 -> arquivo 07
     * 5 -> arquivo 08
     * 6 -> arquivo 09
     * 7 -> arquivo 10
     * 8 -> arquivo 11
     *
     * Acima de 8, continua usando o arquivo 11.
     */
    etapaVisualMinima: 1,
    etapaVisualMaxima: 8,

    // Ex.: 04_flores_9_16.png ... 11_flores_9_16.png
    nomeArquivoMobile: (etapa) => {
      const numeroArquivo = etapa + 3;

      return `${String(numeroArquivo).padStart(
        2,
        "0",
      )}_flores_9_16.png`;
    },

    // Ex.: 04_flores_paisagem.png ... 11_flores_paisagem.png
    nomeArquivoDesktop: (etapa) => {
      const numeroArquivo = etapa + 3;

      return `${String(numeroArquivo).padStart(
        2,
        "0",
      )}_flores_paisagem.png`;
    },
  },
};

/**
 * A pontuação/progresso real do jardim pode crescer sem limite.
 *
 * Esta função limita SOMENTE a etapa visual para uma imagem
 * que realmente exista naquele jardim.
 *
 * Exemplos:
 *
 * Deserto:
 * 0  -> imagem 0
 * 5  -> imagem 5
 * 10 -> imagem 10
 * 11 -> continua na imagem 10
 *
 * Flores:
 * 1 -> arquivo 04
 * 2 -> arquivo 05
 * ...
 * 8 -> arquivo 11
 * 9 -> continua no arquivo 11
 * 10 -> continua no arquivo 11
 */
export function getEtapaVisualJardim(
  jardimId: JardimId,
  progressoNoJardim: number,
) {
  const jardim = JARDINS[jardimId];

  const progressoSeguro = Number.isFinite(progressoNoJardim)
    ? Math.floor(progressoNoJardim)
    : jardim.etapaVisualMinima;

  return Math.min(
    jardim.etapaVisualMaxima,
    Math.max(jardim.etapaVisualMinima, progressoSeguro),
  );
}

/**
 * Retorna as imagens mobile e desktop correspondentes
 * ao jardim e à etapa atual.
 *
 * ATENÇÃO:
 * O segundo parâmetro representa o progresso DENTRO
 * do jardim atual, e não necessariamente a pontuação
 * total acumulada pelo usuário.
 */
export function getImagensJardim(
  jardimId: JardimId,
  progressoNoJardim: number,
): ImagensResponsivasJardim {
  const jardim = JARDINS[jardimId];

  const etapa = getEtapaVisualJardim(
    jardimId,
    progressoNoJardim,
  );

  const base = `/imagens/jardim/cenarios/${jardim.pasta}`;

  return {
    mobile: `${base}/mobile/${jardim.nomeArquivoMobile(etapa)}`,
    desktop: `${base}/desktop/${jardim.nomeArquivoDesktop(etapa)}`,
  };
}

export function getNomeJardim(jardimId: JardimId) {
  return JARDINS[jardimId].nome;
}