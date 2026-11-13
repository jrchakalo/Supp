# Contribuindo

## Branches

| Branch | Uso |
|---|---|
| `main` | Produção; só recebe merge com CI verde |
| `feat/<fase>-<tema>` | Funcionalidade (ex.: `feat/f1-shell`) |
| `fix/<tema>` | Correção |
| `refactor/<tema>` | Refatoração sem mudar comportamento |
| `docs/<tema>` | Documentação |
| `test/<tema>` | Testes |
| `chore/<tema>` | Infra/dependências |

- Crie a branch a partir da `main` atualizada.
- Rebase antes do merge: `git fetch && git rebase origin/main`.
- Merge com `--no-ff` para preservar o limite da fase.
- Uma branch por worktree; não compartilhe a mesma branch entre agentes.

## Commits

Conventional Commits, resumo no imperativo e ≤ 72 caracteres:

```
feat(professor): adiciona agenda semanal

- Grade seg–dom com lanes e folgas
- Status dada/hoje/prevista

Tested: npx tsc --noEmit; npm run build
Refs: F4-01, F4-02
```

Tipos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`.
Escopos: `professor`, `tela`, `session`, `content`, `agenda`, `library`, `editor`, `games`,
`docs`, `deps`, `ci`.

Regras:
- Um commit = uma mudança lógica; não misture formatação/renomeação com feature.
- Rode `npx tsc --noEmit`, `npm run test:unit` e `npm run build` antes de commitar código.
- Não commite `.env*`, `projetos-pasaporte/`, `node_modules/`, `.next/`, segredos ou dumps.
- Não use `git add .` às cegas; revise `git status` e `git diff`.
- Não reescreva histórico publicado na `main` (sem force push).

## Pull requests

- PR pequeno, com resumo, tarefa(s), como testar e screenshots quando houver UI.
- CI precisa passar (`tsc` + `test:unit` + `build`).
- Descreva riscos e o que ficou fora de escopo.

## Testes

- Unitários: `npm run test:unit` (compila funções puras e roda `node:test`).
- E2E local: com o build servido e o Chrome em `--remote-debugging-port=9222`,
  rode `E2E_GATE_CODE=<código> E2E_BASE_URL=http://localhost:3000 npm run test:e2e`.
  O smoke cobre redirects 308, gate, abertura de aula, código, TV/F5, cursor, agenda e D20.

## Documentação

- Documentação operacional/institucional fica em `projetos-pasaporte/docs/` e **não** vai para o git.
- O README público contém **somente implementação, tecnologia e técnicas**.
- **Não** inclua no README: conteúdo de aulas, detalhes de `projetos-pasaporte/`, código do gate,
  credenciais ou dados de alunos.
- Atualize a documentação na mesma fase em que a implementação mudar rotas, schema ou fluxos.

## Regras do produto

- Toda edição de slide pergunta **local x global**; nunca assuma.
- Aula dada é **somente leitura** (snapshot).
- Rotas `/professor` e `/tela`; `/aula` e `/tv` só por redirect.
- Código da sessão sempre visível; `/tela` reconecta.
- Jogos no palco único, sem segunda aba/iframe.
- Cursor escondido exceto em campos de digitação.

Detalhes completos: `AGENTS.md` e `projetos-pasaporte/docs/planejamento-2026-11/05-GIT-E-DOCUMENTACAO.md`.
