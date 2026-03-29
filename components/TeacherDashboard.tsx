"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ContextoProfessor = "escola" | "igreja";

type ProfessorComEscola = {
  escola_id: string | null;
  escolas?: {
    tipo_instituicao: number | null;
  } | null;
};

const styleColors = {
  "--color-1": "#c94a4a",
  "--color-2": "#e9891d",
  "--color-3": "#f1e6a7",
  "--color-4": "#5dc6a1",
  "--color-5": "#3d7a99",
  "--color-6": "#a35bdc",
  "--color-7": "#ff8c42",
} as React.CSSProperties;

const ROTAS = {
  escola: {
    turmas: "/professor/turmas",
    questoes: "/professor/escola/questoes",
    listas: "/professor/escola/listas",
    relatorios: "/professor/escola/relatorios",
  },
  igreja: {
    turmas: "/professor/classes",
    questoes: "/professor/igreja/questoes",
    listas: "/professor/igreja/listas",
    relatorios: "/professor/igreja/relatorios",
  },
};

const funcoesUsuario = [
  {
    label: "Bíblia",
    route: "/biblia?ctx=prof",
    className: "bg-[var(--color-1)]",
  },
  {
    label: "Geografia",
    route: "/geografia",
    className: "bg-[var(--color-5)]",
  },
  {
    label: "Matemática",
    route: "/matematica",
    className: "bg-[var(--color-4)]",
  },
  {
    label: "Virtudes",
    route: "/virtudes",
    className: "bg-[var(--color-6)]",
  },
  {
    label: "Meus Resultados",
    route: "/meus-resultados",
    className: "bg-[var(--color-7)]",
  },
] as const;

