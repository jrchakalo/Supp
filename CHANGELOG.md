# Changelog

## [1.0.1] — 2026-11-13

### Segurança

- Sessão `httpOnly` assinada no gate do professor; APIs de edição, ocorrências, histórico e sync
  rejeitam chamadas sem sessão.
- Sync fail-closed (somente `CRON_SECRET` ou sessão), sem fallback de `Origin`, com rate limit.
- Leitura anon por coluna: `pp_classes.platform`, `pp_occurrences.notes` e `pp_content_versions`
  deixam de ser públicos.
- Validação de payload, limites de tamanho e erros 500 genéricos.

### Produto

- Sync automático ao abrir o cockpit + botão **Atualizar** na agenda com “Atualizado há X”.
- Código de sessão persistido por ocorrência; snapshot congelado no início da aula.
- Overrides `class` (“sempre nesta turma”), correção de registro auditada e versões globais com
  restauração.
- Planejar a partir da agenda abre a biblioteca já com turma/data.
- Histórico com todos os class reports, filtros de disciplina/período e relato.
- Biblioteca com duplicação, filtros de trilha/duração.
- Editor com rascunho local, versões e “Corrigir registro”.
- Botão de reconexão do telão e confirmação ao encerrar a aula.
- Flag `NEXT_PUBLIC_GAMES_V2` com rollback e seed idempotente de teste.

### Qualidade

- 17 testes unitários, smoke E2E 17/17 em 1366×768 e 1920×1080.
- Acessibilidade: foco/labels, nomes acessíveis e contraste; CSP/HSTS mantidos.

## [1.0.0] — 2026-11-13

Primeira versão completa do cockpit de aulas e do palco único.

### Adicionado

- **Rotas novas**: `/professor` (cockpit) e `/tela` (telão), com redirects permanentes de `/aula`
  e `/tv` preservando a query.
- **Sessão de aula**: código visível, heartbeat, reconexão automática da TV, snapshot local e
  retomada no F5.
- **Agenda semanal** (seg–dom) com folgas de sexta e domingo, próxima aula, aula agora, aulas do
  dia com status e histórico completo.
- **Biblioteca** por disciplina/projeto/unit, busca, prévia, “dar aula” para turma/data e
  “abrir sem turma”.
- **Editor de slides** por bloco/slide, prévia, undo/redo, versão global e snapshot local; aula
  dada é somente leitura.
- **Palco único** para Roleta, Passa Repassa, D20, Competição e Live, sem segunda aba e sem iframe.
- **Live embutido** no `/professor`: sala, QR, alunos, perguntas, timer, placar e pódio; `/host`
  permanece por compatibilidade.
- **Testes**: unitários de agenda/Live (`npm run test:unit`) e smoke E2E (`npm run test:e2e`).
- **Segurança**: CSP e headers, `CRON_SECRET` no sync, rate limit e RLS.

### Técnico

- Next.js 15 (App Router), React 19, TypeScript estrito, Tailwind CSS 4, Supabase Realtime,
  motion/react e canvas-confetti.
- Modelo de conteúdo canônico + ocorrência + snapshot + overrides.
- CI com typecheck, testes unitários e build.
