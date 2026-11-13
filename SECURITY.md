# Security Policy

## Supported versions

Supp is a continuously deployed Next.js application. Security fixes are applied
to the `main` branch.

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Use GitHub's private vulnerability reporting:

<https://github.com/jrchakalo/Supp/security/advisories/new>

Include:

- A short description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- The affected route or component, when known.
- Your browser/OS, if the issue is client-side.

You can expect an initial response within a few days. Please give us reasonable
time to fix the issue before any public disclosure.

## Scope

In scope:

- The Next.js application (`app/`, `components/`, `lib/`).
- The Supabase Realtime room flow (`/host` and `/join`).
- Authentication/authorization mistakes, XSS, injection, unsafe redirects,
  secret leakage and dependency vulnerabilities.

Out of scope:

- Denial of service caused by the free Supabase tier or the hosting provider.
- Social engineering, spam or classroom disruption that does not exploit the app.
- Findings that require physical access to a device or a compromised browser.

## Security practices in this repository

- Secrets are not committed. `.env.local` is ignored; only `.env.example`
  contains placeholders.
- Security headers are configured in `next.config.ts`: CSP, HSTS,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, COOP and CORP.
- The Supabase anon key is public by design. It can read institutional content
  through RLS (never `pp_reports.raw`). Every write and every report read goes
  through a server route that requires a signed `httpOnly` professor session.
- The professor gate issues that session; the client-side flag is only UX.
- Room codes and nicknames are sanitized and length-limited before broadcast.
- `npm run test:unit`, `npx tsc --noEmit` and `npm run build` are expected to
  pass before release.
