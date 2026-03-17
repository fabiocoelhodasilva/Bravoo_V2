"use client";

import { useRouter } from "next/navigation";
import { CadastroForm } from "@/components/auth/CadastroForm";
import { cadastrarUsuario } from "@/lib/auth/auth-service";
import BrandLogo from "@/components/ui/BrandLogo";

export default function CadastroPage() {
  const router = useRouter();

  async function handleCadastro(values: {
    nome: string;
    email: string;
    senha: string;
  }) {
    await cadastrarUsuario(values);

    router.push("/login?cadastro=sucesso");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[460px]">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo />
          </div>

          <p className="text-[#cfcfcf] mt-2 text-[0.95rem]">
            Crie sua conta para acessar a plataforma.
          </p>
        </div>

        <CadastroForm onSubmit={handleCadastro} />

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="block mx-auto mt-6 text-[#e9891d] text-[0.95rem] font-semibold bg-transparent border-none cursor-pointer"
        >
          Voltar 
        </button>
      </div>
    </main>
  );
}