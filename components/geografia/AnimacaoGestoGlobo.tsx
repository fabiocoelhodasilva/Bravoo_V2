"use client";

export default function AnimacaoGestoGlobo() {
  return (
    <div className="relative h-20 w-40">
      <style jsx>{`
        @keyframes deslizarMao {
          0% {
            transform: translateX(-18px) translateY(0px) scale(1);
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          38% {
            transform: translateX(18px) translateY(0px) scale(1);
            opacity: 1;
          }
          52% {
            transform: translateX(18px) translateY(0px) scale(1.06);
            opacity: 1;
          }
          66% {
            transform: translateX(18px) translateY(0px) scale(0.94);
            opacity: 1;
          }
          82% {
            transform: translateX(0px) translateY(0px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(0px) translateY(0px) scale(1);
            opacity: 0;
          }
        }

        @keyframes linhaMover {
          0% {
            transform: scaleX(0.65);
            opacity: 0.25;
          }
          25% {
            transform: scaleX(1);
            opacity: 0.9;
          }
          50% {
            transform: scaleX(0.75);
            opacity: 0.5;
          }
          75% {
            transform: scaleX(1);
            opacity: 0.9;
          }
          100% {
            transform: scaleX(0.7);
            opacity: 0.25;
          }
        }

        @keyframes pulsoZoom {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.18);
            opacity: 0.9;
          }
        }
      `}</style>

      <div className="absolute left-1/2 top-1/2 h-[2px] w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 [animation:linhaMover_1.8s_ease-in-out_infinite]" />

      <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 [animation:pulsoZoom_1.8s_ease-in-out_infinite]" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl [animation:deslizarMao_1.8s_ease-in-out_infinite]">
        👆
      </div>
    </div>
  );
}