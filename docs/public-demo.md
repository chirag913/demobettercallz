# BetterCallz public demo

The home page starts with “Your leads are already coming in. What happens next?” and explains how BetterCallz calls leads, has the first sales conversation, qualifies their needs, and gives salespeople useful context. The inline phone form remains the primary action: “LET IT CALL ME,” with “Live sales call · ~60 seconds · No signup required.” The existing AI-call disclosure remains visible beneath it.

Public demo calls use project `bettercallz-live`, a dedicated Sarvam agent, and the existing outbound → webhook → transcript → intelligence persistence pipeline. The 2026-09-21 redesign changes public presentation only; the phone submission, call status, reset, and analysis flow are preserved. Existing F Premiere project routes retain their own agent and extraction.

## Homepage presentation

The page follows the lead-to-sales sequence: a compact workflow beneath the hero, the business problem, five steps from incoming lead to sales conversation, the sales output example, instant lead calling and lead recovery, a conversational challenge, the conceptual sales workflow, and the final CTA. The challenge now sits below the business case as “Now try to break it,” with truthful AI identity disclosure stated explicitly.

The “Conversation brief” card is labeled “Illustrative example · Real estate” and “Not a customer result or your live call.” Its intent, requirement, budget, timeline, concern, and suggested site visit are illustrative values, separate from the visitor's actual post-call intelligence. The sales workflow explicitly says sources and destinations depend on workflow/API setup and that the services shown are not all native integrations.

Navigation retains Live demo, Projects, and Contact, with “Try the live call” as the header CTA and Live demo/Projects available on mobile. The dark final CTA remains, now reading “Put BetterCallz on your next batch of leads,” with live-call and contact actions.

This extends the existing visual language: unchanged global color and radius tokens, unchanged Geist typography, subtle borders, established spacing, and restrained surfaces. `PRODUCT.md` and `DESIGN.md` were already absent before this work; no new visual system or system documentation was introduced.

## Configuration

- Apply migrations `0001` through `0005` in order. On the connected existing project, `0004_contact_inquiries.sql` and `0005_public_demo.sql` were applied during implementation.
- Keep the existing Supabase, Sarvam Voice, Sarvam Chat, app URL, and webhook-secret variables described in `.env.example`.
- Set `SARVAM_DEMO_AGENT_ID` to the dedicated demo agent and `SARVAM_DEMO_APP_VERSION` to its committed version. These were added to the existing Vercel Production environment.
- Set the dedicated agent's stable instructions to `src/lib/sarvam/public-demo-prompt.ts`. Its prompt is installed in Sarvam itself, not rewritten per call. No variables are required by this agent. The property agent's configuration is separate.
- Committed agent version 6 preserves the original Shubh male voice at 1.11x speed and neutral pitch, matching the earlier BetterCallz/property agent. Interruption and language switching remain enabled; calls start in Hindi and are capped at three minutes.

## Revised conversation direction

The repository prompt now prioritizes discovery, contextual follow-ups, current-versus-future business memory, topic changes, short responses and a natural ending. It removes the proactive AI opening, unsolicited test invitation, recurring pitches and stock acknowledgements. Direct identity questions still receive an honest AI disclosure; the website remains explicitly labeled as an AI demo.

Published the repository prompt and greeting to dedicated Sarvam agent version 6 on 2026-09-20. All greeting translations were regenerated and the Hindi male opening verified. Production SARVAM_DEMO_APP_VERSION is pinned to 6. The provider sends no runtime prompt override, so future prompt edits must also be committed in Sarvam. A subsequent answered-call transcript exposed an abrupt transition to work questions, repeated transitions and leading sales assumptions. Version 4 softens the greeting, leaves room for the visitor to choose a topic, and explicitly discourages those habits in Hindi and English. Version 5 changes only the first 15–20 seconds: a greeting, brief acknowledgement, natural bridge and easy first question. It removes the something-in-mind/just-chat lines; the rest of the prompt and voice settings are preserved. Version 6 removes the quick-word bridge and uses a short acknowledgement followed directly by an easy question, with an answer-specific first follow-up. Later instructions, the greeting and voice settings remain unchanged. The new opening still needs an answered-call listening check.

No public demo is simulated: without its dedicated agent configuration and durable storage, calling is unavailable. The existing project demo still supports its explicitly labeled simulation mode. Provider status is asynchronous; the website does not pretend to detect live speech, context updates, or connection events the provider has not reported.

## Reveal

The actual completed-call transcript is sent through the existing Sarvam Chat provider. A dedicated extraction returns business, lead source, sales process, pain, qualification, explicit intent, and context. Every extracted business fact must carry a verbatim quote found in a prospect turn; facts with unmatched quotes are discarded. A quote match is a grounding check, not a guarantee of semantic correctness, so the result remains a sales aid for human review. Unknown values remain unknown. No artificial score is displayed.

The sales summary appears before the expandable transcript, headed “The call is only half the story” and “Here’s what your salesperson needs to know.” Actual extracted facts and their evidence appear under “AI outcome · Conversation & qualification.” Missing facts remain “Not shared.” The separate “Ready for the human follow-up” section presents the suggested handoff and makes clear that the sales outcome is still to be determined. The existing extraction and transcript logic are unchanged.

Suggested next steps do not claim any notification, booking, message, or callback occurred; the reveal explicitly says no salesperson has been notified automatically. The separate contact form persists inquiries and attempts a Resend team notification when configured; see `contact.md` for configuration and failure behavior.

## Verification

1. Run `npm run lint`, `node --test tests/*.test.mjs`, and `npm run build`.
2. Open `/` on desktop/mobile; verify primary phone form, navigation, use cases and contact links.
3. With production configuration, enter an owned/authorized Indian phone number. Submit once. Answer the call, describe a business and lead source, then interrupt or change language. Ask whether it is AI. Confirm it identifies itself truthfully.
4. End the phone call. Wait for the provider webhook and analysis. Check displayed values against the transcript, including omitted facts. Expand “See the conversation.” Use “Try another call” to reset the form.
5. Test `/contact` with invalid values and then a clearly labeled test inquiry. Confirm database row and success state. Storage failures must retain details and show an error.
6. Smoke-test `/projects`, `/projects/f-premiere`, and `/projects/f-premiere/agent` to ensure the property flow remains available.

The connected Supabase project received two labeled contact verification inquiries across local and production testing. Do not treat that test record as a business inquiry.

Production verification on 2026-09-20: one authorized outbound call reached voicemail and completed through the real webhook with a 28-second transcript. This verified transport and persistence, but not conversational quality, interruptions or language switching with a human. The test exposed bare-null unknown facts, now normalized without relaxing evidence checks, and stale default greeting translations, regenerated in committed agent version 2. All eight automated tests, lint and production build pass. A human-answered call remains the final voice-quality check.

Scoped homepage verification on 2026-09-21: lint, the production build, and all 12 automated tests passed. Checked navigation destinations returned HTTP 200. Responsive checks at 390, 1065, and 1440 pixels showed no horizontal overflow. The presentation diff preserves the phone flow and backend; no new phone call was placed during this turn, so these checks do not establish fresh end-to-end call or voice-quality verification. Production deployment was verified Ready. The live homepage renders the new copy with calling enabled, an invalid phone submission returns an error, and an existing completed call renders the revised reveal with stored intelligence, unknown values, evidence quotes, and its expandable 37-turn transcript. No new outbound call was placed. Agent configuration, voice settings, and the earlier conversation-change history above were not changed by this work.
