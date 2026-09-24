# Meta campaign controlled retries

Only `meta_lead_campaign` / `bettercallz-meta` uses this policy. Website calls retain their existing behavior.

- Three total attempts maximum. Attempt 2 is due 45 minutes after the previous terminal callback; attempt 3 is due three hours later.
- Calls may start from 08:00 inclusive to 21:00 exclusive, Asia/Kolkata. Quiet-hour due times move to the next 10:00 IST (same calendar day when before 08:00). UTC timestamps are stored.
- Authenticated Sarvam `busy` and `no_answer` callbacks qualify. Failed callbacks qualify only with explicit failure-to-connect/place evidence. A timeout alone does not qualify. Connection evidence, DND/NDNC, refusal, wrong/invalid number and unknown outcomes stop automatic redials.
- Existing records at migration time are `LEGACY_HOLD`; no historical failures are automatically enrolled.

## Transaction and recovery boundaries

Migration 0008 extends `meta_lead_request`. `reserve_meta_lead` retains the first payload and one underlying lead. `claim_meta_attempt` locks that row, checks eligibility/cap, and creates an additional **existing call-table row** on retries. This preserves call/transcript history while the campaign's `call_id` points to the latest attempt.

`PREPARED` reservations can be recovered without incrementing the count or creating another call. `begin_meta_dispatch` is an atomic one-time transition and rechecks quiet hours immediately before provider dispatch. Two workers can inspect the same prepared reservation, but only one can begin dispatch.

After that boundary, a crash/timeout cannot prove whether the provider accepted the call. The record remains CALLING or REVIEW and cannot be reclaimed automatically. Reconcile it against Sarvam using the existing call/attempt ID. An authenticated final callback may resolve REVIEW and schedule a later attempt. Never reset the count, change Meta IDs or blindly repeat dispatch.

`finish_meta_attempt` is idempotent and schedules from the callback time. Duplicate callbacks do not push the due time forward. Failed attempts do not enter the extraction/email outbox. Completed conversations retain the original transcript extraction and durable email idempotency.

## Scheduler and Sheet

The existing authenticated n8n `GET /api/meta-leads/results` poll invokes the due worker using Next.js `after`; no additional cron is required. It processes up to five due leads per invocation. The existing n8n workflow must stay published.

The existing Sheet row is reused. Columns AA:AF add attempt_count, last_call_status, last_attempt_at, next_retry_at, retry_status and retry_reason. The fixed-row guard checks Meta lead ID rather than call ID, since retries have distinct call IDs. Row acknowledgements require `sheet_revision`; a stale acknowledgement cannot hide a newer state. Keep row order intact and do not run old output-workflow versions after rollout.

## Rollout

1. Apply `supabase/migrations/0008_meta_retries.sql` once, in a transaction. No existing lead/call rows are deleted. Older records are held.
2. Deploy the backend and update the existing output workflow from `meta-sales-log.json`, preserving its credentials and workflow identity.
3. Extend the existing Leads grid to at least 32 columns and add the six headers in AA1:AF1. Keep the original 26 columns and existing rows.
4. Confirm the output workflow is published and a poll succeeds. Check the production API and database state without placing unsolicited test calls.

Rollback: stop the output schedule and stop campaign intake, or set pending campaign rows to REVIEW after operator review. Do not roll back to an older immediate-call implementation while delayed leads exist. Database columns and historical calls can remain intact.

## Local validation

`node --test tests/*.test.mjs`, `npx tsc --noEmit`, targeted ESLint, `npm run build`.

Retry tests run actual migration/RPC SQL in PGlite, with only the database clock substituted. Concurrent Promise callers test claims and dispatch gates; PGlite serializes a single connection, so this is not a multi-session production load test. No test calls external telephony or sends email. Existing website/delivery tests remain included.
