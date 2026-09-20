# Contact page

The `/contact` page extends the existing cream/black, Geist-based landing-page design. It reuses AppShell, Button, Input, existing design tokens, Zod, and the server-only Supabase admin client. The contact form operates separately from the voice, webhook, transcript and intelligence pipeline.

## Deployment

1. Apply `supabase/migrations/0004_contact_inquiries.sql` to the existing Supabase project.
2. Configure the existing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` variables. No new environment variables are needed.
3. Run `npm ci`, `npm run lint`, and `npm run build`. Building requires access to Google Fonts, as before.

Inquiries are stored in `public.contact_inquiry`, with a server-generated timestamp and `/contact` source. RLS denies public access; the service-role client inserts records. There is intentionally no in-memory success fallback. Without Supabase or the migration, submission returns 503 and retains the form details.

After confirmed persistence, the route sends a plain-text team notification through Resend, with all form fields and the visitor's address as Reply-To. Configure server-only `RESEND_API_KEY`, `CONTACT_EMAIL_FROM` (a verified sender), and `CONTACT_EMAIL_TO` (the team's destination) in Vercel Production, then redeploy. No visitor confirmation email is sent. Resend API acceptance is not an inbox-delivery guarantee.

Resend configuration and live delivery verification are pending account access and the user's destination address. If notification fails or configuration is missing, the inquiry remains saved, the API reports `emailAccepted: false`, and the success page explicitly says the notification could not be confirmed. The team can recover inquiries from `contact_inquiry`. There is no background retry worker; failures are logged without personal data. A failed database insert never sends email.

## Verification

- Run `node --test tests/contact.test.mjs` for malformed input, field validation, origin checking, missing configuration, database errors and confirmed persistence (mocked database boundary).
- Run `npm run dev` and open `/contact` at desktop and mobile widths. Submit an empty form; verify field errors and focus on Name.
- Complete every required field, leave Website blank, and submit. With Supabase configured, verify one row in `contact_inquiry` and the “Got it. We’ll be in touch.” state. Without configuration, verify an error and retained values. Labeled inquiries were saved during both local and production verification. The production success state and exactly one matching Production Verification row were confirmed.
- Follow Contact in the header/footer and the secondary landing-page buttons. Complete a demo call and follow “Build this for my business.” Demo buttons remain the primary actions.

The user subsequently expanded this work to include the full public demo journey. See `public-demo.md` for that flow and its separate Sarvam agent.

