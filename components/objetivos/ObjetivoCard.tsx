"use client";

import { useState } from "react";
import { ProgressBar } from "./ProgressBar";

interface ObjetivoCardProps {
  id: string;
  titulo: string;
  progresso: number;
  color: string;
  onProgressChange: (id: string, value: number) => void;
  onDelete: (id: string) => void;
}

export function ObjetivoCard({
  id,
  titulo,
  progresso,
  color,
  onProgressChange,
  onDelete,
}: ObjetivoCardProps) {
  const [localProgress, setLocalProgress] = useState(progresso);
  const [deleting, setDeleting] = useState(false);

  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), rgba(0,0,0,0.34)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 16,
        padding: "14px 16px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
        transition: "transform 0.18s ease, border-color 0.18s ease",
        opacity: deleting ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.borderColor = `${color}44`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.10)";
      }}
    >
      <p
        style={{
          margin: "0 0 10px 0",
          fontWeight: 800,
          fontSize: "0.92rem",
          lineHeight: 1.3,
          color: "#f0f0f0",
        }}
      >
        {titulo}
      </p>

      <ProgressBar
        value={localProgress}
        color={color}
        onChange={setLocalProgress}
        onChangeEnd={(v) => onProgressChange(id, v)}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button
          onClick={() => {
            if (!confirm("Excluir este objetivo?")) return;
            setDeleting(true);
            onDelete(id);
          }}
          style={{
            background: "transparent",
            border: "1px solid rgba(201,74,74,0.6)",
            color: "#ff7c7c",
            borderRadius: 999,
            padding: "4px 12px",
            fontSize: "0.72rem",
            fontWeight: 800,
            cursor: "pointer",
            transition: "background 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(201,74,74,0.15)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
