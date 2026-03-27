"use client";

import GeografiaPaisesPage from "@/components/geografia/GeografiaPaisesPage";
import { REGIOES_CONFIG } from "@/lib/geografia/regioes-config";

export default function Page() {
  return <GeografiaPaisesPage config={REGIOES_CONFIG["america-do-sul"]} />;
}