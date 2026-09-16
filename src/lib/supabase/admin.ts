import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./env";

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key. Never import this
 * from a client component — it bypasses row-level security by design.
 * Returns null when Supabase env vars are not configured, so callers can
 * fall back to the in-memory demo store (see lib/db/store.ts).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  return cached;
}
