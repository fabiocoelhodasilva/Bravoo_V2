"use client";

import { useEffect, useState } from "react";
import GeografiaMenu from "@/components/geografia/GeografiaMenu";
import GamificationBar from "@/components/ui/GamificationBar";
import { supabase } from "@/lib/supabaseClient";

const MATERIA_ID = "d366c6de-2345-4bb2-ac1f-a88747a2248d";

export default function GeografiaPage() {
  const [coins, setCoins] = useState(0);
  const [constancyCount, setConstancyCount] = useState(0);
  const [coinsRank, setCoinsRank] = useState<number>(0);
  const [constancyRank, setConstancyRank] = useState<number>(0);

  async function carregarGamificacao() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const userId = user.id;

    // 🪙 MOEDAS
    const { data: moedasData } = await supabase
      .from("vw_next_saldo_moedas_por_materia")
      .select("saldo_moedas")
      .eq("usuario_id", userId)
      .eq("materia_id", MATERIA_ID)
      .single();

    setCoins(moedasData?.saldo_moedas || 0);

    // 🔥 SEQUÊNCIA DE DIAS
    const { data: sequencia } = await supabase
      .from("next_sequencia_dias_usuario")
      .select("dias_seguidos")
      .eq("usuario_id", userId)
      .single();

    setConstancyCount(sequencia?.dias_seguidos || 0);

    // 🏆 RANKING MOEDAS
    const { data: rankCoins } = await supabase
      .from("vw_next_ranking_pontuacao_por_materia")
      .select("posicao")
      .eq("usuario_id", userId)
      .eq("materia_id", MATERIA_ID)
      .single();

    setCoinsRank(rankCoins?.posicao || 0);

    // 💎 RANKING PEDRAS
    const { data: rankPedras } = await supabase
      .from("vw_next_ranking_pedras_por_materia")
      .select("posicao")
      .eq("usuario_id", userId)
      .eq("materia_id", MATERIA_ID)
      .single();

    setConstancyRank(rankPedras?.posicao || 0);
  }

  useEffect(() => {
    carregarGamificacao();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">

      {/* 🔥 SUA BARRA (AGORA CORRETAMENTE USADA) */}
      <GamificationBar
        constancyCount={constancyCount}
        coins={coins}
        constancyRank={constancyRank}
        coinsRank={coinsRank}
      />

      {/* MENU */}
      <GeografiaMenu />
    </div>
  );
}