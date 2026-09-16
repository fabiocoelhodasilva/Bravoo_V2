"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { X } from "lucide-react";
import { MAPA_JARDINS, REQUISITO_FLORES, getProgressoCaminhada } from "@/lib/gamificacao/jardim/jardins-config";

type Props = {
  pontuacao: number | null;
  usuarioId: string | null;
  carregando: boolean;
  erro: boolean;
  onTentarNovamente: () => void;
  onClose: () => void;
  onEntrarJardim: () => void;
};
type Ponto = { x: number; y: number; width?: number; height?: number };
const posicao = (p: Ponto): CSSProperties => ({ left: `${p.x}%`, top: `${p.y}%`,
  ...(p.width !== undefined ? { width: `${p.width}%`, height: `${p.height}%` } : {}) });

export default function JardinsMapaPanel({ pontuacao, usuarioId, carregando, erro, onTentarNovamente, onClose, onEntrarJardim }: Props) {
  const [comemorando, setComemorando] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pronto = !carregando && !erro && pontuacao !== null;
  const passos = getProgressoCaminhada(pontuacao ?? 0);
  const desbloqueado = pronto && passos >= REQUISITO_FLORES;

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => { if (anterior?.isConnected) anterior.focus(); };
  }, []);

  useEffect(() => {
    if (!desbloqueado || !usuarioId) return;
    const chave = `bravoo:jardins:flores:celebrado:${usuarioId}`;

    try {
      if (localStorage.getItem(chave)) return;
    } catch {
      /* Sem armazenamento, celebra nesta abertura. */
    }

    const frame = requestAnimationFrame(() => setComemorando(true));
    const timer = window.setTimeout(() => {
      setComemorando(false);
      try {
        localStorage.setItem(chave, "1");
      } catch {
        /* Nao bloqueia o mapa. */
      }
    }, 2000);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [desbloqueado, usuarioId]);

  return (
    <section
      className="jardins-panel"
      aria-label="Mapa dos Jardins"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      {/* A imagem do mapa é o único cenário desta tela. */}
      {erro && (
        <div className="jardins-aviso" role="alert">
          <span>Não foi possível carregar sua caminhada.</span>
          <button type="button" onClick={onTentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}
        <div className="jardins-mapa">
          <picture className="mapa-picture">
            <source
              media="(max-width: 767px)"
              srcSet={MAPA_JARDINS.mobile.imagem}
              width={941}
              height={1672}
            />

            <img
              src={MAPA_JARDINS.desktop.imagem}
              width={1672}
              height={941}
              alt="Caminho entre o Jardim no Deserto e o Jardim das Flores"
              draggable={false}
            />
          </picture>

          {pronto &&
            (["mobile", "desktop"] as const).map((versao) => (
              <MapaOverlay
                key={versao}
                versao={versao}
                passos={passos}
                comemorando={desbloqueado && comemorando}
                onEntrarJardim={onEntrarJardim}
              />
            ))}

          {!pronto && !erro && (
            <div className="carregando-mapa">
              Carregando sua caminhada...
            </div>
          )}

          {/* X flutuante: não cria cabeçalho nem faixa separada. */}
          <button
            ref={closeRef}
            onClick={onClose}
            type="button"
            aria-label="Fechar Jardins"
            className="fechar-jardins"
          >
            <X size={20} />
          </button>
        </div>
      <style jsx>{`
        .jardins-panel {
          position: absolute;
          inset: 0;
          z-index: 30;
          overflow: hidden;
          background: #120b07;
          color: #fff4d4;
        }

        .jardins-mapa {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #120b07;
        }

        .mapa-picture {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mapa-picture :global(img) {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          user-select: none;
        }

        .fechar-jardins {
          position: absolute;
          z-index: 50;
          top: max(12px, env(safe-area-inset-top));
          right: 12px;
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 999px;
          border: 1px solid rgba(241, 210, 122, 0.28);
          background: rgba(35, 22, 13, 0.62);
          color: #fff4d4;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(10px);
        }

        .carregando-mapa,
        .jardins-aviso {
          position: absolute;
          z-index: 45;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
          max-width: 280px;
          border: 1px solid rgba(241, 210, 122, 0.2);
          border-radius: 18px;
          background: rgba(39, 25, 15, 0.7);
          padding: 0.9rem 1rem;
          text-align: center;
          font-size: 0.78rem;
          backdrop-filter: blur(10px);
        }

        .jardins-aviso button {
          color: #ffe1a0;
          font-weight: 800;
          text-decoration: underline;
        }

        @media (max-width: 767px) {
          .mapa-picture :global(img) {
            object-fit: cover;
            object-position: center;
          }
        }

        @media (min-width: 768px) {
          .jardins-mapa {
            inset: 0;
            border-radius: 0;
          }

          .mapa-picture :global(img) {
            object-fit: cover;
            object-position: center;
          }
        }
      `}</style>
    </section>
  );

}

function MapaOverlay({ versao, passos, comemorando, onEntrarJardim }: {
  versao: "mobile" | "desktop";
  passos: number;
  comemorando: boolean;
  onEntrarJardim: () => void;
}) {
  const configBase = MAPA_JARDINS[versao];

  const config =
    versao === "desktop"
      ? {
          ...configBase,
          flores: {
            ...configBase.flores,
            x: 60.28,
            y: 15.87,
            width: 31,
            height: 24,
          },
          cadeado: {
            ...configBase.cadeado,
            x: 59.91,
            y: 14.79,
          },
          deserto: {
            ...configBase.deserto,
            x: 31.89,
            y: 78.46,
            width: 44,
            height: 30,
          },
        }
      : {
          ...configBase,
          flores: {
            ...configBase.flores,
            x: 60.5,
            y: 22.5,
            width: 54,
            height: 18,
          },
          cadeado: {
            ...configBase.cadeado,
            x: 59.64,
            y: 20.66,
          },
          deserto: {
            ...configBase.deserto,
            x: 53.92,
            y: 85.15,
            width: 56,
            height: 19,
          },
        };

  const bloqueado = passos < REQUISITO_FLORES;
  const flores = config.flores;
  const cadeado = config.cadeado;

  // Destaque visual do jardim atual, com calibração final aprovada.
  const jardimAtualVisual: Ponto =
    bloqueado
      ? versao === "desktop"
        ? { x: 47.57, y: 86.8, width: 47, height: 45 }
        : { x: 50.18, y: 75.33, width: 83, height: 29 }
      : flores;

  // Rótulo discreto do próximo jardim, sem bola preta e sem cadeado.
  const floresLabel: Ponto =
    versao === "desktop"
      ? { x: 53, y: 15.5 }
      : { x: 52.5, y: 31.5 };

  return <div className={`mapa-overlay ${versao}`}>
    {/* Próximo jardim: rótulo discreto, sem máscara preta e sem cadeado. */}
    <div
      className={`proximo-jardim-label ${!bloqueado ? "desbloqueado" : ""}`}
      style={posicao(floresLabel)}
      role="status"
    >
      <strong>Jardim das Flores</strong>
      <small>
        {bloqueado
          ? "Bloqueado"
          : comemorando
            ? "Desbloqueado!"
            : "Desbloqueado"}
      </small>
    </div>

    {!bloqueado && comemorando && (
      <div
        className="area flores-livre flash"
        style={posicao(flores)}
        aria-hidden="true"
      />
    )}

    {/* O halo mantém a posição aprovada e toda sua área permite entrar pelo teclado/toque. */}
    <button
      type="button"
      className="local-atual-halo"
      style={posicao(jardimAtualVisual)}
      onClick={onEntrarJardim}
      aria-label="Você está aqui. Entrar no jardim atual"
    >
      <span>Você está aqui<small>Entrar no jardim</small></span>
    </button>

    {/* Jardim atual: mostra o progresso sem poluir o caminho com 11 bolinhas */}
    <div
      className="area deserto"
      style={posicao(config.deserto)}
    >
      <div className="jardim-atual-card">
        <strong>
          {bloqueado ? "Jardim do Deserto" : "Jardim do Deserto · Concluído"}
        </strong>

        <span>
          {Math.min(passos, REQUISITO_FLORES)} de {REQUISITO_FLORES} passos
        </span>

        <div
          className="barra-progresso"
          aria-label={`${Math.min(passos, REQUISITO_FLORES)} de ${REQUISITO_FLORES} passos`}
        >
          <div
            className="barra-progresso-preenchimento"
            style={{
              width: `${Math.min(
                100,
                (Math.min(passos, REQUISITO_FLORES) / REQUISITO_FLORES) * 100,
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
    <style jsx>{`
      .mapa-overlay { position:absolute; inset:0; pointer-events:none; }
      .mobile { display:none; } @media(max-width:767px) { .mobile {display:block;} .desktop {display:none;} }

      .area { position:absolute; transform:translate(-50%,-50%); border-radius:45%; }
      .flores-livre { display:flex; align-items:center; justify-content:center; }
      .deserto span { background:#3e280fc9; border:1px solid #dfb76699; border-radius:2rem; padding:.3em .8em; color:#ffe4a8; text-align:center; font-size:1.1cqw; backdrop-filter:blur(4px); }
      .mobile .deserto span { font-size:2.8cqw; }
      .deserto { z-index:5; display:flex; justify-content:center; align-items:flex-end; padding-bottom:3%; }

      .proximo-jardim-label {
        position:absolute;
        z-index:4;
        transform:translate(-50%,-50%);
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:.16rem;
        border:1px solid rgba(241,210,122,.48);
        border-radius:999px;
        background:rgba(42,27,13,.76);
        padding:.38rem .8rem;
        color:#ffe49c;
        text-align:center;
        text-shadow:0 1px 2px #000;
        box-shadow:0 6px 18px rgba(0,0,0,.22);
        backdrop-filter:blur(6px);
        pointer-events:none;
      }

      .proximo-jardim-label strong {
        font-size:.9cqw;
        line-height:1;
      }

      .proximo-jardim-label small {
        font-size:.62cqw;
        color:#fff0c6c7;
        line-height:1;
      }

      .proximo-jardim-label.desbloqueado {
        border-color:rgba(255,216,112,.72);
        background:rgba(66,43,14,.82);
      }

      .mobile .proximo-jardim-label {
        padding:.28rem .6rem;
      }

      .mobile .proximo-jardim-label strong {
        font-size:2.7cqw;
      }

      .mobile .proximo-jardim-label small {
        font-size:2.05cqw;
      }

      .local-atual-halo {
        position:absolute;
        z-index:2;
        display:none;
        transform:translate(-50%,-50%);
        border:3px solid rgba(255, 210, 91, 0.96);
        border-radius:50%;
        background:radial-gradient(
          ellipse,
          rgba(255, 211, 91, 0.02) 42%,
          rgba(255, 211, 91, 0.08) 68%,
          rgba(255, 211, 91, 0.16) 100%
        );
        box-shadow:
          0 0 0 1px rgba(255, 238, 168, 0.2),
          0 0 1.1cqw rgba(255, 205, 72, 0.62),
          inset 0 0 1.2cqw rgba(255, 205, 72, 0.16);
        pointer-events:auto;
        cursor:pointer;
        transition:filter .18s ease;
        animation:respirar-local 3.2s ease-in-out infinite;
      }

      .local-atual-halo:hover,
      .local-atual-halo:active { filter:brightness(1.18); }
      .local-atual-halo:focus-visible { outline:3px solid #fff0c6; outline-offset:5px; }
      .local-atual-halo small { display:block; margin-top:.3rem; font-size:inherit; font-weight:500; }

      .desktop .local-atual-halo,
      .mobile .local-atual-halo {
        display:block;
      }

      .mobile .local-atual-halo {
        border-width:2.5px;
        box-shadow:
          0 0 0 1px rgba(255, 238, 168, 0.16),
          0 0 2.2cqw rgba(255, 205, 72, 0.5),
          inset 0 0 2.5cqw rgba(255, 205, 72, 0.12);
      }

      .local-atual-halo span {
        position:absolute;
        left:50%;
        top:-1.05rem;
        transform:translateX(-50%);
        white-space:nowrap;
        border:1px solid rgba(241, 210, 122, 0.72);
        border-radius:999px;
        background:rgba(42, 27, 13, 0.9);
        padding:.24rem .58rem;
        color:#ffe49c;
        font-size:.72cqw;
        font-weight:800;
        line-height:1;
        letter-spacing:.01em;
        text-shadow:0 1px 2px #000;
        box-shadow:0 5px 15px rgba(0,0,0,.26);
        backdrop-filter:blur(5px);
      }

      .mobile .local-atual-halo span {
        top:-1rem;
        padding:.2rem .48rem;
        font-size:2.35cqw;
      }

      .jardim-atual-card {
        position:relative;
        z-index:6;
        display:flex;
        min-width:10rem;
        flex-direction:column;
        align-items:center;
        gap:.28rem;
        border:1px solid #dfb76699;
        border-radius:1rem;
        background:#3e280fd9;
        padding:.5rem .75rem;
        color:#ffe4a8;
        text-align:center;
        box-shadow:0 8px 24px #0005;
        backdrop-filter:blur(5px);
      }

      .jardim-atual-card strong {
        font-size:1.05cqw;
        line-height:1.1;
      }

      .jardim-atual-card > span,
      .status-jardim {
        font-size:.82cqw;
        color:#fff0c6cc;
      }

      .barra-progresso {
        width:100%;
        height:.28rem;
        overflow:hidden;
        border-radius:999px;
        background:#fff2c51c;
      }

      .barra-progresso-preenchimento {
        height:100%;
        border-radius:inherit;
        background:linear-gradient(90deg,#b97c20,#ffd568);
        box-shadow:0 0 .45rem #ffd56877;
        transition:width .45s ease;
      }

      .mobile .jardim-atual-card {
        min-width:8.5rem;
        padding:.42rem .65rem;
      }

      .mobile .jardim-atual-card strong {
        font-size:3cqw;
      }

      .mobile .jardim-atual-card > span,
      .mobile .status-jardim {
        font-size:2.45cqw;
      }

      .flash { animation:desbloqueio 2s ease-out; }

      @keyframes respirar-local {
        0%,100% {
          box-shadow:
            0 0 0 1px rgba(255, 238, 168, 0.18),
            0 0 .75cqw rgba(255, 205, 72, 0.46),
            inset 0 0 1cqw rgba(255, 205, 72, 0.12);
        }
        50% {
          box-shadow:
            0 0 0 1px rgba(255, 238, 168, 0.28),
            0 0 1.35cqw rgba(255, 205, 72, 0.72),
            inset 0 0 1.35cqw rgba(255, 205, 72, 0.2);
        }
      }
      @keyframes desbloqueio { 25% { box-shadow:0 0 3cqw #ffd45bcc,inset 0 0 3cqw #ffd45b80; } 100% { box-shadow:none; } }
      @media(prefers-reduced-motion:reduce) {
        .local-atual-halo,.flash { animation:none; }
      }
    `}</style>
  </div>;
}
