"use client";

import type { Metricas, RankingItem } from "@/lib/objetivos-types";

interface ResumoGeralProps {
  metricas: Metricas;
  ranking: RankingItem[];
}

export function ResumoGeral({ metricas, ranking }: ResumoGeralProps) {
  const percentualConcluidos =
    metricas.total > 0 ? Math.round((metricas.concluidos / metricas.total) * 100) : 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
        marginBottom: 24,
      }}
    >
      {/* Card Progresso */}
      <div
        style={{
          background:
            "radial-gradient(700px 220px at 0% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), #0d0d0d",
          border: "1px solid rgba(233,137,29,0.35)",
          borderRadius: 20,
          padding: 18,
          boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
        }}
      >
        <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#d5d5d5" }}>
          Progresso Médio
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
          {/* Ranking categorias */}
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#aaa", fontWeight: 600 }}>Por categoria</p>
            {ranking.map((item) => (
              <div
                key={item.nome}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: item.cor,
                  gap: 8,
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {item.nome}
                </span>
                <span style={{ fontWeight: 900, whiteSpace: "nowrap" }}>{item.media}%</span>
              </div>
            ))}
          </div>

          {/* Média grande */}
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <p style={{ margin: "0 0 4px 0", fontSize: "0.82rem", fontWeight: 700, color: "#d5d5d5" }}>
              Média
            </p>
            <span
              style={{
                flex: 1,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(2.8rem, 6vw, 4.8rem)",
                fontWeight: 900,
                color: "#e9891d",
                letterSpacing: "-3px",
                lineHeight: 1,
              }}
            >
              {metricas.media}%
            </span>
          </div>
        </div>
      </div>

      {/* Card Concluídos */}
      <div
        style={{
          background:
            "radial-gradient(700px 220px at 0% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), #0d0d0d",
          border: "1px solid rgba(93,198,161,0.3)",
          borderRadius: 20,
          padding: 18,
          boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
        }}
      >
        <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: 700, color: "#d5d5d5" }}>
          Objetivos Concluídos
        </p>
        <p
          style={{
            margin: "0 0 6px 0",
            fontSize: "clamp(2rem, 5vw, 2.6rem)",
            fontWeight: 900,
            color: "#5dc6a1",
            lineHeight: 1,
            letterSpacing: "-1px",
          }}
        >
          {metricas.concluidos} / {metricas.total}
        </p>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#bdbdbd", fontWeight: 600 }}>
          {percentualConcluidos}% concluídos
        </p>

        {/* Mini barra geral */}
        <div
          style={{
            marginTop: 16,
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percentualConcluidos}%`,
              background: "#5dc6a1",
              borderRadius: 999,
              boxShadow: "0 0 10px #5dc6a160",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
