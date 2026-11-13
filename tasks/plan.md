# Plano de execução — cockpit do professor

> Plano detalhado (local, fora do git): `projetos-pasaporte/docs/planejamento-2026-11/`.
> Este arquivo é o índice versionado para acompanhar a execução.

## Ordem

`F0` preparação → `F1` shell + `F2` session → `F3` dados/migração → `F4` agenda + `F5` biblioteca →
`F6` editor + `F7` jogos → `F8` QA/release.

## Gates

1. Spec aprovada (`01-SPEC-PRODUTO`, `02-ARQUITETURA-E-DADOS`).
2. Fase com aceite + build verdes.
3. Migração: backup + dry-run + rollback.
4. Release: aceite global + ensaio real.

## Regras que não podem quebrar

- Toda edição de slide pergunta **local x global**; nunca assumir.
- Aula dada é **somente leitura** (snapshot).
- P1 A2: bloco “Relembrando a Aula 1” é **local da C2-08**.
- Rotas `/professor` e `/tela`; `/aula` e `/tv` só por redirect.
- Código da sessão sempre visível; `/tela` reconecta.
- Jogos no palco único, sem segunda aba/iframe.
- Cursor escondido exceto em campos de digitação.

## Backlog resumido

- [ ] **F0** Backup, AGENTS.md, flags, seeds, mapa da documentação, git/CI
- [ ] **F1** Rotas `/professor`/`/tela`, redirects, saudação “Júnior”, cursor, navegação, docs de rotas
- [ ] **F2** Código visível, heartbeat, reconexão, snapshot da TV, fim explícito
- [ ] **F3** SQL/RLS, sync Passaporte, migração 15 aulas, resolver/overrides, P1 A2, docs de dados
- [ ] **F4** Agenda semanal (seg–dom, folgas sex/dom para sempre), próxima/aula agora, hoje, histórico (todos os reports)
- [ ] **F5** Biblioteca por disciplina/unit, busca, atribuir, aula avulsa, clonar
- [ ] **F6** Editor de slides/blocos, modal local/global, versões, aula dada somente leitura
- [ ] **F7** Roleta (clique na `/tela`, rodadas), Passa, D20, Competição, Live embutido, docs de jogos
- [ ] **F8** E2E, unitários, performance, segurança, ensaio real, release, histórico git/docs
- [ ] **F9 (pós-lançamento)** Criação em massa de todas as aulas de todas as turmas, depois que a
  plataforma estiver pronta (não faz parte da construção da ferramenta)

Detalhes de aceite/verificação/arquivos: `03-PLANO-E-BACKLOG.md` (local).