export default function TeacherDashboard() {
  const router = useRouter();

  const [contexto, setContexto] = useState<ContextoProfessor>("escola");
  const [loadingContexto, setLoadingContexto] = useState(true);

  useEffect(() => {
    inicializarDashboard();
  }, []);

  async function inicializarDashboard() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const ctxSalvo =
        typeof window !== "undefined" ? localStorage.getItem("ctx_prof") : null;

      const ctxDetectado = await detectarContexto(user.id);

      const contextoFinal: ContextoProfessor =
        ctxSalvo === "escola" || ctxSalvo === "igreja"
          ? ctxSalvo
          : ctxDetectado;

      setContexto(contextoFinal);
    } catch (error) {
      console.error("Erro ao inicializar dashboard do professor:", error);
      setContexto("escola");
    } finally {
      setLoadingContexto(false);
    }
  }

  async function detectarContexto(
    userId: string
  ): Promise<ContextoProfessor> {
    try {
      const { data: prof, error } = await supabase
        .from("professores")
        .select(`
          escola_id,
          escolas (
            tipo_instituicao
          )
        `)
        .eq("usuario_id", userId)
        .maybeSingle<ProfessorComEscola>();

      if (error || !prof?.escola_id) {
        return "escola";
      }

      const tipoInstituicao = prof.escolas?.tipo_instituicao;

      return tipoInstituicao === 2 ? "igreja" : "escola";
    } catch {
      return "escola";
    }
  }

  function trocarContexto(novoContexto: ContextoProfessor) {
    setContexto(novoContexto);
    localStorage.setItem("ctx_prof", novoContexto);
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      localStorage.removeItem("ctx_prof");
      router.replace("/login");
      router.refresh();
    }
  }

  function irParaFuncaoUsuario(route: string) {
    router.push(route);
  }

  function irParaFuncaoProfessor(chave: keyof typeof ROTAS.escola) {
    router.push(ROTAS[contexto][chave]);
  }

  const tituloTurmas = contexto === "igreja" ? "Classes" : "Turmas";

  return (
    <main
      className="min-h-screen bg-black text-white flex flex-col items-center text-center px-4"
      style={styleColors}
    >
      <header className="w-full max-w-6xl flex justify-end gap-5 py-3 text-xs font-semibold">
        <button
          onClick={() => router.push("/objetivos")}
          className="text-[var(--color-2)] bg-transparent border-none cursor-pointer"
          type="button"
        >
          Objetivos
        </button>

        <button
          onClick={() => router.push("/cadastro/atualizar?from=prof")}
          className="text-[var(--color-2)] bg-transparent border-none cursor-pointer"
          type="button"
        >
          Cadastro
        </button>

        <button
          onClick={handleLogout}
          className="text-[var(--color-2)] bg-transparent border-none cursor-pointer"
          type="button"
        >
          Logout
        </button>
      </header>

      <h1
        className="text-[2.4rem] sm:text-5xl font-semibold mt-6 mb-2 py-3"
        style={{
          background:
            "radial-gradient(circle, var(--color-1), var(--color-2), var(--color-5))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Bravoo
      </h1>

      <section className="w-full flex flex-col items-center mt-4">
        <h2
          className="text-[1.8rem] sm:text-4xl font-semibold mb-6 py-3 w-full max-w-[500px]"
          style={{
            background:
              "radial-gradient(circle, var(--color-1), var(--color-2), var(--color-5))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Funções do Usuário
        </h2>

        <div className="w-[90%] max-w-[320px] flex flex-col gap-5">
          {funcoesUsuario.map((item) => (
            <button
              key={item.label}
              onClick={() => irParaFuncaoUsuario(item.route)}
              className={`${item.className} text-white text-lg font-semibold rounded-[14px] px-5 py-[14px] shadow-md transition-transform hover:scale-105 border-none cursor-pointer`}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="w-full flex flex-col items-center mt-10">
        <h2
          className="text-[1.8rem] sm:text-4xl font-semibold mb-5 py-3 w-full max-w-[500px]"
          style={{
            background:
              "radial-gradient(circle, var(--color-1), var(--color-2), var(--color-5))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Escolha sua Instituição
        </h2>

        <div className="mb-6 inline-flex overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <button
            type="button"
            onClick={() => trocarContexto("escola")}
            className={`px-4 py-2 text-sm font-semibold min-w-[120px] transition border-none cursor-pointer ${
              contexto === "escola"
                ? "text-black"
                : "text-white/80 hover:text-white bg-transparent"
            }`}
            style={
              contexto === "escola"
                ? {
                    background:
                      "linear-gradient(90deg, var(--color-3), var(--color-2))",
                  }
                : undefined
            }
          >
            🏫 Escola
          </button>

          <button
            type="button"
            onClick={() => trocarContexto("igreja")}
            className={`px-4 py-2 text-sm font-semibold min-w-[120px] transition border-none cursor-pointer ${
              contexto === "igreja"
                ? "text-black"
                : "text-white/80 hover:text-white bg-transparent"
            }`}
            style={
              contexto === "igreja"
                ? {
                    background:
                      "linear-gradient(90deg, var(--color-3), var(--color-2))",
                  }
                : undefined
            }
          >
            ⛪ Igreja
          </button>
        </div>

        <div className="w-[90%] max-w-[320px] flex flex-col gap-5 mb-12">
          <button
            onClick={() => irParaFuncaoProfessor("turmas")}
            className="bg-[var(--color-2)] text-white text-lg font-semibold rounded-[14px] px-5 py-[14px] shadow-md transition-transform hover:scale-105 border-none cursor-pointer"
            type="button"
          >
            {tituloTurmas}
          </button>

          <button
            onClick={() => irParaFuncaoProfessor("questoes")}
            className="bg-[var(--color-4)] text-white text-lg font-semibold rounded-[14px] px-5 py-[14px] shadow-md transition-transform hover:scale-105 border-none cursor-pointer"
            type="button"
          >
            Questões
          </button>

          <button
            onClick={() => irParaFuncaoProfessor("listas")}
            className="bg-[var(--color-5)] text-white text-lg font-semibold rounded-[14px] px-5 py-[14px] shadow-md transition-transform hover:scale-105 border-none cursor-pointer"
            type="button"
          >
            Listas
          </button>

          <button
            onClick={() => irParaFuncaoProfessor("relatorios")}
            className="bg-[var(--color-7)] text-white text-lg font-semibold rounded-[14px] px-5 py-[14px] shadow-md transition-transform hover:scale-105 border-none cursor-pointer"
            type="button"
          >
            Relatórios
          </button>
        </div>

        {loadingContexto && (
          <p className="text-sm text-white/60 mb-8">Carregando contexto…</p>
        )}
      </section>
    </main>
  );
}