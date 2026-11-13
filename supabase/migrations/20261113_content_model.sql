-- Professor cockpit v2: content library + class occurrences + overrides.
-- Apply in the Supabase SQL editor (or with psql/SUPABASE_DB_URL).
-- The app keeps reading pp_plans while NEXT_PUBLIC_CONTENT_MODEL=legacy.

create table if not exists pp_classes (
  id uuid primary key default gen_random_uuid(),
  platform_class_id text unique not null,
  short_code text unique not null,
  name text not null,
  discipline text not null,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  students_count int,
  current_book text,
  current_unit text,
  last_report_at date,
  active boolean not null default true,
  platform jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now()
);

create table if not exists pp_content (
  id text primary key,
  discipline text not null,
  track text,
  book text,
  unit_no int,
  lesson_no int,
  title text not null,
  total_min int,
  deck_id text,
  segments jsonb not null default '[]'::jsonb,
  version int not null default 1,
  status text not null default 'published'
    check (status in ('draft', 'published', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pp_content_versions (
  id uuid primary key default gen_random_uuid(),
  content_id text not null references pp_content(id) on delete cascade,
  version int not null,
  segments jsonb not null,
  title text,
  total_min int,
  author text,
  created_at timestamptz not null default now(),
  unique (content_id, version)
);

create table if not exists pp_occurrences (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references pp_classes(id) on delete set null,
  content_id text references pp_content(id) on delete set null,
  date date not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'planned'
    check (status in ('unplanned', 'planned', 'given', 'missed', 'cancelled', 'no_students', 'holiday')),
  session_code text,
  content_version int,
  snapshot jsonb,
  snapshot_hash text,
  started_at timestamptz,
  ended_at timestamptz,
  platform_report_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, date, start_at)
);

create table if not exists pp_overrides (
  id uuid primary key default gen_random_uuid(),
  content_id text not null references pp_content(id) on delete cascade,
  scope text not null check (scope in ('global', 'class', 'occurrence')),
  scope_id text,
  slide_key text not null,
  patch jsonb not null default '{}'::jsonb,
  suppressed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pp_overrides_unique
  on pp_overrides (content_id, scope, coalesce(scope_id, ''), slide_key);

create table if not exists pp_reports (
  id text primary key,
  platform_class_id text not null,
  class_id uuid references pp_classes(id) on delete set null,
  class_date date not null,
  start_at timestamptz,
  end_at timestamptz,
  class_info text,
  summary text,
  raw jsonb,
  fetched_at timestamptz not null default now()
);

create table if not exists pp_calendar_rules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint check (weekday between 0 and 6),
  date date,
  from_date date not null,
  to_date date,
  kind text not null default 'off' check (kind in ('off', 'holiday')),
  label text not null default 'Folga',
  created_at timestamptz not null default now(),
  check (weekday is not null or date is not null)
);

create index if not exists pp_occurrences_date_idx on pp_occurrences (date);
create index if not exists pp_occurrences_class_idx on pp_occurrences (class_id, date);
create index if not exists pp_reports_class_date_idx on pp_reports (class_id, class_date);
create index if not exists pp_content_discipline_idx on pp_content (discipline, track, unit_no, lesson_no);

alter table pp_classes enable row level security;
alter table pp_content enable row level security;
alter table pp_content_versions enable row level security;
alter table pp_occurrences enable row level security;
alter table pp_overrides enable row level security;
alter table pp_reports enable row level security;
alter table pp_calendar_rules enable row level security;

-- Read-only anonymous access for the cockpit. Writes use the service role.
drop policy if exists pp_classes_anon_select on pp_classes;
create policy pp_classes_anon_select on pp_classes for select to anon using (true);

drop policy if exists pp_content_anon_select on pp_content;
create policy pp_content_anon_select on pp_content for select to anon using (true);

drop policy if exists pp_content_versions_anon_select on pp_content_versions;
create policy pp_content_versions_anon_select on pp_content_versions for select to anon using (true);

drop policy if exists pp_occurrences_anon_select on pp_occurrences;
create policy pp_occurrences_anon_select on pp_occurrences for select to anon using (true);

drop policy if exists pp_overrides_anon_select on pp_overrides;
create policy pp_overrides_anon_select on pp_overrides for select to anon using (true);

drop policy if exists pp_calendar_rules_anon_select on pp_calendar_rules;
create policy pp_calendar_rules_anon_select on pp_calendar_rules for select to anon using (true);

-- pp_reports stays server-only: it may contain student/survey payloads.
-- No anon policy on purpose.

-- Friday (5) and Sunday (0) are off from November 2026, forever.
insert into pp_calendar_rules (weekday, from_date, to_date, kind, label)
select 5, date '2026-11-01', null, 'off', 'Folga'
where not exists (
  select 1 from pp_calendar_rules
  where weekday = 5 and from_date = date '2026-11-01' and kind = 'off'
);

insert into pp_calendar_rules (weekday, from_date, to_date, kind, label)
select 0, date '2026-11-01', null, 'off', 'Folga'
where not exists (
  select 1 from pp_calendar_rules
  where weekday = 0 and from_date = date '2026-11-01' and kind = 'off'
);
