# AGENTS.md — Supp

> Contrato curto para qualquer agente que trabalhe neste repositório.
> O plano completo está em `projetos-pasaporte/docs/planejamento-2026-11/` (institucional, fora do git).

## 1. O que é o Supp

Plataforma de jogos de sala + cockpit de aula. O professor abre `/professor` no notebook e controla
`/tela` (TV) via Supabase Realtime. O conteúdo institucional (aulas, turmas, relatórios) fica em
`projetos-pasaporte/`, **gitignored**; nunca commitar essa pasta, `.env.local` ou segredos.

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (Realtime +
Postgres), motion/react, canvas-confetti. Deploy: Vercel (`main` → https://www.supp.lol).

## 2. Comandos

```bash
npm run dev                 # local
npx tsc --noEmit            # tipos
npm run build               # build de produção (obrigatório antes de commit)
npm run start -- -p 3000    # servir build
npx eslint .                # lint (configuração atual ignora no build)
```

Testes E2E (quando existirem): `npx playwright test`.
Migração/seeds: `node scripts/<script>.mjs` (sempre dry-run primeiro).

## 3. Rotas

| Rota | Papel |
|---|---|
| `/professor` | cockpit do professor + painel |
| `/professor/biblioteca` | biblioteca/banco de aulas |
| `/professor/historico` | histórico |
| `/tela` | telão (`?c=<CODE>`) |
| `/host`, `/join` | Live (compatibilidade) |
| `/` | jogos avulsos |

- `/aula` → `/professor` e `/tv` → `/tela` por redirect 308 (preservar query).
- Nunca criar links/QR novos para `/aula` ou `/tv`.
- Gate do professor: `AUL41` (client-side). O código da sessão fica sempre visível.

## 4. Modelo de conteúdo (regra central)

- **Conteúdo** (`pp_content`): aula canônica, reutilizável, com slides de ID estável e versão.
- **Ocorrência** (`pp_occurrences`): esta aula nesta turma nesta data; tem status, código de sessão,
  snapshot e link para o class report.
- **Snapshot**: conteúdo resolvido e congelado quando a aula é dada. **Aula dada é somente leitura.**
- **Overrides**: `global` (nova versão do conteúdo), `class` (sempre nesta turma), `occurrence`
  (só esta aula). Precedência: snapshot → conteúdo → global → class → occurrence.

### Regra local x global (obrigatória)

> **Toda edição de slide/bloco deve perguntar:** “Só esta aula desta turma (local) ou todas as aulas
> deste conteúdo (global)?”
>
> - Se o pedido não especificar, **pare e pergunte**. Nunca assuma global.
> - Edição global **não** altera snapshots de aulas já dadas.
> - Aula dada só muda com a ação explícita **“corrigir registro”**, com confirmação e auditoria.
> - Exemplo: o bloco “Relembrando a Aula 1” da P1 A2 é **local da C2-08**; o conteúdo canônico não
>   o contém.

## 5. Jogos

- Roleta, Passa Repassa, D20, Competição e Live devem rodar **no palco único** `/tela`, controlados
  pelo `/professor`, sem segunda aba e sem iframe (CSP bloqueia).
- Roleta: clique na roleta **na `/tela`** gira; setup com nº de rodadas (vazio = infinito).
- Estado do jogo é snapshot no professor; TV restaura no F5/reconexão; `hello` → `state`.
- Usar os componentes reais (animações completas), não overlays simplificados.

## 6. UI

- **Cursor escondido** em todas as telas; visível apenas em `input`, `textarea`, `select`,
  `[contenteditable]` e controles nativos que precisam. Toggle de acessibilidade.
- Slides em 16:9 com unidades `cqw`; prévia do professor = TV.
- Textos longos na colinha (minimizável), nunca na TV.
- `teacherNote` nunca vai para a TV.
- Tabelas: renderizar em grid (não `<table>`), terminar no último item.
- Professor não tem o livro em mãos: todo conteúdo (regras, textos, falas) no roteiro/colinha.

## 7. Estilo de código

- TypeScript estrito; evitar `any`; preferir tipos discriminados.
- Componentes cliente só quando necessário (`'use client'`).
- Tailwind com tokens do tema (`var(--surface)`, `var(--ink)`, `var(--accent)`).
- Funções puras para regras (agenda, resolução, próxima aula) + testes.
- Sem `console.log` de debug; erros tratados com estados de UI.
- Comentários curtos explicando o “porquê”, não o “o quê”.

## 8. Segurança

- **Sempre:** validar entrada em rotas server-side; usar service role só no servidor; manter RLS.
- **Perguntar antes:** mudanças de schema, novas dependências, alterações de CSP/headers.
- **Nunca:** commitar `.env.local`, segredos, `projetos-pasaporte/`, dados de alunos; expor
  `PASSAPORTE_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY` ou `CRON_SECRET` no cliente.
- `pp_reports.raw` é server-only; o cliente recebe apenas campos derivados.

## 9. Verificação (Definition of Done)

- [ ] Critérios de aceite da tarefa atendidos.
- [ ] `npx tsc --noEmit` e `npm run build` verdes.
- [ ] Teste unitário/E2E quando aplicável.
- [ ] Local/global perguntado (se edição de conteúdo).
- [ ] Nenhum snapshot de aula dada alterado sem “corrigir registro”.
- [ ] Rotas novas; nenhum link novo para `/aula`/`/tv`.
- [ ] Cursor/inputs e reconexão da TV testados quando afetados.
- [ ] Commit pequeno, mensagem convencional, referência à tarefa.
- [ ] Docs/spec atualizados quando a decisão mudar.

## 10. Uso de IA

- Spec antes de código para mudanças > 30 min.
- Context pack de até 8 arquivos; não despejar o repositório inteiro.
- Subagentes: `explore` para mapear, `general` para implementar, revisor separado, QA separado.
- Worktrees para trilhas paralelas; copiar `.env.local` e `projetos-pasaporte/` para teste (ou testar
  no diretório principal).
- O implementador não revisa o próprio diff; o revisor não corrige; o QA não altera código.
- Se faltar uma skill, usar `npx skills find "<tema>"` e avaliar reputação/instalações.

## 11. Onde está o plano

- `projetos-pasaporte/docs/planejamento-2026-11/00-INDICE.md`
- `01-SPEC-PRODUTO.md`, `02-ARQUITETURA-E-DADOS.md`
- `03-PLANO-E-BACKLOG.md`, `04-PROTOCOLO-IA.md`
- Preferências vivas: `projetos-pasaporte/PREFERENCIAS-PROFESSOR.md`
