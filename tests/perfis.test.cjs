const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { NextRequest, NextResponse } = require("next/server");

function carregar(arquivo, mocks = {}, extras = {}) {
  const codigo = ts.transpileModule(readFileSync(resolve(__dirname, "..", arquivo), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const contexto = { exports: {}, Error, Date, Set, Map, Intl, Promise, console,
    process: { env: { NODE_ENV: "test" } },
    require(nome) { assert.ok(nome in mocks, `Dependência inesperada: ${nome}`); return mocks[nome]; }, ...extras };
  vm.runInNewContext(codigo, contexto);
  return contexto.exports;
}
const core = carregar("lib/perfis/perfis-core.ts");
const FABIO = "b172f971-7b1c-4183-b790-ec6aafae4b9c";
const REBECA = "05848711-dfde-4fae-86dc-b2f1f922bb52";
const ELON = "dd862552-5469-442b-b9af-db8df1004140";
const ESTER = "0360cb73-0f43-4ed1-b7f0-4b03dd67b08a";
const OUTRO = "99999999-9999-4999-8999-999999999999";
const perfis = [[FABIO, "Fabio"], [REBECA, "Rebeca"], [ELON, "Elon"], [ESTER, "Ester"]]
  .map(([id, nome]) => ({ id, nome, conta_id: FABIO, email: null, criado_em: "2026-09-01", data_nascimento: null, ano_escolar_id: null }));

function ambiente(contaId = FABIO, cookie, falha = false) {
  const chamadas = [];
  const supabase = { from(tabela) {
    assert.equal(tabela, "usuarios_next");
    let resultado = perfis;
    const consulta = {
      select() { return consulta; },
      eq(campo, valor) { chamadas.push([campo, valor]); resultado = resultado.filter((item) => item[campo] === valor); return consulta; },
      async order() { return { data: resultado, error: falha ? new Error("offline") : null }; },
      async maybeSingle() { return { data: resultado[0] ?? null, error: null }; },
    };
    return consulta;
  } };
  const servidor = carregar("lib/perfis/perfil-server.ts", {
    "server-only": {}, "./perfis-core": core,
    "next/headers": { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined }) },
    "@/lib/auth/require-auth": { requireAuth: async () => {
      if (!contaId) throw new Error("UNAUTHORIZED");
      return { supabase, user: { id: contaId, created_at: "2026-09-01" } };
    } },
  });
  const api = carregar("app/api/perfil/route.ts", {
    "next/server": { NextResponse }, "@/lib/perfis/perfis-core": core,
    "@/lib/perfis/perfil-server": servidor,
  });
  return { supabase, chamadas, servidor, api };
}
function request(method, body, origin = "http://localhost:3000") {
  return new NextRequest("http://localhost:3000/api/perfil", {
    method, headers: { origin, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test("conta Fabio lista os quatro perfis e exige seleção", async () => {
  const app = ambiente();
  const response = await app.api.GET();
  const dados = await response.json();
  assert.deepEqual(dados.perfis.map((perfil) => perfil.nome), ["Fabio", "Rebeca", "Elon", "Ester"]);
  assert.equal(dados.perfilAtivo, null);
  assert.deepEqual(app.chamadas, [["conta_id", FABIO]]);
});

test("selecionar Rebeca grava cookie HttpOnly e o refresh preserva seu UUID", async () => {
  const response = await ambiente().api.POST(request("POST", { perfilId: REBECA }));
  assert.equal(response.status, 200);
  const cookie = response.cookies.get(core.PERFIL_COOKIE);
  assert.ok(response.headers.get("set-cookie").includes("HttpOnly"));
  assert.ok(response.headers.get("set-cookie").includes("SameSite=lax"));
  const contexto = await ambiente(FABIO, cookie.value).servidor.requirePerfil();
  assert.equal(contexto.contaId, FABIO);
  assert.equal(contexto.perfilId, REBECA);
  assert.equal(contexto.perfil.nome, "Rebeca");
});

test("troca de Rebeca para Elon mantém a conta e muda somente o perfil", async () => {
  const response = await ambiente(FABIO, core.serializarPerfil(FABIO, REBECA)).api.POST(request("POST", { perfilId: ELON }));
  const contexto = await ambiente(FABIO, response.cookies.get(core.PERFIL_COOKIE).value).servidor.requirePerfil();
  assert.equal(contexto.conta.id, FABIO);
  assert.equal(contexto.perfilId, ELON);
});

test("logout apaga o cookie e executa limpeza antes do signOut", async () => {
  const response = await ambiente().api.DELETE(request("DELETE"));
  assert.equal(response.cookies.get(core.PERFIL_COOKIE).maxAge, 0);
  const ordem = [];
  const storage = { cache_dashboard_mandala_principal: "anterior", preferencia: "preservar",
    removeItem(chave) { delete this[chave]; } };
  const cliente = carregar("lib/perfis/perfil-client.ts", {
    "@/lib/supabase/client": { supabase: { auth: { signOut: async () => { ordem.push("signOut"); return { error: null }; } } } },
  }, { sessionStorage: storage, fetch: async () => { ordem.push("limparCookie"); return { ok: true }; } });
  await cliente.encerrarSessao();
  assert.deepEqual(ordem, ["limparCookie", "signOut"]);
  assert.equal(storage.cache_dashboard_mandala_principal, undefined);
  assert.equal(storage.preferencia, "preservar");
});

test("login legado de Rebeca seleciona somente o próprio perfil", async () => {
  const app = ambiente(REBECA);
  const contexto = await app.servidor.requirePerfil();
  assert.equal(contexto.legado, true);
  assert.equal(contexto.perfilId, REBECA);
  assert.deepEqual(app.chamadas, [["conta_id", REBECA], ["id", REBECA]]);
  assert.equal((await app.api.POST(request("POST", { perfilId: ELON }))).status, 403);
});

test("cookie ou POST de outra família é recusado, mesmo com contaId forjado", async () => {
  const app = ambiente(FABIO, core.serializarPerfil(FABIO, OUTRO));
  await assert.rejects(app.servidor.requirePerfil(), /PERFIL_NAO_SELECIONADO/);
  assert.equal((await app.api.POST(request("POST", { perfilId: OUTRO }))).status, 403);
  assert.equal(core.resolverPerfilAtivo(OUTRO, perfis, core.serializarPerfil(FABIO, REBECA)), null);
  assert.equal(core.resolverPerfilAtivo(FABIO, perfis, "cookie inválido"), null);
});

test("sessão encerrada limpa o cookie; erro de banco não vira fallback autorizado", async () => {
  const response = await ambiente(null).api.GET();
  assert.equal(response.status, 401);
  assert.equal(response.cookies.get(core.PERFIL_COOKIE).maxAge, 0);
  const app = ambiente(FABIO, undefined, true);
  assert.equal((await app.api.GET()).status, 503);
  assert.deepEqual(app.chamadas, [["conta_id", FABIO]]);
});

test("seleção e limpeza não aceitam chamadas de outra origem", async () => {
  const app = ambiente();
  assert.equal((await app.api.POST(request("POST", { perfilId: REBECA }, "https://outra.example"))).status, 403);
  assert.equal((await app.api.DELETE(request("DELETE", undefined, "https://outra.example"))).status, 403);
  assert.equal(app.chamadas.length, 0);
});

test("metas: responsável altera o perfil dependente; login legado continua bloqueado", async () => {
  await assert.rejects(ambiente(REBECA).servidor.requireResponsavelMeta(), /responsável/);
  assert.equal((await ambiente(FABIO, core.serializarPerfil(FABIO, REBECA)).servidor.requireResponsavelMeta()).perfilId, REBECA);
  assert.equal((await ambiente(FABIO, core.serializarPerfil(FABIO, FABIO)).servidor.requireResponsavelMeta()).perfilId, FABIO);
});

test("API de atividades grava o UUID original da Rebeca, nunca o UUID enviado no corpo", async () => {
  let payload;
  const supabase = { from: () => ({ insert: (valor) => {
    payload = valor;
    return { select: () => ({ single: async () => ({ data: { id: "sessao", ...valor }, error: null }) }) };
  } }) };
  const api = carregar("app/api/sessoes/route.ts", {
    "next/server": { NextResponse },
    "@/lib/perfis/perfil-server": { requirePerfil: async () => ({ supabase, contaId: FABIO, perfilId: REBECA }) },
    "@/lib/gamificacao/geral/gamificacao-actions": { processarGamificacaoAposAtividade: async (params) => { assert.equal(params.usuarioId, REBECA); return {}; } },
    "@/lib/gamificacao/geografia/geografia-joias-actions": { concederJoiaGeografia: async () => ({}) },
    "@/lib/gamificacao/matematica/tabuada-joias-actions": { concederJoiaTabuada: async () => ({}) },
  });
  const response = await api.POST(request("POST", { atividade_id: "atividade", materia_id: "materia", usuario_id: FABIO, perfilId: OUTRO }));
  assert.equal(response.status, 200);
  assert.equal(payload.usuario_id, REBECA);
});

test("RPC de oração envia o perfil dependente e recusa seleção desatualizada", async () => {
  const app = ambiente(FABIO, core.serializarPerfil(FABIO, REBECA));
  const chamadas = [];
  app.supabase.rpc = async (nome, args) => {
    chamadas.push({ nome, args });
    return { data: null, error: { message: "erro controlado da RPC" } };
  };
  const actions = carregar("lib/gamificacao/oracao/oracao-actions.ts", {
    "@/lib/perfis/perfil-server": app.servidor,
    "@/lib/supabase/server": {},
    "@/lib/gamificacao/geral/joia-actions": {},
  });
  await assert.rejects(actions.alterarMetaOracao(15, REBECA), /erro controlado/);
  assert.deepEqual(JSON.parse(JSON.stringify(chamadas)), [{
    nome: "fn_alterar_meta_usuario",
    args: { p_usuario_id: REBECA, p_materia_id: "a9f1c2b3-7e44-4d11-9f6a-3c2b8e7d1111", p_nova_meta: 15 },
  }]);
  await assert.rejects(actions.alterarMetaOracao(15, ELON), /perfil selecionado mudou/);
  await assert.rejects(actions.alterarMetaOracao(1.5, REBECA), /meta deve/);
  assert.equal(chamadas.length, 1);
});

test("RPC de tabuada envia perfil validado e bloqueia legado e perfil divergente", async () => {
  let contexto = { contaId: FABIO, perfis, perfilAtivo: perfis[1], legado: false };
  const chamadas = [];
  const supabase = { rpc: async (nome, args) => {
    chamadas.push({ nome, args });
    return { data: null, error: new Error("erro controlado da RPC") };
  } };
  const actions = carregar("lib/gamificacao/matematica/tabuada-joias-actions.ts", {
    "@/lib/perfis/perfil-client": { obterContextoPerfis: async () => contexto },
    "@/lib/perfis/perfis-core": core,
  });
  await assert.rejects(actions.alterarMetaTabuada({ supabase, usuarioId: REBECA, tabuadas: [3, 2, 3] }), /erro controlado/);
  assert.deepEqual(JSON.parse(JSON.stringify(chamadas)), [{
    nome: "fn_alterar_meta_tabuada", args: { p_usuario_id: REBECA, p_tabuadas: [2, 3] },
  }]);
  await assert.rejects(actions.alterarMetaTabuada({ supabase, usuarioId: ELON, tabuadas: [2] }), /responsável/);
  contexto = { contaId: REBECA, perfis: [perfis[1]], perfilAtivo: perfis[1], legado: true };
  await assert.rejects(actions.alterarMetaTabuada({ supabase, usuarioId: REBECA, tabuadas: [2] }), /responsável/);
  assert.equal(chamadas.length, 1);
});

test("criação usa a conta autenticada e deixa o banco gerar o UUID", async () => {
  let payload;
  const action = carregar("app/perfis/novo/actions.ts", {
    "@/lib/perfis/perfil-server": { obterContextoPerfisServidor: async () => ({
      contaId: FABIO, legado: false,
      supabase: { from: (tabela) => {
        assert.equal(tabela, "usuarios_next");
        return { insert: (dados) => {
          payload = dados;
          return { select: () => ({ single: async () => ({ data: { id: OUTRO }, error: null }) }) };
        } };
      } },
    }) },
  });
  assert.equal((await action.criarPerfil({ nome: "  Novo perfil  ", conta_id: OUTRO, id: FABIO })).perfilId, OUTRO);
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), { nome: "Novo perfil", data_nascimento: null, conta_id: FABIO });
  await assert.rejects(action.criarPerfil({ nome: " " }), /Informe um nome/);
  await assert.rejects(action.criarPerfil({ nome: "Teste", dataNascimento: "2026-02-30" }), /data de nascimento/);
});

test("criação recusa login legado e sessão encerrada", async () => {
  for (const conta of [REBECA, null]) {
    const action = carregar("app/perfis/novo/actions.ts", {
      "@/lib/perfis/perfil-server": ambiente(conta).servidor,
    });
    await assert.rejects(action.criarPerfil({ nome: "Novo" }), /responsável|UNAUTHORIZED/);
  }
});

test("conta sem perfis pode acessar seleção sem receber perfil fictício", async () => {
  const contexto = await ambiente(OUTRO).servidor.obterContextoPerfisServidor();
  assert.equal(contexto.perfis.length, 0);
  assert.equal(contexto.perfilAtivo, null);
  assert.equal(contexto.legado, false);
});
