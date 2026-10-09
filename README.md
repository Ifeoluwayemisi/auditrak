# AuditTrak

**Money moved. AuditTrak shows the story behind it.**

A local MVP for freelancers and small businesses to assemble commercial evidence, compare records with deterministic rules, and share a job with human reviewers.

## Run it

Requires Node **22.13 or newer** (uses Node SQLite). SQLite may print an experimental-feature notice on Node 22.

```bash
npm ci
npm run build
npm run seed
npm start
```

Open http://localhost:3000. Sign up, or use these **local demo accounts**:

| Role | Email | Password |
| --- | --- | --- |
| Business | demo@audittrak.local | AuditTrakDemo2026! |
| Reviewer | reviewer@audittrak.local | ReviewAuditTrak2026! |

Set `DEMO_PASSWORD` / `REVIEWER_PASSWORD` before first seeding to use your own sample passwords. Re-running the seed does not reset existing accounts. Do not deploy default demo accounts publicly. No real financial records are included.

Environment settings are described in `.env.example`. Supply them through your shell/process manager; this service does **not** automatically load `.env` files.

## Try the whole story

1. Sign in as the business. Click **Load five fictional jobs** in an empty workspace.
2. Open Amina: agreement, invoice, payment agree, but delivery and confirmation remain missing.
3. Click **Check this job**. Read the reasons; this is evidence coverage, not proof of authenticity.
4. Record completed delivery and attach a text/PDF/image as fulfillment evidence.
5. Create a confirmation link. Open it in another tab and submit a **fictional** client response.
6. Check the job again, then **Share for review**. Sign in as the reviewer to read it and add a note.
7. Edit the job as its owner: sharing is revoked, old assessments become stale, and old confirmation links no longer apply.

Other stories cover a changed price, part payment, a different payer, and a credit followed by a debit. Conversation illustrations are synthetic teaching examples, not screenshots from connected accounts. Marketplace-specific workflows are illustrative rather than platform documentation.

## Included

- Business sign-up/login, saved profile, tenant separation, cookie sessions and sign-out.
- Commercial events, counterparties, agreements, invoices, multiple payment records, fulfillment and evidence files (up to 5 MB).
- Confirmation links tied to an event revision; one response per invitation; 14-day expiry. No messages sent automatically. Link possession does not verify identity.
- Deterministic amounts, currencies, names, references, timing, net credits/debits, missing delivery and confirmation checks.
- Evidence graph, timeline, activity log, commercial activity profile, explicit sharing/revocation and a reviewer workspace.
- Optional Mono import and AI extraction provider boundaries, separate from manual records.
- Five fictional demo stories, tests, walkthrough presentation and a separate pitch deck/script in `docs/`.

## Architecture

React + Vite UI → Fastify TypeScript API → SQLite database.

`src/mvp/db.ts` defines the evidence model and persistence; `routes.ts` enforces ownership and reviewer access; `assessment.ts` assembles five-stage assessments using `src/reconcile.ts`. `ui/main.tsx` contains the user flow. The earlier three-record prototype remains at `/prototype`; its `/api/*` routes are learning utilities with an in-memory store, separate from the persisted `/api/v1` workspace.

Money is stored in integer **minor units**. Currencies are never converted or summed across currencies. Differences are review signals; they do not establish wrongdoing. A debit is subtracted only when the user links it to the job, and its relationship still needs review.

## Optional providers

**Mono:** `MONO_SECRET_KEY` enables the adapter. An operator must obtain user consent through their own Mono setup and set `MONO_ACCOUNT_BINDINGS` to map a workspace business ID to that consented account ID. POST selected transaction IDs to `/api/v1/events/:id/mono-import`; the service fetches that bound account and links only returned records. Duplicate transaction IDs within a business are rejected. No consent widget, OAuth flow, live bank connection, automatic reconciliation or live sandbox validation is claimed. See `docs/API.md`.

**Extraction:** set `DOCUMENT_EXTRACTION_URL` and optionally `DOCUMENT_EXTRACTION_API_KEY` for an HTTP service implementing `src/extraction.ts`. Attach an agreement/invoice and paste its text into the proposal form. Results must identify the same attached document and include excerpts present in submitted text. The UI shows proposals for manual review. There is no built-in OCR, trained model or configured AI provider. Excerpts alone do not prove the proposed values are correct.

Legacy provider endpoints require `PROVIDER_ACCESS_TOKEN` as a bearer token when configured. Prefer the authenticated event routes. Never commit credentials or bank account bindings.

## Guardrails and limits

No invented evidence, credit decisions, fraud labels, or AI overrides of deterministic rules. Summaries are templates over supplied records. Name similarity is a signal, not identity verification. The legacy `evidenceConfidence` number is an uncalibrated input-based heuristic; the MVP shows explicit evidence coverage and uncertainty instead.

This is a **local MVP**, not a production financial system. Before an external pilot: HTTPS and secure cookies, explicit reviewer/institution grants (all seeded reviewers currently see all shared jobs), account recovery/verification, operational rate limits, file scanning, retention/deletion policy, encrypted backups, database migrations and a production security review are needed. Uploaded files are downloaded as attachments; their content is not authenticated. Audit history is application-level, not tamper-proof. Deleting a job removes its evidence while retaining action history.

## Checks

```bash
npm run build
npm run typecheck
npm test
```

Tests cover the deterministic engine, demo scenarios, API validation, normalization, business separation, sharing, confirmation invalidation, persistence, reversal handling and built UI assets. The tests mock providers; real account/provider behavior is not validated.
