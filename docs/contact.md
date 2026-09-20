# Contact page

The `/contact` page extends the existing cream/black, Geist-based landing-page design. It reuses AppShell, Button, Input, existing design tokens, Zod, and the server-only Supabase admin client. The voice provider, webhook, transcript and intelligence pipeline are unchanged.

## Deployment

1. Apply `supabase/migrations/0004_contact_inquiries.sql` to the existing Supabase project.
2. Configure the existing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` variables. No new environment variables are needed.
3. Run `npm ci`, `npm run lint`, and `npm run build`. Building requires access to Google Fonts, as before.

Inquiries are stored in `public.contact_inquiry`, with a server-generated timestamp and `/contact` source. RLS denies public access; the service-role client inserts records. There is intentionally no in-memory success fallback. Without Supabase or the migration, submission returns 503 and retains the form details.

No Resend integration exists in this repository. Email notifications and visitor confirmations are therefore not implemented, and the UI makes no email-delivery claim. The team must review the inquiry table until an email integration is configured.

## Verification

- Run `node --test tests/contact.test.mjs` for malformed input, field validation, origin checking, missing configuration, database errors and confirmed persistence (mocked database boundary).
- Run `npm run dev` and open `/contact` at desktop and mobile widths. Submit an empty form; verify field errors and focus on Name.
- Complete every required field, leave Website blank, and submit. With Supabase configured, verify one row in `contact_inquiry` and the “Got it. We’ll be in touch.” state. Without configuration, verify an error and retained values. A live database submission must still be verified in the configured environment.
- Follow Contact in the header/footer and the secondary landing-page buttons. Complete a demo call and follow “Build this for my business.” Demo buttons remain the primary actions.

The user subsequently expanded this work to include the full public demo journey. See `public-demo.md` for that flow and its separate Sarvam agent.
