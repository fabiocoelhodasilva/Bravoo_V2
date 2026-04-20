"use client";

import GeografiaPaisesPage from "@/components/geografia/GeografiaPaisesPage";
import { REGIOES_CONFIG } from "@/lib/geografia/regioes-config";

const CONFIG_BRASIL_REGIOES = REGIOES_CONFIG["brasil-regioes"];

export default function Page() {
  return <GeografiaPaisesPage config={CONFIG_BRASIL_REGIOES} />;
}