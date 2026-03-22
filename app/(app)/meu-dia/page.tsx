"use client";

import { MeuDiaPageView } from "@/components/meu-dia/MeuDiaPageView";

export default function MeuDiaPage() {
  async function handleLogout() {
    // depois você conecta com Supabase
    console.log("logout");
  }

  return (
    <MeuDiaPageView
      onLogout={handleLogout}
      tarefasIniciais={[
        { id: "1", titulo: "Ler 10 páginas", concluida: false },
        { id: "2", titulo: "Treinar 30 minutos", concluida: false },
        { id: "3", titulo: "Organizar a mesa", concluida: true },
      ]}
    />
  );
}