# Migração — modelo de conteúdo v2

Arquivos:
- `20261113_content_model.sql` — tabelas, RLS e folgas.
- `20261114_restrict_anon_columns.sql` — leitura anon por coluna (esconde `platform`, `notes` e
  histórico de versões).

## Como aplicar

### Opção A — SQL Editor

1. Abra o projeto Supabase do Supp.
2. Vá em **SQL Editor** → **New query**.
3. Cole o conteúdo de cada arquivo, na ordem acima.
4. Rode (**Run**).
5. Confira em **Table Editor** as tabelas:
   `pp_classes`, `pp_content`, `pp_content_versions`, `pp_occurrences`, `pp_overrides`,
   `pp_reports`, `pp_calendar_rules`.
6. Confira `pp_calendar_rules`: duas linhas `weekday = 5` (sexta) e `weekday = 0` (domingo),
   `from_date = 2026-11-01`, `to_date = null`.
7. Rode o script de verificação (opcional):
   `node scripts/verify-content-model.mjs` (usa a service key do `.env.local`).

### Opção B — psql/Node

Requer `SUPABASE_DB_URL` no `.env.local` (connection string do banco) e `pg` instalado:

```bash
npm i -D pg
node scripts/apply-migration.mjs
```

## Segurança

- O SQL é **aditivo**: não apaga `pp_plans`, `pp_quizzes`, `pp_agenda` nem `pp_meta`.
- Escrita continua via service role (rotas server-side). O anon lê apenas as colunas necessárias;
  `pp_classes.platform`, `pp_occurrences.notes` e `pp_content_versions` ficam ocultos.
- `pp_reports` fica **sem policy anon** de propósito (pode conter dados de alunos).
- O código do gate não aparece aqui.

## Rollback

Como as tabelas são novas, o rollback seguro é:

```sql
-- somente se necessário e sem dados v2 ainda
drop table if exists pp_overrides;
drop table if exists pp_occurrences;
drop table if exists pp_content_versions;
drop table if exists pp_content;
drop table if exists pp_reports;
drop table if exists pp_calendar_rules;
drop table if exists pp_classes;
```

O app continua no modo `legacy` (`NEXT_PUBLIC_CONTENT_MODEL=legacy`) até a migração dos dados.

## Depois de aplicar

1. Rodar a migração dos 15 JSONs (`F3-03`).
2. Validar contagens e abrir 3 aulas.
3. Só então ligar `NEXT_PUBLIC_CONTENT_MODEL=v2`.
