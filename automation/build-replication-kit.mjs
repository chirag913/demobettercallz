import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'deliverables','bettercallz-replication-kit');
await fs.mkdir(out,{recursive:true});
const write=async(name,data)=>{const p=path.join(out,name);await fs.mkdir(path.dirname(p),{recursive:true});await fs.writeFile(p,data);};
const copy=async(from,to=from)=>write(to,await fs.readFile(path.join(root,from)));
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
execFileSync('git',['archive','--format=zip',`--output=${path.join(out,'backend-source.zip')}`,revision],{cwd:root});
await copy('.env.example','config/backend.env.example');
await copy('automation/RETRIES.md','RETRIES.md');
await copy('automation/meta-instant-call.json','workflows/reference/meta-instant-call.json');
await copy('automation/meta-sales-log.json','workflows/reference/meta-sales-log.json');
await copy('automation/build-workflows.mjs','workflows/reference/build-workflows.mjs');
await copy('automation/build-replication-kit.mjs','maintenance/build-replication-kit.mjs');
for(const file of await fs.readdir(path.join(root,'supabase/migrations'))) await copy(`supabase/migrations/${file}`,`database/${file}`);
for(const file of ['meta-lead-prompt.ts','public-demo-prompt.ts']) await copy(`src/lib/sarvam/${file}`,`agents/${file}`);
const prompt=await fs.readFile(path.join(root,'src/lib/sarvam/meta-lead-prompt.ts'),'utf8');
await write('agents/meta-agent-instructions.txt',prompt.match(/META_LEAD_PROMPT = `([\s\S]*)`;/)[1]+'\n');
await write('agents/meta-agent-greeting.txt',prompt.match(/META_LEAD_GREETING = "([^"]*)"/)[1]+'\n');
const resultSource=await fs.readFile(path.join(root,'src/lib/meta-leads/results.ts'),'utf8');
const columns=JSON.parse('['+resultSource.match(/META_SHEET_COLUMNS = \[([^\]]+)\]/)[1]+']');
await write('sheets/Leads-headers.csv',columns.join(',')+'\n');
await write('sheets/columns.json',JSON.stringify(columns,null,2)+'\n');
await write('config/replica.example.json',JSON.stringify({backendUrl:'https://YOUR-BACKEND.example.com',sheetId:'REPLACE_WITH_SHEET_ID',metaPageId:'REPLACE_WITH_PAGE_ID',metaFormId:'REPLACE_WITH_FORM_ID',timezone:'Asia/Kolkata'},null,2)+'\n');
await write('config/railway.env.example',`# Known working dedicated Railway setup; n8n 2.40.5 observed.
# Mount a persistent volume at /home/node/.n8n before creating credentials.
N8N_USER_FOLDER=/home/node
N8N_PORT=5678
PORT=5678
N8N_PROTOCOL=https
N8N_PROXY_HOPS=1
N8N_HOST=YOUR-N8N-HOST
N8N_EDITOR_BASE_URL=https://YOUR-N8N-HOST/
WEBHOOK_URL=https://YOUR-N8N-HOST/
N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
N8N_DIAGNOSTICS_ENABLED=false
GENERIC_TIMEZONE=Asia/Kolkata
TZ=Asia/Kolkata
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
# Existing service uses RAILWAY_RUN_UID=0 due to volume ownership.
# A new deployment can instead provision writable volume ownership for node.
# Preserve the n8n encryption configuration with its database backup.
`);
await write('prepare-workflows.mjs',`import fs from 'node:fs/promises';
import path from 'node:path';
const here=import.meta.dirname;
const config=JSON.parse(await fs.readFile(path.resolve(process.argv[2]||path.join(here,'config/replica.json')),'utf8'));
const url=new URL(config.backendUrl);
if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/'||url.hostname.includes('YOUR-'))throw Error('Use an HTTPS backend origin without credentials or paths');
if(!/^[A-Za-z0-9_-]{20,}$/.test(config.sheetId)||config.sheetId.includes('REPLACE'))throw Error('Set a real Sheet ID');
for(const key of ['metaPageId','metaFormId'])if(!/^\\d+$/.test(config[key]))throw Error('Set verified numeric '+key);
new Intl.DateTimeFormat('en',{timeZone:config.timezone});
await fs.mkdir(path.join(here,'workflows/generated'),{recursive:true});
for(const file of ['meta-instant-call.json','meta-sales-log.json']){
 let text=await fs.readFile(path.join(here,'workflows/reference',file),'utf8');
 text=text.replaceAll('https://demo.bettercallz.com',url.origin).replaceAll('1mzPVfZFtDDm4qaTCk7asGLItkvxs25VTlHj0K0w0iwg',config.sheetId);
 const flow=JSON.parse(text);flow.active=false;flow.settings.timezone=config.timezone;
 for(const node of flow.nodes){delete node.credentials;delete node.webhookId;if(node.type==='n8n-nodes-base.facebookLeadAdsTrigger'){node.parameters.page={__rl:true,mode:'id',value:config.metaPageId};node.parameters.form={__rl:true,mode:'id',value:config.metaFormId};}}
 await fs.writeFile(path.join(here,'workflows/generated',file),JSON.stringify(flow,null,2)+'\\n');
}
console.log('Created two inactive workflows in workflows/generated. Bind credentials in n8n before publishing.');
`);
await write('START-HERE.md',`# BetterCallz replication kit

One package for the Meta enquiry → AI call → transcript → sales Sheet + email flow.

## Start with these files

1. **SETUP.md** — ordered installation and acceptance checklist.
2. **LIVE-RESOURCES.md** — links and IDs for the existing BetterCallz installation.
3. **config/replica.example.json** + **prepare-workflows.mjs** — adapt the two n8n workflows for a new installation.
4. **config/backend.env.example** — backend configuration names; fill private values in your deployment platform.
5. **agents/** — copy-ready campaign greeting/instructions and source prompts.
6. **database/** — all seven SQL migrations in order.
7. **sheets/** — exact 32-column header template.
8. **backend-source.zip** — complete committed Next.js source, tests, package lock, existing UI/public assets and documentation.
9. **OPERATIONS.md** — troubleshooting and retry rules.

Source repository: https://github.com/chirag913/demobettercallz
Source snapshot: ${revision}
Packaged: ${new Date().toISOString()}

The user confirmed the live flow is working. Recorded engineering checks prove a completed controlled-replay call, Sheet write, email-provider acceptance and duplicate protection. The extraction correction passed 34 tests and was deployed; a separate fresh Meta-originated acceptance run was not recorded by the agent after that correction.

This is a reusable source/configuration kit, not a backup of production lead data or connected credentials. Private API keys, OAuth tokens, passwords, call recordings and customer transcripts are excluded. The separately developed launch film and the independently hosted bettercallz.com marketing-site source are outside this campaign-flow package.

For an additional campaign inside the SAME installation, reuse the current backend, credential connections and existing Sheet when appropriate. For another business, use separate infrastructure and replace BetterCallz branding/prompts/recipient configuration. The backend uses fixed internal project IDs bettercallz-meta and bettercallz-live; it is not a multi-tenant service.
`);
await write('SETUP.md',`# Replicate the flow

## 1. Choose the destination

- Same BetterCallz installation: use LIVE-RESOURCES.md and the existing Sheet. Do not create a second output consumer against the same backend queue; acknowledgement is global, not per Sheet.
- Separate installation/business: create dedicated Supabase, backend deployment, n8n storage, Meta app, Google client, Sarvam agent and Sheet. Never reuse another business's webhook app or database casually.

## 2. Backend and database

Unzip backend-source.zip into a new project. Install the lockfile with npm ci. Use a Node runtime compatible with the locked Next.js version (the kit's helper scripts use import.meta.dirname; Node 22 is a suitable baseline). Copy config/backend.env.example to .env.local for local development, and save production values in Vercel.

Fresh database: apply database/0001 through 0008 in numeric order. These include the original project/demo tables and seed rows because the full application expects them. Existing database: apply only unapplied migrations; 0007/0008 are not safe to blindly rerun. Keep service-role credentials server-only. Configure all three Supabase variables; campaign calls require durable storage.

Set NEXT_PUBLIC_APP_URL to the final public HTTPS backend origin. Configure the Sarvam voice API, org, workspace, telephony connection and outbound phone. SARVAM_CHAT_API_KEY is a separate chat-product key. Set RESEND_API_KEY, a verified CONTACT_EMAIL_FROM and the intended CONTACT_EMAIL_TO. The recipient is deployment-wide and also used by other existing notification flows.

Campaign-specific variables: SARVAM_META_AGENT_ID, SARVAM_META_APP_VERSION (positive committed version), BETTERCALLZ_META_API_TOKEN (random 32+ character value) and a nonempty SARVAM_WEBHOOK_SECRET. The webhook secret is attached automatically to each new call's callback; there is no separate static URL to manually paste into every call. Redeploy after changing environment values. An entry with a blank value is not configured.

## 3. Sarvam agent

Create or clone a dedicated campaign agent. Paste agents/meta-agent-instructions.txt and the greeting. Add the input variable lead_context (default {}), included in the agent context. The backend passes form context through agent_variables.lead_context. Configure languages, translations, voice, speed, interruption handling, silence handling and maximum duration in Sarvam, then commit and pin the version in the backend.

The existing campaign was cloned from the existing website agent. Prompt source is included; a full vendor settings/voice export is not available in this kit. For the same account, clone BetterCallz-c2acab17-9a0d v1 to retain those settings, then verify them. For a different account, select the voice and telephony configuration explicitly. The backend performs post-call extraction; no Sarvam output variable named Human sales call is needed. Keep the website demo agent separate.

## 4. Dedicated n8n

Deploy n8n (working observed version: 2.40.5) with persistent storage at /home/node/.n8n and the config/railway.env.example settings. Create the owner account. Verify database and encryption config survive a restart before connecting OAuth. The original deployment needed root-container access because Railway's volume was root-owned; writable ownership for the node user is another deployment option. Never lose the encryption key when restoring the database.

## 5. Sheet and Google

Reuse the existing Sheet for a restore of BetterCallz. For a genuinely new installation, create a Sheet tab named Leads, paste sheets/Leads-headers.csv as row 1 across columns A:Z, freeze row 1 and allocate 10,000 rows. Use filter views instead of physically sorting/deleting rows.

Create a Google Cloud OAuth web client, enable Sheets API, and set the exact redirect URI to https://YOUR-N8N-HOST/rest/oauth2-credential/callback. Add the n8n hostname to the authorized domains; provide the business homepage/privacy/terms and developer email. Configure the n8n Google Sheets OAuth credential with only https://www.googleapis.com/auth/spreadsheets. This is account-wide Sheets access. Complete consent with the Sheet owner or an account that can edit it. Move OAuth out of Testing for ongoing use and renew consent after publishing; Testing refresh tokens can expire after seven days. Google may require verification for wider distribution.

## 6. Meta

Create a separate Meta app for lead capture; set its contact/privacy/terms details, app domain and the exact n8n OAuth callback. Connect the intended Page with lead retrieval and Page webhook permissions including pages_manage_metadata. Grant the app/CRM Leads Access if the business uses Leads Access Manager. Publish the app when ready for production delivery.

Obtain the verified Page and published lead-form IDs. A form needs a phone field; the normalization supports phone_number/phone, full_name or first_name plus last_name/surname, email/email_address and company/company_name. Extra form answers become lead context. The current validation accepts Indian mobile numbers only; other countries require changing backend and workflow validation together.

## 7. Generate and import workflows

Copy config/replica.example.json to config/replica.json and fill the backend origin, Sheet ID, Page ID, Form ID and time zone. Run:

    node prepare-workflows.mjs config/replica.json

Import the two files from workflows/generated into n8n. They are inactive and contain no credentials. The files in workflows/reference still target the original BetterCallz backend/Sheet; do not import them into a new business unchanged.

Credential bindings:

| Node | Credential |
|---|---|
| BetterCallz Meta Lead | Dedicated Facebook Lead Ads OAuth |
| Trigger existing BetterCallz call | HTTP Header Auth |
| Get pending results | Same HTTP Header Auth |
| Acknowledge delivered row | Same HTTP Header Auth |
| Check existing row | Google Sheets OAuth |
| Write fixed sales row | Same Google Sheets OAuth |

Header name: Authorization. Header value: Bearer followed by one space and the exact BETTERCALLZ_META_API_TOKEN. Do not include quotes or brackets. Select the correct Page/form in the Meta node. Publish the intake and output workflows. Publishing registers the Meta webhook. Meta allows one callback per app; temporary test listeners can replace it. Stop testing and republish before checking live delivery. Use the callback shown by this installation, never the original instance's webhook UUID.

## 8. Acceptance

1. Run npm ci, npx tsc --noEmit, npm run lint, node --test tests/*.test.mjs, npm run build in the extracted source.
2. Verify authenticated GET /api/meta-leads/results returns results (possibly an empty list); incorrect credentials must return 401.
3. Use Meta's Lead Ads Testing Tool with an authorized test phone. Confirm Meta delivery and the matching n8n execution. A hand-crafted event proves downstream handling only.
4. Answer the call. Check enquiry opening, no website-demo language, real form context, no invented pricing, and natural ending.
5. Check completed call/transcript, correct daily vs monthly volume, explicit human-sales preference, one Sheet row and one email. Unknown facts must remain blank.
6. Replay the SAME meta_lead_id: response must reuse callId with duplicate=true; no second provider call/email/row.
7. Exercise the existing website demo independently and confirm its source and agent remain website_demo.

The Meta testing tool may require deleting its previous test lead before creating another. Delete only the disposable test record with the owner's approval, not the form or actual leads.
`);
await write('LIVE-RESOURCES.md',`# Existing BetterCallz resources

| Resource | Link / identifier |
|---|---|
| Demo/backend | https://demo.bettercallz.com |
| Marketing site (separate codebase) | https://www.bettercallz.com |
| Source | https://github.com/chirag913/demobettercallz |
| Production branch | main |
| n8n | https://n8n-production-26093.up.railway.app |
| Intake workflow | https://n8n-production-26093.up.railway.app/workflow/Ue6GjgUHV9n9kXeA |
| Output workflow | https://n8n-production-26093.up.railway.app/workflow/0aAg4B7WnhtuYSE1 |
| Lead Sheet | https://docs.google.com/spreadsheets/d/1mzPVfZFtDDm4qaTCk7asGLItkvxs25VTlHj0K0w0iwg/edit |
| Sheet tab | Leads; gid 699584235 |
| Meta app | BetterCallz Lead Automation; 2257340828332234 |
| Meta Page | BetterCallz; 1302922599577525 |
| Lead form | Generated form 09/23/2026 11:26pm; 2239207380194362 |
| Meta testing | https://developers.facebook.com/tools/lead-ads-testing/ |
| Campaign agent | https://indus.sarvam.ai/samvaad/build/update-agent/BetterCallz-c2acab17-9a0d |
| Campaign pinned version | 1 |
| Supabase | https://supabase.com/dashboard/project/fdbonkuuhfxbycqlivrq |
| Vercel project | https://vercel.com/decooryofficial-3585s-projects/demobettercallz |
| Railway project | 1dc8c8a3-5ee5-40c5-a878-057193a4e219 |
| Railway service | 13baab58-49d8-4298-b50c-a0f2e55ef735 |
| Railway environment | c2543b30-3558-49d4-9eec-291441004a9c |
| Railway persistent volume | cb051875-c1ac-4c6b-8f98-77640678f7e4 |
| Google Cloud project | https://console.cloud.google.com/auth/overview?project=bettercallz-automations |
| Google credential account | sharma.chirag913@gmail.com |
| Sales notification recipient | chiragsharmadm@gmail.com |

Existing OAuth callback: https://n8n-production-26093.up.railway.app/rest/oauth2-credential/callback

Existing Meta production callback (reference only): https://n8n-production-26093.up.railway.app/webhook/0db9f183-ad13-4faf-bb89-7d044be3c2f0/webhook

Existing n8n credentials: Facebook Lead Ads account (GFaZ1x6X5PXRD0ap), Header Auth account (hcxtoTLMH3mX7O7p), Google Sheets account. IDs are references, not reusable authentication. Reconnect accounts or restore a properly encrypted n8n backup to recover them.

The Vercel team name contains Decoory, but this resource is specifically demobettercallz. Do not change unrelated Decoory services.
`);
await write('OPERATIONS.md',`# Operations and handover

## Architecture

Meta Page/form → n8n normalization → authenticated POST /api/calls → atomic Supabase reservation → Sarvam outbound → /api/webhooks/sarvam → transcript + grounded extraction → Resend outbox and fixed Sheet row queue → n8n Sheets write → backend acknowledgement.

The output workflow polls every minute. Extraction/email retries use a five-minute scheduling lease. Email and Sheet retries are independent.

## Common failures

| Symptom | Check |
|---|---|
| Backend 401 | Header name Authorization; value Bearer + one space + exact saved token; redeploy after secret changes. |
| Intake 503 | Runtime diagnostics for missing config; nonempty SARVAM_WEBHOOK_SECRET; committed numeric agent version; migrations 0007 and 0008 applied. |
| Meta Pending/no execution | App published, production workflow published, Page Leads Access and webhook permissions, subscription callback; stop temporary listener and republish. |
| No audio/call | Provider attempt ID and Sarvam interaction; phone/connection/quota; do not assume a timeout means no call. |
| Dispatch review/dispatching | Reconcile the existing call ID with Sarvam. Do not reset state or invent another lead ID to retry. |
| Google access denied | Exact OAuth callback, correct account, test-user list when Testing, Sheets API, consent and editable Sheet. |
| OAuth stops later | Production publishing and renewed consent; account revocation/expiry. |
| Sheet row conflict | Restore physical row order; do not overwrite another lead. |
| Sparse summary | Review exact prospect transcript. Unsupported facts stay blank. Manual-process, daily-volume and contextual human-handoff regressions are covered by tests. |
| Email failed/review | Verified sender, Resend key and outbox state. Preserve persisted payload/idempotency key; ambiguous attempts over 23 hours require review. |

## Data contracts

POST /api/calls for Meta uses source=meta_lead_campaign, stable meta_lead_id and phone; optional name, email, company, form_id, page_id, form_context and additional_fields. The first payload is immutable. A duplicate returns the current attempt callId without dispatching another attempt. Website calls use the original projectId/phone contract and retain website_demo source.

Sheet allocation starts at row 2 and supports 9,999 leads with the current 10,000-row guard. Extend the grid and workflow guard together. Never reset the row sequence against an existing log. Writes use RAW input, and acknowledgement requires a successful one-row Google response.

## What must be backed up separately

- Supabase database (lead, call, transcripts, delivery/outbox and campaign tables).
- n8n database AND matching encryption configuration/key, stored securely together for recovery. Importable workflow JSON alone cannot restore credentials.
- Sarvam committed agent settings/voice/telephony configuration; prompts alone are not a full provider export.
- Private environment values through an appropriate secret manager; use the examples in this kit as the inventory.
- Existing Sheet and any provider-hosted recordings if business retention requires them.

## Source map

| Concern | Backend source path |
|---|---|
| Meta validation/auth/idempotency | src/lib/meta-leads/ |
| Call route | src/app/api/calls/route.ts |
| Provider dispatch | src/lib/calls/service.ts; src/lib/sarvam/sarvam-provider.ts |
| Callback | src/app/api/webhooks/sarvam/route.ts |
| Extraction | src/lib/demo-leads/extract.ts |
| Email delivery/retries | src/lib/demo-leads/deliver.ts; email.ts |
| Output queue | src/app/api/meta-leads/results/route.ts |
| Schema | supabase/migrations/ |
| Regression checks | tests/meta-leads.test.mjs; tests/demo-leads.test.mjs |

Rebuild this package from the original repo with node automation/build-replication-kit.mjs. A copy of that builder is in maintenance/; in an extracted source checkout, copy it into automation/ first. It snapshots committed source; commit intended changes first. No cloud state is changed by generating this kit.
`);
const files=[];
async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())await walk(p);else if(entry.name!=='MANIFEST.json')files.push({path:path.relative(out,p).replaceAll('\\','/'),bytes:(await fs.stat(p)).size,sha256:createHash('sha256').update(await fs.readFile(p)).digest('hex')});}}
await walk(out);
await write('MANIFEST.json',JSON.stringify({sourceRevision:revision,createdAt:new Date().toISOString(),files},null,2)+'\n');
console.log(JSON.stringify({folder:out,files:files.length+1,sourceRevision:revision}));
