"use client";

import { useEffect, useState } from "react";
import GeografiaMenu from "@/components/geografia/GeografiaMenu";
import { supabase } from "@/lib/supabaseClient";

const MATERIA_ID = "d366c6de-2345-4bb2-ac1f-a88747a2248d";

export default function GeografiaPage() {
  const [coins, setCoins] = useState(0);
  const [constancyCount, setConstancyCount] = useState(0);
  const [coinsRank, setCoinsRank] = useState(0);
  const [constancyRank, setConstancyRank] = useState(0);

  useEffect(() => {
    async function carregarGamificacao() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const userId = user.id;

      const { data: moedasData } = await supabase
        .from("vw_next_saldo_moedas_por_materia")
        .select("saldo_moedas")
        .eq("usuario_id", userId)
        .eq("materia_id", MATERIA_ID)
        .maybeSingle();

      setCoins(moedasData?.saldo_moedas || 0);

      const { data: sequenciaData } = await supabase
        .from("next_sequencia_dias_usuario")
        .select("dias_seguidos")
        .eq("usuario_id", userId)
        .maybeSingle();

      setConstancyCount(sequenciaData?.dias_seguidos || 0);

      const { data: rankingPontuacaoData } = await supabase
        .from("vw_next_ranking_pontuacao_por_materia")
        .select("posicao")
        .eq("usuario_id", userId)
        .eq("materia_id", MATERIA_ID)
        .maybeSingle();

      setCoinsRank(rankingPontuacaoData?.posicao || 0);

      const { data: rankingPedrasData } = await supabase
        .from("vw_next_ranking_pedras_por_materia")
        .select("posicao")
        .eq("usuario_id", userId)
        .eq("materia_id", MATERIA_ID)
        .maybeSingle();

      setConstancyRank(rankingPedrasData?.posicao || 0);
    }

    carregarGamificacao();
  }, []);

  return (
    <GeografiaMenu
      constancyCount={constancyCount}
      coins={coins}
      constancyRank={constancyRank}
      coinsRank={coinsRank}
    />
  );
}