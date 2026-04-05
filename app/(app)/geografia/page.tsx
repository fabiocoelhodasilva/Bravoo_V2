"use client";

import { useEffect, useState } from "react";
import GeografiaMenu from "@/components/geografia/GeografiaMenu";
import { supabase } from "@/lib/supabase/client";

const MATERIA_ID = "d366c6de-2345-4bb2-ac1f-a88747a2248d";

export default function GeografiaPage() {
  const [coins, setCoins] = useState(0);
  const [constancyCount, setConstancyCount] = useState(0);

  useEffect(() => {
    async function carregarGamificacao() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const userId = user.id;

      /* moedas (saldo geral) */
      const { data: moedasData } = await supabase
        .from("vw_next_saldo_moedas_geral")
        .select("saldo_moedas")
        .eq("usuario_id", userId)
        .maybeSingle();

      setCoins(moedasData?.saldo_moedas || 0);

      /* persistência */
      const { data: sequenciaData } = await supabase
        .from("next_sequencia_dias_usuario")
        .select("dias_seguidos")
        .eq("usuario_id", userId)
        .eq("materia_id", MATERIA_ID)
        .maybeSingle();

      setConstancyCount(sequenciaData?.dias_seguidos || 0);
    }

    carregarGamificacao();
  }, []);

  return (
    <GeografiaMenu
      constancyCount={constancyCount}
      coins={coins}
    />
  );
}