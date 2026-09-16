import "server-only";
import type { CallRecord, LeadRecord } from "@/lib/types";

/**
 * In-memory fallback store, used only when Supabase env vars are not
 * configured. This keeps the MVP demoable with zero setup, but state does
 * NOT survive a server restart and is NOT shared across serverless
 * instances — it exists purely so `npm run dev` works before Supabase is
 * wired up. Configure Supabase (see .env.example) for real persistence.
 */
const leads = new Map<string, LeadRecord>();
const calls = new Map<string, CallRecord>();
const callsByProviderId = new Map<string, string>();

export const memoryStore = {
  createLead(lead: LeadRecord) {
    leads.set(lead.id, lead);
    return lead;
  },
  getLead(id: string) {
    return leads.get(id) ?? null;
  },
  createCall(call: CallRecord) {
    calls.set(call.id, call);
    if (call.providerCallId) callsByProviderId.set(call.providerCallId, call.id);
    return call;
  },
  getCall(id: string) {
    return calls.get(id) ?? null;
  },
  getCallByProviderCallId(providerCallId: string) {
    const id = callsByProviderId.get(providerCallId);
    return id ? (calls.get(id) ?? null) : null;
  },
  updateCall(id: string, patch: Partial<CallRecord>) {
    const existing = calls.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    calls.set(id, updated);
    if (updated.providerCallId) callsByProviderId.set(updated.providerCallId, id);
    return updated;
  },
};
