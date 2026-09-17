# BetterCallz AI — Phase 1 MVP

AI Sales Intelligence for Real Estate. Turn a real-estate project into a verified knowledge base and an
AI sales agent that can place a real outbound phone call, hold a natural Hindi / Hinglish / English
conversation grounded only in approved project facts, and refuse to answer anything it isn't sure of.

This is a **new, standalone application** — it does not read from, write to, or depend on the existing
bettercallz.com codebase in any way. It is intended to deploy at `demo.bettercallz.com`.

> All project data (Godrej Arden, its price, RERA number, amenities, etc.) is a **fictional demo
> dataset** invented for this demonstration — see `src/data/demoProject.ts` and
> `src/data/demoKnowledge.ts`. None of it describes the real Godrej Arden project.

## Product overview

The MVP proves one flow end to end:

```
Project → Project Intelligence → AI Sales Agent → Phone Number → CALL ME → Real Phone Call
→ Conversation (Hindi/Hinglish/English) → No Hallucination → Transcript → Result
```

Routes:

| Route | Purpose |
|---|---|
| `/` | Overview / landing |
| `/projects` | Project list (single seeded demo project) |
| `/projects/[id]` | Project dashboard |
| `/projects/[id]/intelligence` | Verified knowledge layer + anti-hallucination test |
| `/projects/[id]/preview` | Public-facing generated landing page |
| `/projects/[id]/agent` | AI Sales Agent — enter a number, press CALL ME |
| `/calls/[id]` | Call result: duration, language, outcome, transcript, recording |
| `/api/calls`, `/api/calls/[id]` | Create / read a call |
| `/api/calls/[id]/intelligence` | Analyze a completed call's transcript into Conversation Intelligence |
| `/api/webhooks/sarvam` | Sarvam Instant Outbound completion webhook |

## Architecture

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**, hand-built design-system primitives in
  `src/components/ui` (shadcn-style, no external registry dependency).
- **Canonical Project Knowledge service** (`src/lib/knowledge/service.ts`) is the single source of truth.
  The dashboard, the Project Intelligence screen, the public preview landing page, and the Sarvam agent
  context all read from this one module — no fact is ever hardcoded twice.
- **Demo data** lives in `src/data/` (`demoProject.ts`, `demoKnowledge.ts`, `demoInventory.ts`) and is the
  only thing you need to replace to point the app at a real project.
- **Voice provider abstraction** (`src/lib/sarvam/types.ts` — `VoiceProvider`) with two implementations:
  - `SarvamVoiceProvider` — real outbound calls via Sarvam's Instant Outbound API.
  - `DemoVoiceProvider` — simulates the same interface with zero credentials (see Demo Mode below).
  `src/lib/sarvam/index.ts#getVoiceProvider()` picks the right one based on whether Sarvam env vars are
  fully configured — nothing else in the app branches on Demo vs Real mode directly.
- **Persistence** (`src/lib/db/repository.ts`) uses Supabase when configured, otherwise an in-memory
  fallback (`src/lib/db/memory-store.ts`) so `npm run dev` works before Supabase is set up. The fallback
  does **not** survive a server restart or work across serverless instances — configure Supabase for
  anything beyond local demoing.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Opens on `http://localhost:3000` (or pass `-p <port>`). With no env vars set, the app runs fully in
