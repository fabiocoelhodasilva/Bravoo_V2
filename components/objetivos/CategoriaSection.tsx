"use client";

import { ObjetivoCard } from "./ObjetivoCard";
import { calcularMetricas, corCategoria } from "@/lib/objetivos-utils";
import type { CategoriaGrupo, Objetivo } from "@/lib/objetivos-types";

interface CategoriaSectionProps {
  grupo: CategoriaGrupo;
  onProgressChange: (id: string, value: number) => void;
  onDelete: (id: string) => void;
}

export function CategoriaSection({ grupo, onProgressChange, onDelete }: CategoriaSectionProps) {
  const { cat, items } = grupo;
  const metricas = calcularMetricas(items);
  const color = corCategoria({ id: cat.id ?? "", nome: cat.nome });

  return (
    <section
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${color}45`,
        background: `
          radial-gradient(900px 260px at 0% 0%, ${color}18, transparent 58%),
          radial-gradient(700px 220px at 100% 100%, ${color}0f, transparent 60%),
          linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015)),
          #111
        `,
        boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 18px 34px rgba(0,0,0,0.34), 0 0 24px ${color}28`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 24px rgba(0,0,0,0.28)";
      }}
    >
      {/* Barra lateral colorida */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: color,
          boxShadow: `2px 0 16px ${color}60`,
        }}
      />

      {/* Header da categoria */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "16px 16px 14px 22px",
          borderBottom: `1px solid ${color}28`,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 13,
              height: 13,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 16px ${color}80`,
              flexShrink: 0,
              marginTop: 5,
            }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontWeight: 800,
                fontSize: "1rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#f5f5f5",
              }}
            >
              {cat.nome}
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 900,
                  color,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {metricas.media}%
              </span>
              <span style={{ fontSize: "0.88rem", color: "#e0e0e0", fontWeight: 700 }}>concluído</span>
              <span
                style={{
                  fontSize: "0.82rem",
                  color: "#d0d0d0",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {metricas.concluidos} / {metricas.total} objetivos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de objetivos */}
      <div
        style={{
          padding: "14px 16px 18px 22px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((obj: Objetivo) => (
          <ObjetivoCard
            key={obj.id}
            id={obj.id}
            titulo={obj.titulo}
            progresso={Number(obj.progresso_percentual) || 0}
            color={color}
            onProgressChange={onProgressChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
