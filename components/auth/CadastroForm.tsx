"use client";

import { useState } from "react";

type Props = {
  onSubmit: (values: {
    nome: string;
    email: string;
    senha: string;
  }) => Promise<void>;
};

export function CadastroForm({ onSubmit }: Props) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState<{
    tipo: "erro" | "sucesso";
    texto: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nome.trim()) {
      setMensagem({ tipo: "erro", texto: "Informe seu nome." });
      return;
    }

    if (!email.trim()) {
      setMensagem({ tipo: "erro", texto: "Informe seu e-mail." });
      return;
    }

    if (senha.length < 6) {
      setMensagem({
        tipo: "erro",
        texto: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem({
        tipo: "erro",
        texto: "As senhas não coincidem.",
      });
      return;
    }

    try {
      setSaving(true);
      setMensagem({ tipo: "sucesso", texto: "Criando conta..." });

      await onSubmit({
        nome: nome.trim(),
        email: email.trim(),
        senha,
      });
    } catch (error: any) {
      const texto =
        error?.message || "Não foi possível concluir o cadastro.";

      setMensagem({
        tipo: "erro",
        texto,
      });

      setSaving(false);
    }
  }

  return (
    <section
      className="bg-[#111] border border-[#333] rounded-[20px] p-5"
      style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.28)" }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className="text-[0.92rem] text-[#ddd]">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="w-full px-3 py-3 rounded-[12px] border border-[#444] bg-black text-white text-[0.95rem] outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[0.92rem] text-[#ddd]">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@email.com"
            className="w-full px-3 py-3 rounded-[12px] border border-[#444] bg-black text-white text-[0.95rem] outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="senha" className="text-[0.92rem] text-[#ddd]">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full px-3 py-3 rounded-[12px] border border-[#444] bg-black text-white text-[0.95rem] outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="confirmarSenha"
            className="text-[0.92rem] text-[#ddd]"
          >
            Confirmar senha
          </label>
          <input
            id="confirmarSenha"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Digite a senha novamente"
            className="w-full px-3 py-3 rounded-[12px] border border-[#444] bg-black text-white text-[0.95rem] outline-none"
          />
        </div>

        {mensagem && (
          <div
            className="text-[0.88rem] font-medium"
            style={{
              color: mensagem.tipo === "erro" ? "#ff7c7c" : "#5dc6a1",
            }}
          >
            {mensagem.texto}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-[14px] py-3 font-extrabold text-white border-none cursor-pointer transition"
          style={{
            background: "#e9891d",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Cadastrando..." : "Criar conta"}
        </button>
      </form>
    </section>
  );
}