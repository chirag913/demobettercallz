# Main demo discovery and lead email

The 23 September redesign changes the dedicated main demo conversation and adds a post-call email. The user selected Resend instead of Google Sheets; the existing BetterCallz B2B workbook is untouched.

## Conversation

`src/lib/sarvam/public-demo-prompt.ts` is the source for the dedicated Sarvam agent's greeting and instructions. Install it in the dashboard, update greeting translations, commit a version, and pin `SARVAM_DEMO_APP_VERSION` in production. The agent opens with a warm BetterCallz greeting and waits. It follows the visitor's answers, retains answered facts and corrections, discovers lead flow when relevant, then captures explicit interest and a requested next step. It never claims to be Chirag or promises a completed external action. Voice, interruptions, language switching, call limits and telephony are preserved.

## After the call

Apply `supabase/migrations/0006_demo_lead_delivery.sql`. The completion webhook keeps its existing transcript/call persistence and queues only real, completed `bettercallz-live` calls. Next.js `after` processes the lead without waiting for a visitor to view the result page. Property calls and failed call attempts do not send these emails.

Extraction uses the existing Sarvam Chat provider. All 22 requested fields are included in a plain-text email. Phone and timestamp come from the stored call/lead, not the model. Every other fact needs verbatim prospect evidence. Missing facts remain empty; the two classifications use Unknown. A summary is assembled from grounded fields only. Sparse calls may have a shorter or empty summary rather than invented filler.

Existing environment variables are reused: `SARVAM_CHAT_API_KEY`, `RESEND_API_KEY`, `CONTACT_EMAIL_FROM`, `CONTACT_EMAIL_TO`. The destination cannot be changed by transcript content. No email goes to the prospect automatically. Resend acceptance is stored as an email ID; it is not itself proof of inbox delivery.

## Reliability

The private outbox has one row per call, RLS enabled, no public policies, and service-role-only access. A conditional lease prevents concurrent sends. Extraction and the exact email payload are stored before transmission. Retries reuse `demo-call/{call_id}` as Resend's idempotency key. Successful rows are terminal. There are three immediate attempts; repeated completion webhooks also retry pending/failed deliveries. Persistent failures remain in the outbox for operational retry. This implementation does not include a periodic retry scheduler.

An ambiguous send older than 23 hours is held as `review` rather than risk duplication after Resend's 24-hour idempotency window. Reconcile it in Resend before retrying. For current failures, resolve the underlying issue and replay the authenticated completion webhook. Do not reset sent rows.

## Verification

Tests cover blank facts, unsupported and AI-only evidence, valid classification enums, explicit test-only intent, fixed recipients, failed provider responses, concurrent completion events, exact-payload retries, expired ambiguous attempts, and property-call isolation. Keep live call and delivery results separate from these automated checks.

Live verification on 23 September: the authorized call completed, its webhook returned HTTP 200, and Resend confirmed delivery of one lead email to the configured owner. The real transcript exposed a missed short monthly-volume answer and embellished pain-point causality. Regression coverage now preserves the question's monthly context and uses verbatim prospect quotes for problems, response speed and notes. The test also exposed repeated probes and a callback promise; version 9 adds explicit short-turn and closing rules. These prompt refinements still require a subsequent conversation to assess; prompt instructions are not deterministic enforcement. The first delivered test email reflects the earlier extraction and is not silently rewritten or resent.
