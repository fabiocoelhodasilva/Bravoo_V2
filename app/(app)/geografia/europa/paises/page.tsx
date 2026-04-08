"use client";

import { useSearchParams } from "next/navigation";
import GeografiaPaisesPage from "@/components/geografia/GeografiaPaisesPage";
import { REGIOES_CONFIG } from "@/lib/geografia/regioes-config";

export default function Page() {
  const searchParams = useSearchParams();
  const fase = searchParams.get("fase");

  const config =
    fase && REGIOES_CONFIG[`europa-fase-${fase}`]
      ? REGIOES_CONFIG[`europa-fase-${fase}`]
      : REGIOES_CONFIG["europa"];

  return <GeografiaPaisesPage config={config} />;
}