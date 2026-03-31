import { supabase } from "@/lib/supabase/client";

export async function cadastrarUsuario(params: {
  nome: string;
  email: string;
  senha: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.senha,
    options: {
      data: {
        nome: params.nome,
      },
    },
  });

  if (error) {
    throw new Error(traduzirErroAuth(error.message));
  }

  if (!data.user) {
    throw new Error("Não foi possível criar o usuário.");
  }

  return data.user;
}

function traduzirErroAuth(message: string) {
  const msg = message.toLowerCase();

  if (msg.includes("user already registered")) {
    return "Este e-mail já está cadastrado.";
  }

  if (msg.includes("password")) {
    return "Senha inválida. Use pelo menos 6 caracteres.";
  }

  if (msg.includes("email")) {
    return "E-mail inválido.";
  }

  return "Não foi possível concluir o cadastro.";
}