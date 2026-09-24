# BetterCallz Meta campaign

Status: backend and workflow definitions implemented; database migration applied; dedicated Sarvam agent v1 committed; both n8n workflows imported inactive. Meta/Google credentials, backend deployment and live acceptance calls are pending. The existing website demo remains the deployed version.

## Architecture

Meta Lead Ads -> dedicated BetterCallz n8n -> authenticated `POST /api/calls` -> atomic Supabase reservation and dispatch claim -> existing Sarvam provider -> existing Sarvam webhook -> existing evidence-grounded extractor and Resend outbox. A second n8n workflow polls authenticated `GET /api/meta-leads/results`, writes the allocated Google Sheet row with RAW input, then acknowledges via `POST /api/meta-leads/results`.

Website requests retain their current contract. Campaign requests require `source: meta_lead_campaign`, `meta_lead_id`, and `phone`. Optional: `name`, `email`, `company`, `form_id`, `page_id`, `form_context`, `additional_fields`. Indian mobile numbers are normalized to +91. The first payload for a Meta ID is retained. A later changed payload does not create a new call.

`meta_lead_request` stores the Meta ID, original form payload, call ID, dispatch state, call-triggered flag, timestamps, fixed sales-log row, immutable output and delivery acknowledgement. Lead/call records use project `bettercallz-meta` and source `meta_lead_campaign`. Existing website records use `website_demo`.

## Resources created

- Railway project BetterCallz: `1dc8c8a3-5ee5-40c5-a878-057193a4e219`.
- Railway n8n service: `13baab58-49d8-4298-b50c-a0f2e55ef735`.
- Dedicated volume: `cb051875-c1ac-4c6b-8f98-77640678f7e4`, mount `/home/node/.n8n`.
- n8n: https://n8n-production-26093.up.railway.app (owner account configured; observed version 2.40.5).
- Intake workflow: `Ue6GjgUHV9n9kXeA`, imported and unpublished.
- Output workflow: `0aAg4B7WnhtuYSE1`, imported and unpublished; targets the existing Sheet below.
- Sarvam campaign agent: `BetterCallz-c2acab17-9a0d`, committed v1; production routing variables saved in Vercel.
- Meta app: BetterCallz Lead Automation, ID `2257340828332234`, lead-capture use case, unpublished. Separate from all existing apps.
- Meta OAuth callback: `https://n8n-production-26093.up.railway.app/rest/oauth2-credential/callback`.
- Requested form: `Generated form 09/23/2026 11:26pm` on the BetterCallz Page; IDs await connection.
- Google Sheet: https://docs.google.com/spreadsheets/d/1mzPVfZFtDDm4qaTCk7asGLItkvxs25VTlHj0K0w0iwg/edit
- Tab `Leads`, sheet ID `699584235`, exact 26 requested headers, 10,000 rows.
- No Decoory project, workflow, environment variable, database or API was modified.

## Deployment order

1. Apply `supabase/migrations/0007_meta_campaign.sql` before deploying code (website writes now include source columns).
2. Create a separate Sarvam campaign agent using `src/lib/sarvam/meta-lead-prompt.ts`, with variable `lead_context`. Commit and pin its version. Preserve the existing demo agent and voice configuration.
3. Set new backend variables: `SARVAM_META_AGENT_ID`, `SARVAM_META_APP_VERSION` (positive integer), `BETTERCALLZ_META_API_TOKEN` (at least 32 random characters). The campaign also requires the existing `SARVAM_WEBHOOK_SECRET`. Reuse existing Sarvam org/workspace/connection/key/phone, Supabase and Resend variables.
4. Deploy the backend. Without complete campaign configuration it fails closed before reserving or calling.
5. Import `meta-instant-call.json` and `meta-sales-log.json` into the new BetterCallz n8n instance. They are exported inactive without secrets or credential IDs. Regenerate definitions with `node automation/build-workflows.mjs`.
6. Create BetterCallz HTTP Header Auth: header `Authorization`, value `Bearer <BETTERCALLZ_META_API_TOKEN>`. Select it on BetterCallz HTTP nodes. Do not put this token in URLs or node code.
7. Connect Google Sheets OAuth on both Google HTTP nodes of the output workflow.
8. Connect the separate BetterCallz Meta app, Page and named form above. n8n/Meta allow one webhook per app; reusing the Decoory app can disrupt its subscription. Page and form IDs remain unset until verified through the connection.
9. Run acceptance checks, then activate both workflows. Never activate the Meta trigger with guessed Page/form IDs.

## Retry and reconciliation

The reservation transaction serializes matching Meta IDs. A compare-and-set claim permits only one provider dispatch. Any uncertain dispatch is held in `review` (or `dispatching` if the process died); replays do not redial. Reconcile the stored call ID with Sarvam before operator action. A timeout is not proof that no call happened. There is no automatic reset/redial endpoint.

The webhook remains authoritative for transcript/status, including callbacks arriving before provider acceptance returns. Failed calls produce sparse post-call records; missing information stays blank. Conversation classification comes from prospect evidence, never form completion alone. Form context stays in the original payload; email and sales fields contain conversation-supported facts.

Email and Sheet retries are independent. The backend reuses the existing Resend idempotency key/persisted email payload and delivery lease. Ambiguous email attempts older than 23 hours go to review, avoiding a resend after Resend's idempotency window. The output poll schedules due extraction/email retries every five minutes, including after successful Sheet delivery.

Each request reserves a distinct sales row. n8n checks that an occupied row has the same Meta and call IDs before writing. RAW mode prevents text such as `=IMPORTXML(...)` from being evaluated. Acknowledgement happens only after Google's successful response. Lost responses safely repeat the same write. Do not insert/delete/reorder physical rows in `Leads`; use filter views. A row conflict stops the workflow instead of overwriting another lead. Current capacity is 9,999 leads; extend the sheet grid and matching workflow guard before that limit. Never reset the database row sequence against an existing log.

## Verification

- TypeScript, ESLint and production build passed.
- 31 automated tests passed in the full suite; an additional PostgREST composite-return regression test passed afterward (9 campaign tests pass). Coverage includes 20 concurrent deliveries of one lead, replay after success, uncertain provider acceptance, invalid inputs/auth, exact Sheet mapping, distinct email labeling, actual Meta payload normalization and Sheet overwrite protection.
- Live read-only database audit confirmed RLS enabled on existing lead/call tables with no client policies. Campaign table and queue access is service-role only.
- These are local/mock tests; they do not prove live Meta OAuth, Sarvam agent behavior, telephony, Google delivery or Resend delivery.
- Pending live checks: website call, n8n test lead, one campaign call with context and correct opening, transcript/extraction, one Sheet row, one Resend email, replay without second call, final website regression.