**Demo Mode** — every screen works, including a simulated phone call.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql` — creates `project`, `project_knowledge`,
   `lead`, and `call` tables and seeds the demo project row.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in
   `.env.local` (or your Vercel project's environment variables).

The service role key is only ever read server-side (`src/lib/supabase/admin.ts`, imports `server-only`)
and is never sent to the client.

## Sarvam setup

Sarvam's [Instant Outbound API](https://docs.sarvam.ai/api-reference/instant-outbound) is used for real
calls. Real Mode activates automatically once **all** of the following are set — until then, every call
runs in Demo Mode instead:

```
SARVAM_API_KEY=            # from your Sarvam dashboard
SARVAM_AGENT_ID=           # your voice agent's app_id
SARVAM_PHONE_NUMBER=       # the outbound caller ID Sarvam dials from
SARVAM_ORG_ID=             # Sarvam org id
SARVAM_WORKSPACE_ID=       # Sarvam workspace id
SARVAM_CONNECTION_ID=      # telephony connection id configured in Sarvam
NEXT_PUBLIC_APP_URL=       # publicly reachable HTTPS URL, used to build the webhook callback
```

Sarvam scopes every call under an org / workspace / connection, which is more than the three variables
named in the original product brief (`SARVAM_API_KEY`, `SARVAM_AGENT_ID`, `SARVAM_PHONE_NUMBER`) — the
extra `SARVAM_ORG_ID` / `SARVAM_WORKSPACE_ID` / `SARVAM_CONNECTION_ID` vars are required by Sarvam's API
itself and are documented here per the brief's own instruction to document any additional configuration
Sarvam requires.

Authentication for Instant Outbound is the Conversations API header `X-API-Key` (this is **not** the
speech/text `api-subscription-key` header).

`SARVAM_APP_VERSION` is optional and left unset by default, which tells Sarvam to run the agent's latest
**committed** version on every call — so editing the agent's instructions in the Sarvam dashboard and
clicking Commit takes effect on the live site immediately, no redeploy needed. Set it to a specific
number to pin production to that version instead, per Sarvam's own guidance ("bump it deliberately as
part of your release process") — useful once you've tested a version and don't want further dashboard
edits to change live behavior until you choose to.

`SARVAM_WEBHOOK_SECRET` is optional — Sarvam does not document a signature/HMAC header for verifying
webhook authenticity, so this is a shared-secret convention. When it is set, each outbound request
automatically appends `?secret=<value>` to `webhook_config.url`. You do not need a separate dashboard
webhook registration for Instant Outbound; Sarvam POSTs to the URL supplied on that call.

**Important limitation, documented honestly rather than worked around:** Sarvam does not publish a
polling endpoint for live call status, nor does its completion webhook include a recording URL. This
MVP's Real Mode therefore:
- Shows `CALLING...` / `CALL IN PROGRESS` optimistically after the API accepts the call, and only reaches
  a final `CALL COMPLETE` / `CALL FAILED` state (with transcript) once the completion webhook lands.
- Always shows "Recording unavailable for this call" for real calls, because Sarvam doesn't return one.

### Webhook setup

Point Sarvam's webhook configuration (or your own reverse proxy / tunnel for local testing) at:

```
POST https://<your-deployment>/api/webhooks/sarvam
```

The handler is idempotent — a duplicate delivery for a call already in a terminal state is a no-op — and
matches the incoming `attempt_id` back to the call we created (falling back to the `callId` we passed in
`webhook_config.metadata` at call time).

### How to make a test call

1. Set all `SARVAM_*` env vars and `NEXT_PUBLIC_APP_URL` (use an HTTPS tunnel like `ngrok` for local
   testing, since Sarvam can't reach `localhost`).
2. Open `/projects/godrej-arden/agent`.
3. Enter a phone number you have permission to call and press **CALL ME**.
4. The header will show **Real Mode** and the live panel will say **Real Call**.

## Demo Mode vs Real Mode

| | Demo Mode | Real Mode |
|---|---|---|
| Activates when | Any `SARVAM_*` var is missing | All `SARVAM_*` vars + `NEXT_PUBLIC_APP_URL` are set |
| What happens on CALL ME | A simulated call, purely time-based (`src/lib/sarvam/demo-simulation.ts`) — no telephony, no external request | A real outbound PSTN call via Sarvam |
| Transcript | Generated deterministically from the same knowledge brief the real agent would receive, including a live demonstration of the anti-hallucination refusal | Returned by Sarvam's webhook at call end |
| Labeling | Every call and the header nav both show **Demo Mode** / **Demo Call** | Both show **Real Mode** / **Real Call** |

The app never pretends a simulated call is real, and never silently falls back to Demo Mode without
saying so in the UI.

## Conversation Intelligence

Once a call reaches `CALL COMPLETE`, the call result page (`/calls/[id]`) automatically analyzes the
existing Sarvam/demo transcript — no second recording or transcription pipeline — into a structured
buyer profile: lead temperature, budget/configuration/location/timeline (with a supporting transcript
quote per field), buying signals, objections, a Knowledge Guard read of every project-related question
the lead asked, and a grounded next-best-action recommendation. See `src/lib/intelligence/`.

Two things are deliberately separated:

- **Extraction vs. scoring.** The LLM (`extractConversationIntelligence.ts`) only ever extracts evidence
  already present in the transcript — it never assigns a score or a HOT/WARM/COLD label. `scoreLead.ts`
  is a pure, deterministic function that computes both from the extracted evidence, with all weights in
  one place for easy tuning.
- **Knowledge Guard reuses, never duplicates**, the existing verified/unverified/restricted taxonomy
  from `src/lib/knowledge/service.ts` — it classifies each project-related question the lead asked
  against that same knowledge base rather than maintaining its own copy.

Enable it by setting one more env var (get it from Sarvam's general **Sarvam API** product at
[indus.sarvam.ai](https://indus.sarvam.ai) → API Keys — a different product/key from `SARVAM_API_KEY`,
which is for the Voice Agents / Instant Outbound product used to place calls):

```
SARVAM_CHAT_API_KEY=
```

Without it, the call result page still works end to end — the Conversation Intelligence section shows
"Conversation intelligence is temporarily unavailable." with a **Retry Analysis** button instead of
crashing the page. The same graceful fallback covers an empty transcript, a malformed LLM response, and
a request timeout (30s). The result is stored on the call record (`call.conversation_intelligence`,
see `supabase/migrations/0002_conversation_intelligence.sql`) and the analysis is idempotent — refreshing
the page, or POSTing to `/api/calls/[id]/intelligence` again, returns the stored result instead of
re-analyzing, unless `?regenerate=true` is passed.

### How to test Demo Mode

Leave all `SARVAM_*` vars unset, run `npm run dev`, and walk the flow on `/projects/godrej-arden/agent` —
the call progresses through `CALLING...` → `CALL IN PROGRESS` → `CALL COMPLETE` in about 30 seconds with
no external services required.

## Anti-hallucination

Every fact in `src/data/demoKnowledge.ts` carries a `verificationStatus` of `verified`, `unverified`, or
`restricted`. `buildAgentKnowledgeBrief()` (`src/lib/knowledge/service.ts`) turns these into the exact
text handed to the Sarvam agent as call context, and `buildAgentInstructions()`
(`src/lib/sarvam/agent-prompt.ts`) wraps it with explicit rules: never invent price, availability,
possession, RERA, discounts, payment plans, amenities, inventory, or developer claims; refuse with
*"I don't have verified information on that"* for anything outside the approved facts; and never disclose
facts marked `restricted` (e.g. discount policy) even if asked directly. The Project Intelligence page's
"Test the AI" section runs a lightweight client-side keyword match against the same knowledge layer as a
quick illustration of the rule (it does not call a live model) — the Demo Mode call transcript
demonstrates the same refusal for real, live, in a simulated phone conversation.

## Deploying to Vercel

1. Push this repository to GitHub (already configured to
   [github.com/chirag913/demobettercallz](https://github.com/chirag913/demobettercallz)).
2. Import the repo as a new Vercel project — framework preset `Next.js` is auto-detected.
3. Add every variable from `.env.example` to the Vercel project's Environment Variables (Production and
   Preview). Set `NEXT_PUBLIC_APP_URL` to the deployment's own URL.
4. Deploy.

### Custom domain (demo.bettercallz.com)

1. In the Vercel project → Settings → Domains, add `demo.bettercallz.com`.
2. Vercel will show either a `CNAME` record (pointing `demo` to `cname.vercel-dns.com`) or an `A` record
   to add. Add that record in whatever DNS provider manages `bettercallz.com` — this repo makes no
   assumption about which provider that is.
3. Wait for DNS propagation and Vercel's automatic SSL certificate to issue.
4. Update `NEXT_PUBLIC_APP_URL` to `https://demo.bettercallz.com` and update the Sarvam webhook URL to
   match, then redeploy.

## What is intentionally deferred to Phase 2

Per the product brief: Salesforce, WhatsApp, lead scoring / Lead DNA, property matching, next-best-action,
full CRM, billing, advanced analytics, site-visit scheduling, campaign management, multi-tenancy, and
enterprise permissions. The "View Lead Intelligence →" button on the call result page is present but
disabled, showing "Coming in the next phase" — this is the intentional seam for that future work.
