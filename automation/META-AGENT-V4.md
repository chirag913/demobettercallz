# Meta agent v4 deployment contract

Verified 2026-09-25. Production uses the committed BetterCallz Meta Lead Follow-up agent with `SARVAM_META_APP_VERSION=4`. Draft edits do not update a pinned deployment: commit the agent, update the version setting, and redeploy Vercel.

## Inputs and reporting

- Send `lead_context` and `user_name` on every Meta call. An unknown name must be an empty string to override the agent template's example name.
- Sarvam outputs are `call_summary` and `preferred_next_step` (`Human sales call`, `Not interested`, `Unknown`). The backend extracts its qualification fields independently from the transcript; it does not depend on these two outputs.
- Meta emails include self-reported form answers separately from conversation-supported qualification, call duration, and up to eight recent prospect responses. Missing qualification is labelled rather than invented.
- A completed call is not necessarily a qualified lead. Sarvam's v4 success metric counts an explicit human-call request, so other useful conversations may not meet that metric.
- Previously saved email payloads retain their original contents for idempotent delivery. Already-sent emails are not resent by this change.

## Agent settings to review for a future version

V4 has a three-minute call limit, an English quiet-caller nudge after five seconds, and a voicemail asking prospects to call back. The nudge can conflict with a natural goodbye; inbound callback handling should be verified before relying on the voicemail's callback invitation.

## Validation

Run `node --test tests/demo-leads.test.mjs tests/meta-leads.test.mjs tests/meta-retries.test.mjs`, TypeScript, lint on changed source files, and the production build. After deployment, verify the Vercel production deployment is Ready for the intended commit. A new answered call is still needed to validate the changed report end to end.
