# Changelog

## [1.0.17] — 2026-11-16

### Class report no intervalo e tradução na metade do tempo

- O botão **Gerar class report** agora aparece somente no bloco **Intervalo**
  (antes ficava disponível em qualquer slide).
- Quizzes de **Info Bilíngue** e **PSE Teens** mostram a tradução em português
  exatamente na **metade do tempo** da pergunta:
  - no telão da apresentação (quiz sem celulares), usando o tempo escolhido
    (15s → 7,5s; 20s → 10s; 30s → 15s);
  - no telão do **Live** (o espectador agora renderiza `PT:` e a tradução das
    opções, como a tela do aluno já fazia);
  - no celular do aluno, pelo `translateAtMs` do Live.
- Os decks de **PSE Teens (Class 1 e 2)** ganharam tradução completa
  (`textPt`/`optionsPt`); os decks de Info já tinham. Um teste garante que todos
  os decks de inglês/Info tenham tradução alinhada.

## [1.0.16] — 2026-11-16

### Quiz da aula e sorteio dos jogos

- O quiz da aula usa **o deck da própria aula** nos dois modos: telão sem celulares e
  Live com celulares. Antes, o modo com celulares abria o baralho genérico do Live
  (inglês, todas as categorias). O modal agora mostra o título e a quantidade de
  perguntas do deck e bloqueia o início quando a aula não tem deck.
- D20, Live, Roleta, Passa Repassa e Competição passam a sortear sobre **toda a base**
  de perguntas das categorias escolhidas (todas as dificuldades), com histórico
  persistente compartilhado entre partidas. A pergunta só volta depois que o banco
  inteiro foi usado; a dificuldade escolhida continua sendo a primeira faixa sorteada.
- O histórico antigo do Live é migrado automaticamente.

## [1.0.15] — 2026-11-15

### Agenda: cadência quinzenal e lista da semana

- A cadência quinzenal passou a cobrir **todas** as turmas de Coding, conferida nos
  class reports: C1-03, C2-05 e C2-08 na semana B; C2-07 na semana A. Continuam
  semanais apenas **PSE (C2-01, C2-02 e Teens)**, **Info Bilíngue** e **C2-06** (1h15).
- Semana 16–22/11 corrigida: entram C1-01, Info 10, C2-01, Teens 02, C2-07, C2-06,
  PSE C2-01, PSE C2-02, C2-03 e Info 09; saem C1-03, C2-05, C2-08 e C2-02, que
  tiveram aula na semana anterior.
- **“Aulas por dia”** agora mostra apenas a semana exibida na agenda (mesmo com aulas
  das próximas semanas já prontas); semanas anteriores ficam no bloco recolhível.

## [1.0.14] — 2026-11-15

### Agenda: feriado no centro e almoço só em dia de trabalho

- O selo **Hoje** voltou para o topo do dia.
- O **nome do feriado** passou para a faixa central (12:00–13:00) da coluna, sem
  encostar no selo “Hoje”.
- O tracejado do almoço agora aparece **somente nos dias de trabalho**, entre 12:00
  e 13:00, sem rótulo.
- Dias de folga continuam com o tracejado cobrindo o dia inteiro, sem duplicação.

## [1.0.13] — 2026-11-15

### Agenda: marcador de almoço e selo “Hoje”

- O selo **Hoje** saiu da primeira faixa de horário (onde encostava no nome do feriado)
  e passou para a faixa central do dia (12:00–13:00).
- Dias de folga/feriado ganharam a faixa de **almoço** entre 12:00 e 13:00, com linhas
  tracejadas, hachura e o rótulo “Almoço”.
- A legenda continua igual; nenhuma aula ou feriado mudou de lugar.

## [1.0.12] — 2026-11-15

### Feriados na agenda

- Agenda, sync e painel passam a considerar os feriados oficiais de 2026:
  - **Nacionais** (Portaria MGI 11.460/2025): 01/01, 03/04, 21/04, 01/05, 07/09,
    12/10, 02/11, 15/11, 20/11 e 25/12.
  - **Pernambuco**: 06/03 (Data Magna, Lei 16.241/2017) e 24/06 (São João).
  - **Caruaru**: 18/05 (aniversário), 04/06 (Corpus Christi, Lei 7.334/2024),
    24/06 (São João) e 15/09 (Nossa Senhora das Dores).
