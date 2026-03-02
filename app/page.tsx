"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AppIndex() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          router.replace("/login");
          return;
        }

        const userId = data.session.user.id;

        // Verifica cadastro complementar
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id, ano_escolar_id")
          .eq("id", userId)
          .single();

        const needsComplementaryData = !usuario?.ano_escolar_id;

        if (needsComplementaryData) {
          router.replace("/cadastro-complementar");
          return;
        }

        // Verifica se é professor aprovado
        const { data: prof } = await supabase
          .from("professores")
          .select("aprovado")
          .eq("usuario_id", userId)
          .maybeSingle();

        if (prof && prof.aprovado === true) {
          router.replace("/professor");
        } else {
          router.replace("/aluno");
        }
      } catch (e) {
        console.error("Erro ao decidir rota inicial:", e);
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  if (!checking) return null;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Carregando...</p>
      </div>
    </div>
  );
}