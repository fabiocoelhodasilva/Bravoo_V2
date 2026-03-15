"use client";

import { useCallback, useRef } from "react";

interface ProgressBarProps {
  value: number;
  color: string;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
}

export function ProgressBar({ value, color, onChange, onChangeEnd }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastValue = useRef(value);

  const getPercent = useCallback((clientX: number): number => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    return Math.round((x / rect.width) * 100);
  }, []);

  const handleStart = useCallback(
    (clientX: number) => {
      dragging.current = true;
      const p = getPercent(clientX);
      lastValue.current = p;
      onChange?.(p);

      const onMove = (e: MouseEvent | TouchEvent) => {
        if (!dragging.current) return;
        const x = "touches" in e ? e.touches[0].clientX : e.clientX;
        const p2 = getPercent(x);
        lastValue.current = p2;
        onChange?.(p2);
      };

      const onEnd = () => {
        if (!dragging.current) return;
        dragging.current = false;
        onChangeEnd?.(lastValue.current);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd);
    },
    [getPercent, onChange, onChangeEnd]
  );

  const label = value === 0 ? "0%" : value >= 100 ? "Concluído ✅" : `${value}%`;

  return (
    <div
      ref={barRef}
      onMouseDown={(e) => handleStart(e.clientX)}
      onTouchStart={(e) => {
        e.preventDefault();
        handleStart(e.touches[0].clientX);
      }}
      style={{
        position: "relative",
        width: "100%",
        height: 22,
        borderRadius: 999,
        overflow: "hidden",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        cursor: "pointer",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: color,
          borderRadius: 999,
          transition: dragging.current ? "none" : "width 0.3s ease",
          boxShadow: `0 0 12px ${color}60`,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.72rem",
          fontWeight: 900,
          color: "#fff",
          textShadow: "0 1px 6px rgba(0,0,0,0.7)",
          pointerEvents: "none",
        }}
      >
        {label}
      </span>
    </div>
  );
}