- Carnaval, Cinzas e Corpus Christi federais aparecem como **ponto facultativo**.
- São Pedro (29/06) não é mais feriado municipal em Caruaru desde a Lei 7.334/2024.
- O sync não cria ocorrências nesses dias; a agenda mostra o nome do feriado e o painel
  troca “Sem aulas” por “Hoje é feriado: …”.

## [1.0.11] — 2026-11-15

### PSE Teens sempre avança

- O PSE Teens agora conta **todo relatório salvo**, inclusive “sem alunos”, para escolher a
  próxima lição da plataforma.
- Como a Unit 0 tem duas lições, o próximo relatório vai para **PSE Teens - Aula 2**.
- O catálogo de feedbacks continua o de inglês (Homework/Participation/Media/Game Winner/Teamwork).

## [1.0.10] — 2026-11-15

### PSE e inglês: próxima aula disponível

- O class report não repete mais aula já lançada.
- **PSE Coding**: escolhe a próxima unidade (`Aula 1..7`) que ainda não foi reportada; relatórios
  “sem alunos” não contam.
- **Info/PSE Teens**: escolhe a próxima lição/unidade não reportada.
- O texto é ajustado para a aula escolhida (`PSE Aula 3 - ...`, `Unit 2 ; Lesson 2: ...`).
- PSE C2-02 passou de Aula 2 para **Aula 3**, acompanhando a próxima disponível.
- PSE C2-01 e PSE C2-02 têm class report no intervalo; as duas vão para a Aula 3.

## [1.0.9] — 2026-11-15

### Class report por tipo de curso

- **Coding** mantém Planejamento/Colaboração/Autocontrole/Liderança Colaborativa/Criatividade.
- **Info Bilíngue e PSE Teens** usam Homework/Participation/Media/Game Winner/Teamwork.
- O modal escolhe o catálogo pela disciplina da turma (`coding` × `english`), com os mesmos
  valores da plataforma.
- A publicação escolhe a unidade pelo `unit_no` em cursos de inglês (Unit 1/2/3) e pelo
  `lesson_no` em Coding (Aula 3); a lição vai em `unitLessons`.
- Info 10 e PSE Teens 02 ganharam `classReport` no intervalo.
- Corrige o 400 ao publicar Info/PSE: antes ia unidade errada e feedback de Coding.

## [1.0.8] — 2026-11-14

### Aula de Word e plataforma

- Word II reescrita em português: duas páginas de exemplo (bagunçada × profissional),
  documento **novo** para escrever antes de formatar, autoavaliação sem avaliação entre colegas.
- Removido o recap de Word I do conteúdo global.
- Quiz em inglês com tradução em português aparecendo após 10 segundos.
- Class report agora publica o **horário da turma** (07:00–09:30), não o horário UTC da ocorrência.
- Roleta, D20, Competição e Passa Repassa não avançam sozinhos: a resposta fica na tela até
  clicar na roleta, em outro número (D20), em Próximo (Competição/Passa).
- Live mostra **Pergunta X de Y** no cockpit do professor e no `/tela`.

## [1.0.7] — 2026-11-14

### Feedbacks comportamentais e publicação na Passaporte

- Cada aluno presente recebe por padrão **Colaboração +80** e **Autocontrole +80**.
- O toggle **Bom desempenho** adiciona **Criatividade +80** em todos os presentes.
- Clicar no nome abre a ficha do aluno: frequência, material didático, abas
  **Positivo** (até 5) e **Precisa melhorar** (até 3), com os mesmos valores da plataforma.
- O botão **Salvar** grava no Supp e, com **Publicar na Passaporte** ligado, cria/atualiza o
  class report real com `studentInfos`, `feedbacks`, `frequency` e `has_material`.
- Payload da publicação validado em dry-run contra a turma real; nenhum relatório de teste foi
  criado na plataforma.
- O slide do class report continua fora do telão.

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
