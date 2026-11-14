# Changelog

## [1.0.6] — 2026-11-14

### C2-02, chamada e privacidade do relatório

- C2-02 reestruturada: depois do aquecimento entra o resumo do Projeto 6/ODS, o slide
  “Projeto 6 = projeto final” e um bloco novo com o **mapa da Aula 2** em passo a passo
  (posições, peças e script da Lava), porque a turma não teve as Aulas 1 e 2 normalmente.
- Tempos reajustados para 150 min: 10/15/5/28/10/22/15/25/10/10.
- O slide do class report **saiu da TV**; o texto base fica apenas no modal do professor.
- A chamada do class report agora usa os **nomes reais da turma** na Passaporte, com um
  toggle por aluno; a presença é salva com `studentId` e nome.
- O relatório continua marcando `given`/`no_students` na ocorrência.

## [1.0.5] — 2026-11-14

### Aulas de 14/11 e class report

- P6 A3, P5 A3 e Word II reescritas com tempos realistas (150 min), casos, código completo,
  missão de sala e quiz com 🎯.
- C2-02 ganhou um bloco **local** “Projeto 6 + projeto final”, sem alterar o canônico global.
- Class report no intervalo: modal com presença, duas frases padrão e terceira frase opcional
  (“bom desempenho”), salvo na ocorrência e exibido no slide de intervalo.
- Abrir a aula apenas reserva o código; o snapshot só congela em **Iniciar aula**. Snapshots
  antigos de aulas futuras foram limpos.
- Tradução na metade do Live funciona de English para Português; em Português o toggle fica
  indisponível.
- Aulas que alternam por semana recebem conteúdo na **semana certa** (C2-03 em 21/11,
  C2-04/C1-02 em 23/11).
- Reiniciar uma sessão limpa `ended_at` (v1.0.4).

## [1.0.3] — 2026-11-14

### Correções de produto

- Cursor do mouse sempre visível; caret de digitação apenas em campos editáveis.
- Agenda com turmas alternadas por semana, fim às 18h e status corrigidos (cancelada cinza,
  sem alunos âmbar, não dada rosa).
- Aulas por dia colapsáveis (hoje/amanhã abertos); “Próxima aula” só quando há aula hoje;
  aulas de hoje abaixo e mensagem “Sem aulas hoje. Aproveite a folga!”.
- Biblioteca com disciplinas/projetos colapsáveis e sem filtros redundantes de trilha/duração.
- `/tela` valida o código da sala; código inexistente não “conecta”.
- Editor permite escolher o tipo do novo slide, trocar o tipo do slide atual e renomear o bloco.
- Live com modo, dificuldade, temas múltiplos, idioma, tela do aluno, tradução e auto-avanço.
- Competição com níveis/fases, temas, ordem, idioma, eliminação e pódio.
- D20 com temas/dificuldade; Roleta com rodadas/clique; Passa com temas/idioma.
- Todos os Verdadeiro/Falso e opções podem ser respondidos na `/tela`, com avanço automático.
- P6 A3 reescrita com checkpoint/respawn, código completo, tempos coerentes e fechamento.

## [1.0.2] — 2026-11-13

### Conteúdo

- Dez novas aulas completas (7 blocos, 8 slides, 150 min) e dez decks de 6 perguntas.
- Próxima aula de cada uma das 16 turmas vinculada na agenda (10 novas + 6 reaproveitadas).
- Pipeline local de produção em `projetos-pasaporte/scripts/` (não versionado) e catálogo local.

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
