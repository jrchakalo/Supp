-- Least-privilege read access for the browser (anon key).
-- The dashboard only needs specific columns; hides class platform payloads,
-- occurrence notes/audit and content version history from unauthenticated reads.

revoke select on table pp_classes from anon;
grant select (
  id,
  platform_class_id,
  short_code,
  name,
  discipline,
  weekday,
  start_time,
  end_time,
  room,
  students_count,
  current_book,
  current_unit,
  last_report_at,
  active,
  synced_at
) on pp_classes to anon;

revoke select on table pp_occurrences from anon;
grant select (
  id,
  class_id,
  content_id,
  date,
  start_at,
  end_at,
  status,
  session_code,
  content_version,
  snapshot,
  snapshot_hash,
  started_at,
  ended_at,
  platform_report_id,
  created_at,
  updated_at
) on pp_occurrences to anon;

revoke select on table pp_content_versions from anon;

revoke select on table pp_overrides from anon;
grant select (
  content_id,
  scope,
  scope_id,
  slide_key,
  patch,
  suppressed
) on pp_overrides to anon;
