"use client";

import GeografiaPaisesPage from "@/components/geografia/GeografiaPaisesPage";
import { REGIOES_CONFIG } from "@/lib/geografia/regioes-config";

export default function Page() {

  const config = REGIOES_CONFIG["brasil-regioes"];

  return <GeografiaPaisesPage config={config} />;

}