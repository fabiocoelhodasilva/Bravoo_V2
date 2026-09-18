# Contas e perfis — primeira etapa

## Diagnóstico inicial

A autenticação já utilizava `@supabase/ssr`, cookies Supabase, `AuthContext`, middleware e `requireAuth`. O login direcionava diretamente a `/aluno`. A maioria das consultas individuais buscava `auth.getUser().id` ou `getSession().user.id`. Livros e objetivos consumiam `useAuth().user`. A API de sessões derivava `usuario_id` diretamente da conta autenticada.

O middleware anterior protegia apenas parte das páginas. O dashboard chamava `get_student_dashboard_resumo` sem receber um ID de perfil. Alguns caches de joias/Jardim usavam chaves sem identificação do jogador. As RPCs de alteração de metas também não recebiam perfil.

## Arquitetura implementada

- **Conta:** autenticação Supabase, `requireAuth`, professor e sessão. `useAuth().user` continua sendo a conta, para não disfarçar um perfil como usuário do Supabase Auth.
- **Perfil:** registro de `usuarios_next`, consultado por uma camada central. `useAuth().perfilAtivo` e `perfilAtivoId` são as identidades para dados individuais.
- **Persistência:** cookie de sessão `bravoo_perfil_ativo`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` em produção. Contém `{ contaId, perfilId }`. Não contém token de autenticação, senha ou autorização independente.
- **Validação:** o servidor autentica a conta e consulta os perfis permitidos antes de aceitar o cookie. Modificar seu UUID não concede acesso a outra família. Ações de servidor e `/api/sessoes` repetem a validação, sem depender apenas de middleware ou UI.
- **RLS:** permanece ativa, usando o cliente normal e a sessão da conta. Nenhum `service_role`, bypass, alteração de tabela/policy ou migração de histórico foi introduzido.
- **Seleção:** `/perfis` apresenta os perfis em cards responsivos. Login passa pelo roteamento central `/`. Um único perfil pode ser escolhido automaticamente; múltiplos sem seleção vão para `/perfis`.
- **Troca:** link `Trocar perfil` no cabeçalho do dashboard. A rota limpa a seleção; escolher outro perfil grava o cookie validado e abre `/aluno` com uma nova árvore de componentes.
- **Caches:** caches de dados da Bravoo em sessionStorage e promises da camada de perfis são descartados na troca/logout. A navegação completa descarta estados em memória dos jogos e do Jardim. Outras abas recebem um evento e recarregam; retornar a uma aba também revalida o perfil. O aviso de mandala do dashboard agora usa uma chave por perfil.
- **Logout/expiração:** os pontos de logout usam `encerrarSessao`, que limpa o cookie antes de `signOut`. O provider observa término da sessão; middleware e API removem o cookie quando não há conta autenticada.
- **Falhas:** erro de consulta não é interpretado como ausência de perfis nem autoriza fallback para o ID do responsável.

## Compatibilidade legada

1. Consultar `usuarios_next.conta_id = conta autenticada`.
2. Apenas se a consulta terminar com sucesso e retornar zero registros, consultar `usuarios_next.id = conta autenticada`.
3. Se existir esse registro, ele é o único perfil permitido para o login legado, mesmo pertencendo agora à conta do responsável.
4. Não há fallback genérico para `auth.uid()` quando o perfil não existe.

Os UUIDs existentes são usados diretamente, inclusive o da Rebeca (`05848711-dfde-4fae-86dc-b2f1f922bb52`). Nenhum histórico foi copiado para a conta do Fabio.

## Classificação dos usos de identidade

| Pontos auditados | Classificação | Tratamento |
| --- | --- | --- |
| Login, cadastro, sessão, logout, `requireAuth` | CONTA | Mantidos no Supabase Auth; logout ganhou limpeza central. |
| `middleware`, `/`, `TeacherDashboard` e tabela `professores` | CONTA | Permissão de professor continua consultando a conta, sem depender de perfil infantil. |
| `StudentDashboard`, mandalas e resumos de Geografia/Matemática/Virtudes | PERFIL | Nome e joias usam perfil ativo. A RPC implícita do dashboard foi substituída por leitura explícita de joias filtrada pelo perfil. |
| Menus de Geografia/Matemática/Virtudes, respostas e histórico de virtudes | PERFIL | Adaptador central `buscarPerfilAtivo`, mantendo os fluxos e tratamento de erros existentes. |
| Multiplicação/tabuada, questões respondidas, metas consultadas | PERFIL | ID inicial do jogador vem do perfil ativo. |
| Livros e objetivos | PERFIL | Consomem `perfilAtivo` do contexto; ações de objetivos usam `requirePerfil`. |
| Meu Dia, tarefas e sincronização de joias | PERFIL | Leituras, gravações e parâmetros das funções individuais usam o perfil ativo validado. |
| Oração, Jardim e pontuação | PERFIL | `requirePerfil` no servidor e helper central no preload do cliente. O cadastro considerado é o do perfil; data da conta é fallback somente se `criado_em` estiver ausente. |
| `/api/sessoes`, joias, sequência e moedas após atividade | PERFIL | `usuario_id` é derivado do perfil validado no servidor, nunca de um UUID fornecido no corpo da requisição. |
| Instruções iniciais de Geografia | PERFIL | Tempo desde cadastro passa a usar `perfil.criado_em`. |
| Parâmetros históricos `usuarioId`, `usuario_id`, `p_usuario_id` | PERFIL | Os contratos existentes continuam recebendo o UUID do jogador. Não houve substituição global de nomes de colunas/assinaturas. |

Os usos restantes de `auth.getUser`, `getSession` e `user.id` no código TypeScript executável são de conta: autenticação central, provider, verificação de sessão da seleção, middleware e professor.

## Metas: novas assinaturas

Após a confirmação das novas assinaturas pelo responsável pelo banco, todas as chamadas passaram a enviar explicitamente o ID do perfil:

| RPC | Arquivo/função | Argumentos |
| --- | --- | --- |
| `fn_alterar_meta_usuario` | `lib/gamificacao/oracao/oracao-actions.ts`, `alterarMetaOracao` | `p_usuario_id: perfilId`, `p_materia_id`, `p_nova_meta` |
| `fn_alterar_meta_tabuada` | `lib/gamificacao/matematica/tabuada-joias-actions.ts`, `alterarMetaTabuada` | `p_usuario_id: perfilId`, `p_tabuadas` |

A conta responsável pode gerenciar os perfis vinculados; login legado permanece bloqueado. A rota `/responsavel/metas` permanece separada; a seleção de perfis não oferece mais acesso à gestão de metas. Oração e multiplicação não oferecem edição nas telas infantis. As operações verificam novamente o perfil selecionado antes de gravar, recusando uma seleção diferente da apresentada no formulário.

As funções SQL não foram alteradas. A validação do vínculo na RPC foi informada pelo usuário; não houve auditoria ou alteração remota. O histórico e a sincronização de joias existentes foram preservados.

## Validação

- `npx tsc --noEmit --incremental false`: aprovado.
- `npm run build` com `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`: aprovado, incluindo `/perfis`, `/api/perfil` e `/responsavel/metas`.
- `node --test tests/perfis.test.cjs tests/jardim-dados-client.test.cjs`: 16 testes aprovados.
- Testes usam respostas controladas, sem autenticar pessoas reais nem escrever no Supabase.
- Cobrem os quatro nomes/UUIDs informados, seleção da Rebeca, persistência após nova leitura, troca para Elon, exclusão do cookie e ordem de logout, fallback legado, cookie forjado, perfil estrangeiro, expiração, erro de banco, origem de requisições, autorização de metas do responsável e bloqueio legado e gravação de sessão no UUID da Rebeca.
- Os quatro testes anteriores do preload do Jardim continuam passando.
- ESLint da nova infraestrutura de perfis, provider, middleware e layouts: sem erros. Na verificação ampliada há sete erros preexistentes, confirmados no `HEAD`: `Date.now()` no render de Geografia e usos de `any` em multiplicação/RPCs de metas. Não foram feitas refatorações alheias para escondê-los.
- A ferramenta de navegador falhou na inicialização (`sandboxPolicy` ausente). Não foram executados logins reais de Fabio/Rebeca, nem verificação visual em dispositivos.

## Pendências para a próxima etapa

2. Validar em ambiente autenticado a visibilidade dos quatro perfis em `usuarios_next` e as policies/funções efetivamente instaladas. O esquema e as policies informados foram respeitados; sua configuração remota não foi alterada nem auditada integralmente.
3. Verificar as RPCs existentes de joias, mandalas, sequência e Meu Dia com um perfil dependente: o código passa o UUID correto; eventual validação SQL interna baseada apenas em `auth.uid()` também deverá aceitar o vínculo conta/perfil.
4. Executar o roteiro visual completo com contas reais: Fabio → Rebeca → refresh → Elon → logout → login legado, em desktop e celular.
5. Edição de perfis permanece fora desta etapa; a criação foi implementada.

## Referências de arquitetura

- [Supabase — getUser e validação da identidade no servidor](https://supabase.com/docs/reference/javascript/auth-getuser)
- [Next.js — autenticação e autorização em cada ponto de entrada](https://nextjs.org/docs/app/guides/authentication)

## Arquivos criados

- `lib/perfis/perfis-core.ts`
- `lib/perfis/perfil-server.ts`
- `lib/perfis/perfil-client.ts`
- `app/api/perfil/route.ts`
- `app/perfis/page.tsx`
- `tests/perfis.test.cjs`
- `docs/contas-e-perfis.md`

## Arquivos alterados

- `app/(app)/geografia/brasil/page.tsx`
- `app/(app)/geografia/europa/page copy.tsx`
- `app/(app)/layout.tsx`
- `app/(app)/livros/editar/page.tsx`
- `app/(app)/livros/novo/page.tsx`
- `app/(app)/livros/page.tsx`
- `app/(app)/meu-dia/novo/page.tsx`
- `app/(app)/meu-dia/page.tsx`
- `app/(app)/objetivos/novo/page.tsx`
- `app/(app)/objetivos/page.tsx`
- `app/(auth)/login/page.tsx`
- `app/actions/objetivos.ts`
- `app/api/sessoes/route.ts`
- `app/page.tsx`
- `components/gamification/GeografiaResumoDashboard.tsx`
- `components/gamification/MatematicaResumoDashboard.tsx`
- `components/gamification/StudentDashboard_Resumo.tsx`
- `components/gamification/VirtudesResumoDashboard.tsx`
- `components/geografia/GeografiaMenu.tsx`
- `components/geografia/GeografiaPaisesPage.tsx`
- `components/geografia/InstrucaoTemporaria.tsx`
- `components/home/StudentDashboard.tsx`
- `components/home/TeacherDashboard.tsx`
- `components/jardim/OracaoDashboardPanel.tsx`
- `components/matematica/MatematicaMenu.tsx`
- `components/matematica/MultiplicacaoPageView.tsx`
- `components/ui/Header.tsx`
- `components/virtudes/VirtudeDetalhes.tsx`
- `components/virtudes/VirtudeHistorico.tsx`
- `components/virtudes/VirtudeRespostaTexto.tsx`
- `components/virtudes/VirtudesMenu.tsx`
- `context/AuthContext.tsx`
- `lib/gamificacao/jardim/jardim-dados-client.ts`
- `lib/gamificacao/jardim/jardim-pontuacao-actions.ts`
- `lib/gamificacao/matematica/tabuada-joias-actions.ts`
- `lib/gamificacao/minhajornada/meu-dia-joias-actions.ts`
- `lib/gamificacao/oracao/oracao-actions.ts`
- `lib/gamificacao/oracao/oracao-dashboard-client.ts`
- `lib/objetivos/objetivos-service.ts`
- `middleware.ts`
- `tests/jardim-dados-client.test.cjs`


## Criação e entrada de perfis

- `/perfis/novo` solicita nome e nascimento opcional. Não há catálogo de anos escolares pronto no projeto, portanto esse campo não foi incluído.
- A action de criação autentica a conta, recusa login legado e insere em `usuarios_next` somente nome, nascimento e `conta_id` obtido no servidor. O UUID é gerado pelo banco.
- Após a criação, `definirPerfilAtivo` usa a API existente para validar a seleção e gravar o cookie; a navegação completa leva a `/aluno`. Se a seleção falhar, o formulário permite tentar novamente sem repetir a inserção.
- A seleção mostra “Você ainda não criou nenhum perfil” e “Criar primeiro perfil” para contas vazias, ou “+ Adicionar perfil” para contas com perfis. Login legado continua com sua entrada existente, sem oferecer criação de dependentes.
- O middleware protege também `/perfis/novo`. Login e roteamento existentes já encaminham contas vazias ou sem seleção válida para `/perfis` e perfis válidos para `/aluno`. O Header já oferece “Trocar perfil”.
- Dependências do banco: UUID padrão em `usuarios_next.id`; RLS permitindo INSERT com `conta_id = auth.uid()` e SELECT do registro criado; demais campos omitidos devem aceitar nulo ou ter padrão. Se houver chave estrangeira para `next_contas`, a conta responsável precisa existir nessa tabela. Nenhum SQL foi alterado.
