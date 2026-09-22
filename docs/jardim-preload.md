# Preload da posição no Jardim

## Antes e depois

Antes, `GardenScene` iniciava `buscarPontuacaoJardim` ao montar. Essa Server Action
autentica a conta, resolve o perfil e consulta as datas das joias espirituais na
janela existente: até 11 dias anteriores mais hoje, limitada ao cadastro e início
da regra. O algoritmo aplica os avanços/retrocessos existentes. Não usa RPC.
O mapa transforma a pontuação em posição com `getProgressoCaminhada` e
`REQUISITO_FLORES`, em `jardins-config.ts`.

Agora, após terminar o carregamento inicial do dashboard, um efeito agenda
`requestIdleCallback`, ou `setTimeout(1000)` quando indisponível. Importa o pequeno
cliente de estado sob demanda e prepara `/jardim` com `router.prefetch`.
O preload não monta componentes do Jardim nem solicita imagens, calendário,
orações ou progresso mensal/anual. Falhas não aparecem na Home.

`buscarEstadoJardim` reutiliza integralmente `buscarPontuacaoJardim`, devolvendo
apenas `{ pontuacao, hoje }`. A pontuação já é a entrada suficiente do mapa;
nomes, limites e desbloqueios continuam no código existente, sem outra regra.
Conta e perfil solicitados são comparados à sessão validada antes da consulta.

## Cache e invalidação

- Map em memória do navegador, indexado por **conta + perfil**. Não há cache
  compartilhado de dados de alunos no servidor, nova biblioteca ou persistência
  da posição em localStorage.
- Validade de 10 minutos; também expira na virada do dia em America/Sao_Paulo.
- Um segundo Map compartilha consultas em andamento entre Home e Jardim.
- `GardenScene` lê o cache no estado inicial. Cache válido evita nova action;
  pedido em andamento é reutilizado. Sem cache, acesso direto/F5/nova aba usa
  a mesma action normalmente. F5 e nova aba começam com memória vazia.
- O ponto central `limparCachesDePerfil` emite um evento que limpa a memória em
  logout/troca de sessão/perfil. Respostas anteriores à limpeza são descartadas.
- Atualização após oração invalida antes de recalcular. O evento existente de
  joia também invalida. Um sinal sem dados pessoais em localStorage comunica
  invalidação às outras abas; se o armazenamento estiver bloqueado, o TTL permanece.
- Não há polling enquanto o Jardim permanece aberto. Invalidações por oração,
  joia e sinal de outra aba avisam o Jardim para reutilizar a consulta existente.
  Voltar à aba verifica o cache e só consulta se estiver ausente ou vencido.
  Um temporizador agenda somente a próxima virada de data em America/Sao_Paulo;
  se a aba estiver oculta, a consulta aguarda seu retorno. Falhas da atualização
  silenciosa preservam o mapa já mostrado e permitem nova tentativa.
- O preload da Home é único por montagem/identidade; ficar mais de 10 minutos
  nela pode expirar a posição antes do clique. Nesse caso há consulta normal.

## Consultas: contagem estática do código

Contagens abaixo são de SELECTs, não de chamadas HTTP totais. Não incluem as
validações adicionais do middleware, AuthProvider, Supabase Auth, nem consultas
próprias do dashboard, que continuam existindo.

| Operação | Antes | Depois |
| --- | --- | --- |
| Descobrir posição, conta com perfis vinculados | 1 SELECT de perfis + 1 de joias ao entrar | Os mesmos 2 no idle; 0 na entrada com cache válido |
| Descobrir posição, login legado | 2 SELECTs de perfis + 1 de joias ao entrar | Os mesmos 3 no idle; 0 na entrada com cache válido |
| Posição sem preload, expirado ou acesso direto | 2 SELECTs (3 no legado) | Igual |
| Resumo de oração ao abrir Jardim | 5 SELECTs | 5 SELECTs |
| Progresso mensal + anual ao abrir Jardim | 4 SELECTs | 4 SELECTs |

Assim, no caminho usual vinculado, eram **11 SELECTs** no carregamento do Jardim;
com preload válido, são **2 antecipados + 9 na entrada**, sem repetir os 2 da
posição. Não é uma redução da soma na primeira visita: é antecipação do trabalho
que impedia mostrar a posição. Não há consultas periódicas por expiração do TTL;
a revalidação acontece nos eventos descritos acima, incluindo a virada do dia.
Cada action também autentica via `getUser`; o prefetch da rota atravessa o
middleware, podendo acrescentar autenticação e SELECT de perfis antes do clique.

O carregador anterior já deduplicava pedidos por instância. Havia sobreposição
de períodos entre resumo de oração, progresso mensal/anual e pontuação (sessões
e joias), mas atendem saídas distintas. Isso foi preservado nesta etapa para não
ampliar o escopo. O novo cache evita duplicação Home → Jardim da posição.

## Arquivos desta etapa

- `components/home/StudentDashboard.tsx`: agendamento idle e prefetch, preservando
  alterações visuais existentes no workspace.
- `components/jardim/GardenScene.tsx`: leitura imediata, fallback, invalidação e
  rechecagem silenciosa do estado.
- `lib/gamificacao/jardim/jardim-pontuacao-actions.ts`: resposta compacta e
  conferência de identidade; algoritmo de pontuação preservado.
- `lib/gamificacao/jardim/jardim-estado-client.ts`: cache compartilhado e deduplicação.
- `lib/perfis/perfil-client.ts`: sinal de limpeza para caches em memória.
- `tests/jardim-estado.test.cjs`: cache, isolamento, expiração, falhas, invalidação
  concorrente e identidade validada na action.
- Este documento.

## Outros gargalos e segunda etapa

Os mapas PNG têm 2.979.866 bytes (celular) e 2.879.930 bytes (desktop).
Download/decodificação podem atrasar a imagem, independentemente da posição.
Não foram alterados ou pré-carregados na Home. Sem medição autenticada no navegador,
não é possível atribuir parte dos 3 segundos relatados a essas imagens.

Não recomendo materializar `usuario_jardim_estado` agora: a consulta da regra já
é limitada a uma janela curta. Primeiro medir latência real, consultas auxiliares
e plano/índices da consulta existente. Materialização exigiria atualização também
na virada do dia, mesmo sem oração, para preservar o retrocesso atual.

Nenhum layout, imagem, regra, RPC, tabela ou migration foi alterado. Não foram
adicionados arquivos loading nem logs de desempenho em produção.

## Validação

- 8 testes do estado, 4 testes existentes do carregador e 15 testes de perfis
  aprovados (27 no total, executados em rodadas por suíte). A revisão cobre TTL
  de dez minutos, limite pela data de São Paulo e notificações de invalidação.
- TypeScript sem erros após remoção de `.next/dev/types/validator.ts`, arquivo
  gerado que continha trechos duplicados/malformados. Nenhuma configuração de
  tipos foi relaxada para contornar o problema.
- ESLint sem erros; aviso existente de imagem `<img>` na Home permanece.
- O primeiro build falhou por conexão ao Google Fonts; repetição com acesso
  ampliado compilou e gerou as 34 páginas.
- A ferramenta de navegador não iniciou (`sandboxPolicy` ausente). Portanto,
  não foram medidos tempos autenticados de Home/clique/mapa; as contagens acima
  vêm do código e os testes usam respostas controladas, sem gravações no banco.

O prefetch usa a API pública do App Router:
[Next.js — useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router).
