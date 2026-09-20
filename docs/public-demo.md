# BetterCallz public demo

The home page now starts with “Can you tell if it’s AI?” and an inline phone form. Public demo calls use project `bettercallz-live`, a dedicated Sarvam agent, and the existing outbound → webhook → transcript → intelligence persistence pipeline. Existing F Premiere project routes retain their own agent and extraction.

## Configuration

- Apply migrations `0001` through `0005` in order. On the connected existing project, `0004_contact_inquiries.sql` and `0005_public_demo.sql` were applied during implementation.
- Keep the existing Supabase, Sarvam Voice, Sarvam Chat, app URL, and webhook-secret variables described in `.env.example`.
- Set `SARVAM_DEMO_AGENT_ID` to the dedicated demo agent and `SARVAM_DEMO_APP_VERSION` to its committed version. These were added to the existing Vercel Production environment.
- Set the dedicated agent's stable instructions to `src/lib/sarvam/public-demo-prompt.ts`. Its prompt is installed in Sarvam itself, not rewritten per call. No variables are required by this agent. The property agent's configuration is separate.
- The currently committed agent version 2 uses Ritu at 1.0x speed. The user's subsequent direction requires restoring the exact male voice from the earlier BetterCallz/property agent, preserving its characteristics. Do not choose a substitute or experiment with female voices. Browser access timed out during this update, so this configuration change has not been applied. Interruption and language switching remain enabled; calls start in Hindi and are capped at three minutes.

## Revised conversation direction — pending Sarvam publication

The repository prompt now prioritizes discovery, contextual follow-ups, current-versus-future business memory, topic changes, short responses and a natural ending. It removes the proactive AI opening, unsolicited test invitation, recurring pitches and stock acknowledgements. Direct identity questions still receive an honest AI disclosure; the website remains explicitly labeled as an AI demo.

To activate this revision, inspect the earlier BetterCallz agent's male voice and copy its exact voice settings to the dedicated public agent. Replace Instructions with `PUBLIC_DEMO_PROMPT` and Greeting with `PUBLIC_DEMO_GREETING` from `src/lib/sarvam/public-demo-prompt.ts`. Regenerate all greeting translations, verify the Hindi male opening, commit a new version and update Production `SARVAM_DEMO_APP_VERSION` before redeploying. The provider sends no runtime prompt override, so editing the repository alone does not change the live voice conversation. Verify an answered call before claiming the revised conversation is live.

No public demo is simulated: without its dedicated agent configuration and durable storage, calling is unavailable. The existing project demo still supports its explicitly labeled simulation mode. Provider status is asynchronous; the website does not pretend to detect live speech, context updates, or connection events the provider has not reported.

## Reveal

The actual completed-call transcript is sent through the existing Sarvam Chat provider. A dedicated extraction returns business, lead source, sales process, pain, qualification, explicit intent, and context. Every extracted business fact must carry a verbatim quote found in a prospect turn; facts with unmatched quotes are discarded. A quote match is a grounding check, not a guarantee of semantic correctness, so the result remains a sales aid for human review. Unknown values remain unknown. No artificial score is displayed.

The sales summary appears before the expandable transcript. Suggested next steps do not claim any notification, booking, message, or callback occurred. The separate contact form persists inquiries and attempts a Resend team notification when configured; see `contact.md` for configuration and failure behavior.

## Verification

1. Run `npm run lint`, `node --test tests/*.test.mjs`, and `npm run build`.
2. Open `/` on desktop/mobile; verify primary phone form, navigation, use cases and contact links.
3. With production configuration, enter an owned/authorized Indian phone number. Submit once. Answer the call, describe a business and lead source, then interrupt or change language. Ask whether it is AI. Confirm it identifies itself truthfully.
4. End the phone call. Wait for the provider webhook and analysis. Check displayed values against the transcript, including omitted facts. Expand “See the conversation.” Use “Try another call” to reset the form.
5. Test `/contact` with invalid values and then a clearly labeled test inquiry. Confirm database row and success state. Storage failures must retain details and show an error.
6. Smoke-test `/projects`, `/projects/f-premiere`, and `/projects/f-premiere/agent` to ensure the property flow remains available.

The connected Supabase project received two labeled contact verification inquiries across local and production testing. Do not treat that test record as a business inquiry.

Production verification on 2026-09-20: one authorized outbound call reached voicemail and completed through the real webhook with a 28-second transcript. This verified transport and persistence, but not conversational quality, interruptions or language switching with a human. The test exposed bare-null unknown facts, now normalized without relaxing evidence checks, and stale default greeting translations, regenerated in committed agent version 2. All eight automated tests, lint and production build pass. A human-answered call remains the final voice-quality check.
