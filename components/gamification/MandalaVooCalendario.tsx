"use client";

import { useEffect } from "react";

export const MANDALA_ANIMACAO_PENDENTE = "bravoo:mandala-animacao-pendente";

export default function MandalaVooCalendario() {
  useEffect(() => {
    let data: string | null;
    try {
      data = sessionStorage.getItem(MANDALA_ANIMACAO_PENDENTE);
    } catch {
      return;
    }
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return;

    let frame = 0;
    let voo: HTMLImageElement | null = null;
    let origem: HTMLImageElement | null = null;
    let destino: HTMLElement | null = null;
    let pulso: Animation | null = null;
    let visibilidadeOrigem = "";
    let visibilidadeDestino = "";
    let iniciou = false;
    const observer = new MutationObserver(tentarIniciar);

    function tentarIniciar() {
      if (iniciou) return;
      origem = document.querySelector<HTMLImageElement>('[data-mandala-origem="completa"]');
      destino = document.querySelector<HTMLElement>(`[data-mandala-dia="${data}"]`);
      if (!origem || !destino || !destino.querySelector("img") || !origem.complete || !origem.naturalWidth) return;
      iniciou = true;
      observer.disconnect();
      const inicio = origem.getBoundingClientRect();
      const fim = destino.getBoundingClientRect();
      const tamanho = inicio.width;
      const x = inicio.left + tamanho / 2;
      const y = Math.min(inicio.top + inicio.height / 2, window.innerHeight - tamanho / 2 - 16);
      const dx = fim.left + fim.width / 2 - x;
      const dy = fim.top + fim.height / 2 - y;
      const escalaFinal = (window.innerWidth >= 640 ? 28 : 24) / tamanho;
      visibilidadeOrigem = origem.style.visibility;
      visibilidadeDestino = destino.style.visibility;
      origem.style.visibility = "hidden";
      destino.style.visibility = "hidden";
      voo = document.createElement("img");
      voo.src = origem.src;
      voo.alt = "";
      voo.setAttribute("aria-hidden", "true");
      Object.assign(voo.style, {
        position: "fixed", left: `${x - tamanho / 2}px`, top: `${y - tamanho / 2}px`,
        width: `${tamanho}px`, height: `${tamanho}px`, objectFit: "contain",
        pointerEvents: "none", zIndex: "10001", filter: "drop-shadow(0 0 20px #facc15)",
      });
      document.body.appendChild(voo);
      const inicioTempo = performance.now();
      const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      function animar(agora: number) {
        if (!voo || !origem || !destino) return;
        const tempo = agora - inicioTempo;
        const t = reduzir ? 1 : Math.min(1, Math.max(0, (tempo - 1000) / 1400));
        const giro = tempo < 1000 ? 720 * (tempo / 1000) ** 2 : 720 + 1440 * t;
        const arco = -4 * Math.min(180, window.innerHeight * 0.22) * t * (1 - t);
        voo.style.transform = `translate(${dx * t}px, ${dy * t + arco}px) rotate(${giro}deg) scale(${1 + (escalaFinal - 1) * t})`;
        if (t < 1) {
          frame = requestAnimationFrame(animar);
          return;
        }
        destino.style.visibility = visibilidadeDestino;
        origem.style.visibility = visibilidadeOrigem;
        voo.remove();
        voo = null;
        try {
          if (sessionStorage.getItem(MANDALA_ANIMACAO_PENDENTE) === data) {
            sessionStorage.removeItem(MANDALA_ANIMACAO_PENDENTE);
          }
        } catch { /* A animacao ja terminou. */ }
        pulso = destino.animate([
          { transform: "scale(1)", filter: "drop-shadow(0 0 0px #facc15)" },
          { transform: "scale(1.4)", filter: "drop-shadow(0 0 16px #facc15)", offset: 0.5 },
          { transform: "scale(1)", filter: "drop-shadow(0 0 0px #facc15)" },
        ], { duration: reduzir ? 0 : 650, easing: "ease-out" });
      }
      frame = requestAnimationFrame(animar);
    }

    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-mandala-origem"] });
    document.addEventListener("load", tentarIniciar, true);
    tentarIniciar();
    return () => {
      observer.disconnect();
      document.removeEventListener("load", tentarIniciar, true);
      cancelAnimationFrame(frame);
      pulso?.cancel();
      voo?.remove();
      if (iniciou && origem) origem.style.visibility = visibilidadeOrigem;
      if (iniciou && destino) destino.style.visibility = visibilidadeDestino;
    };
  }, []);

  return null;
}
