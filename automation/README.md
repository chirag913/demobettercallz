# BetterCallz Meta campaign

Status: Meta and Google apps and both dedicated n8n workflows are published. Backend commit `b202835` is on main and deployed to production. A controlled replay fetched the real test lead, placed one completed campaign call, wrote Sheet row 2 and sent one Resend email. A repeated intake returned the same call ID with duplicate=true. The first summary missed explicit manual-calling and human-handoff answers; the correction is deployed and covered by regression tests. Fresh Meta-originated delivery and the corrected live summary remain to verify.

## Architecture

Meta Lead Ads -> dedicated BetterCallz n8n -> authenticated `POST /api/calls` -> atomic Supabase reservation and dispatch claim -> existing Sarvam provider -> existing Sarvam webhook -> existing evidence-grounded extractor and Resend outbox. A second n8n workflow polls authenticated `GET /api/meta-leads/results`, writes the allocated Google Sheet row with RAW input, then acknowledges via `POST /api/meta-leads/results`.

Website requests retain their current contract. Campaign requests require `source: meta_lead_campaign`, `meta_lead_id`, and `phone`. Optional: `name`, `email`, `company`, `form_id`, `page_id`, `form_context`, `additional_fields`. Indian mobile numbers are normalized to +91. The first payload for a Meta ID is retained. A later changed payload does not create a new call.

`meta_lead_request` stores the Meta ID, original form payload, call ID, dispatch state, call-triggered flag, timestamps, fixed sales-log row, immutable output and delivery acknowledgement. Lead/call records use project `bettercallz-meta` and source `meta_lead_campaign`. Existing website records use `website_demo`.

## Resources created

- Railway project BetterCallz: `1dc8c8a3-5ee5-40c5-a878-057193a4e219`.
- Railway n8n service: `13baab58-49d8-4298-b50c-a0f2e55ef735`.
- Dedicated volume: `cb051875-c1ac-4c6b-8f98-77640678f7e4`, mount `/home/node/.n8n`.
- n8n: https://n8n-production-26093.up.railway.app (owner account configured; observed version 2.40.5).
- Persistent storage verified after redeployment: `N8N_USER_FOLDER=/home/node`, database and encryption config on `/home/node/.n8n`. SQLite backup integrity passed; 2 workflows and 1 owner survived the restart. Root home is not used for the database.
- Intake workflow: `Ue6GjgUHV9n9kXeA`, published.
- Output workflow: `0aAg4B7WnhtuYSE1`, published; targets the existing Sheet below.
- Sarvam campaign agent: `BetterCallz-c2acab17-9a0d`, committed v1; production routing variables saved in Vercel.
- Meta app: BetterCallz Lead Automation, ID `2257340828332234`, lead-capture use case, published with owner approval. Separate from all existing apps.
- Meta OAuth callback: `https://n8n-production-26093.up.railway.app/rest/oauth2-credential/callback`.
- The exact n8n hostname is saved in Meta App Domains. `pages_manage_metadata` was added with approval and is ready for testing. Meta OAuth completed; the Page and requested form were retrieved through n8n and selected.
- Separate Google Cloud project `bettercallz-automations`, OAuth client **BetterCallz n8n Sheets**, same exact callback. Owner test account saved and verified. The n8n credential reports Account connected with only the `spreadsheets` scope; account-wide spreadsheet access was explicitly approved. Sheets API is enabled; both Google HTTP nodes select this credential. Live Sheet delivery succeeded. Google app is In production with explicit approval; owner reauthorization after publishing completed and the n8n credential reports Saved and Account connected.
- Vercel production commit `b202835` is Ready, latest deployment `9r3GMjRW5AeS75josJKnKp8DKND7`. The token is saved as a production secret. Header Auth credential `hcxtoTLMH3mX7O7p` is selected on all three backend HTTP nodes. Its initial missing Bearer prefix was corrected by the owner; an authenticated n8n request now succeeds. Both workflows are now published; live downstream acceptance is not complete.
- Selected form: `Generated form 09/23/2026 11:26pm` on the BetterCallz Page, selected from authenticated n8n lists.
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
- 34 automated tests passed, including live-transcript regressions for human-call assent and daily volume, plus form surname/email aliases. Coverage includes 20 concurrent deliveries of one lead, replay after success, uncertain provider acceptance, invalid inputs/auth, exact Sheet mapping, distinct email labeling, actual Meta payload normalization and Sheet overwrite protection.
- Live read-only database audit confirmed RLS enabled on existing lead/call tables with no client policies. Campaign table and queue access is service-role only.
- These are local/mock tests; they do not prove live Meta OAuth, Sarvam agent behavior, telephony, Google delivery or Resend delivery.
- Pending live checks: website call, n8n test lead, one campaign call with context and correct opening, transcript/extraction, one Sheet row, one Resend email, replay without second call, final website regression.

## Live verification findings (2026-09-24)

- Meta Page 1302922599577525 and form 2239207380194362 verified through authenticated API. Active leadgen subscription points to the dedicated n8n production webhook.
- Test lead 1140704748383052 matches the authorized phone ending 5666. Meta testing UI remained Pending. Controlled signed event replays are downstream tests, not proof of Meta-originated delivery.
- n8n fetched the real lead and passed normalization; backend returned 503 before dispatch. Safe runtime diagnostics report only SARVAM_WEBHOOK_SECRET missing, storage configured and valid campaign version.
- Direct atomic reservation with the exact first normalized payload succeeded: call 2382fde6-8dfe-4e38-aba1-128bb009b4b5, state reserved. Reuse this Meta ID for verification; never create a replacement ID to bypass idempotency.
- Production diagnostic deployment ByKXECHGvMhtfmc2tNs7jsBD3uPd is Ready. TypeScript and all 9 campaign tests pass.
- Google branding saved with BetterCallz homepage/privacy/terms. Publishing is enabled but remains awaiting explicit approval; app is still Testing.
- Pending: owner saves webhook secret, production rebuild, campaign call/transcript/Sheet/email, replay protection, website regression, actual Meta-originated delivery, Google token longevity.


## Completed downstream acceptance

- Owner saved the missing webhook secret and production was rebuilt; safe diagnostics confirmed successful dispatch thereafter.
- Intake execution 25 succeeded; call 2382fde6-8dfe-4e38-aba1-128bb009b4b5 completed with provider ID 7927e574-7e48-4c6f-aba7-e05031716a53 and a 19-turn transcript.
- Row 2 was acknowledged at 2026-09-24T16:24:49Z; Resend accepted email 01a0d43b-1c6b-7698-a799-5e92a054a7fa to the configured recipient. This proves provider acceptance, not inbox read status.
- Exact Meta ID replay returned duplicate=true, accepted, completed and the original call ID. No reset or replacement ID was used to bypass dispatch protection.
- First email is an immutable test artifact with sparse extraction. Do not resend or relabel it as corrected. The new extractor preserves explicit manual calling, human-call assent, and daily volume without converting it to monthly.
- Generated form field aliases are published in n8n as BetterCallz generated form aliases; first stored payload remains immutable.
- Main was fast-forwarded from 8fbc117 to b202835 after verifying ancestry; unrelated working-tree changes remain untouched.
- Google publishing approval received and In production verified. Owner completed the new consent; Saved and Account connected verified in n8n.


