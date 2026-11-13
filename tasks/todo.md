# TODO — cockpit do professor

> Marcar `[x]` só com aceite + verificação. Detalhes locais em
> `projetos-pasaporte/docs/planejamento-2026-11/03-PLANO-E-BACKLOG.md`.

## F0 — Preparação
- [x] F0-01 Backup e baseline
- [x] F0-02 AGENTS.md e regras
- [x] F0-03 Feature flags
- [ ] F0-04 Seeds de teste (depende do schema v2 — F3)
- [x] F0-05 Inventário e mapa da documentação
- [x] F0-06 Git, branches, commits e CI

## F1 — Shell
- [x] F1-01 Mover rotas + redirects
- [x] F1-02 Atualizar links/QR/textos/robots
- [x] F1-03 Saudação por hora (“Júnior”)
- [x] F1-04 Cursor global + toggle
- [ ] F1-05 Navegação e layout (abas ficam com F4/F5)
- [x] F1-06 Atualizar documentação de rotas

## F2 — Session
- [x] F2-01 Código sempre visível
- [x] F2-02 Heartbeat e presença
- [x] F2-03 Reconexão automática da TV (botão manual fica para F7)
- [x] F2-04 Snapshot de estado da TV
- [x] F2-05 Fim de aula explícito

## F3 — Dados
- [x] F3-01 SQL e RLS
- [x] F3-02 Sync Passaporte
- [x] F3-03 Migração dos 15 JSONs
- [x] F3-04 Resolver (snapshot/conteúdo; overrides ficam para F6)
- [x] F3-05 Correção P1 A2 (recap local)
- [x] F3-06 Leitura v2 no app
- [x] F3-07 Documentação de dados

## F4 — Agenda e dashboard
- [x] F4-01 WeekAgenda
- [x] F4-02 Dados da agenda (seg–dom, dia 1, folgas para sempre)
- [x] F4-03 Próxima/aula agora
- [x] F4-04 Aulas de hoje com tag Dada
- [x] F4-05 Histórico (todos os reports)

## F5 — Biblioteca
- [x] F5-01 Listagem e filtros
- [x] F5-02 Prévia e “dar aula”
- [ ] F5-03 Duplicar/clonar (F6)
- [ ] F5-04 Favoritos/recentes (depois)

## F6 — Editor
- [x] F6-01 Editor de slide
- [x] F6-02 Estrutura de blocos/slides
- [x] F6-03 Modal local/global
- [x] F6-04 Versões e restauração (versão global + snapshot local)
- [x] F6-05 Aula dada somente leitura

## F7 — Jogos
- [x] F7-01 Protocolo + GameStage (Roleta e Passa; D20/Competição/Live a seguir)
- [x] F7-02 Roleta (clique na /tela, rodadas)
- [x] F7-03 Passa Repassa
- [x] F7-04 D20 completo
- [x] F7-05 Competição completa
- [x] F7-06 Live embutido
- [x] F7-07 Polimento de animações
- [x] F7-08 Documentação dos jogos

## F8 - QA e release
- [x] F8-01 E2E (smoke CDP: redirects, gate, aula, TV/F5, D20)
- [x] F8-02 Unitários (agenda, folgas, próxima aula, Live)
- [x] F8-03 Performance (FCP ~1,3 s no cold; bundle 368 kB)
- [x] F8-04 Segurança (CSP/headers, secret no sync, rate limit, sem PII/raw)
- [ ] F8-05 Ensaio real (1 dia de aulas — depende do professor)
- [ ] F8-06 Release (tag e verificação final)
- [x] F8-07 Histórico git e documentação final

## F9 — Pós-lançamento
- [ ] F9-01 Criação em massa de todas as aulas de todas as turmas (depois da plataforma pronta)
