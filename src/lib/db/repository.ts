import "server-only";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { memoryStore } from "./memory-store";
import type { CallRecord, LeadRecord } from "@/lib/types";

/**
 * Lead + Call persistence. Uses Supabase when configured, otherwise falls
 * back to the in-memory store (see memory-store.ts) so the app still runs
 * end to end without any setup.
 */

function leadFromRow(row: Record<string, unknown>): LeadRecord {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    name: (row.name as string | null) ?? null,
    phone: row.phone as string,
    createdAt: row.created_at as string,
  };
}

function callFromRow(row: Record<string, unknown>): CallRecord {
  return {
    id: row.id as string,
    leadId: row.lead_id as string,
    projectId: row.project_id as string,
    provider: (row.provider as CallRecord["provider"]) ?? "demo",
    mode: (row.mode as CallRecord["mode"]) ?? "demo",
    providerCallId: (row.provider_call_id as string | null) ?? null,
    interactionId: (row.interaction_id as string | null) ?? null,
    status: row.status as CallRecord["status"],
    durationSeconds: (row.duration_seconds as number | null) ?? null,
    transcript: (row.transcript as CallRecord["transcript"]) ?? null,
    recordingUrl: (row.recording_url as string | null) ?? null,
    language: (row.language as CallRecord["language"]) ?? null,
    failureReason: (row.failure_reason as string | null) ?? null,
    startedAt: (row.started_at as string | null) ?? null,
    endedAt: (row.ended_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function callToRow(call: CallRecord): Record<string, unknown> {
  return {
    id: call.id,
    lead_id: call.leadId,
    project_id: call.projectId,
    provider: call.provider,
    mode: call.mode,
    provider_call_id: call.providerCallId,
    interaction_id: call.interactionId,
    status: call.status,
    duration_seconds: call.durationSeconds,
    transcript: call.transcript,
    recording_url: call.recordingUrl,
    language: call.language,
    failure_reason: call.failureReason,
    started_at: call.startedAt,
    ended_at: call.endedAt,
    created_at: call.createdAt,
    updated_at: call.updatedAt,
  };
}

export async function createLead(input: {
  projectId: string;
  phone: string;
  name?: string | null;
}): Promise<LeadRecord> {
  const admin = getSupabaseAdmin();
  const lead: LeadRecord = {
    id: randomUUID(),
    projectId: input.projectId,
    phone: input.phone,
    name: input.name ?? null,
    createdAt: new Date().toISOString(),
  };

  if (!admin) return memoryStore.createLead(lead);

  const { data, error } = await admin
    .from("lead")
    .insert({ project_id: lead.projectId, phone: lead.phone, name: lead.name })
    .select()
    .single();
  if (error) throw new Error(`Failed to create lead: ${error.message}`);
  return leadFromRow(data);
}

export async function createCall(input: {
  leadId: string;
  projectId: string;
  provider: CallRecord["provider"];
  mode: CallRecord["mode"];
  status: CallRecord["status"];
  language: CallRecord["language"];
}): Promise<CallRecord> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const call: CallRecord = {
    id: randomUUID(),
    leadId: input.leadId,
    projectId: input.projectId,
    provider: input.provider,
    mode: input.mode,
    providerCallId: null,
    interactionId: null,
    status: input.status,
    durationSeconds: null,
    transcript: null,
    recordingUrl: null,
    language: input.language,
    failureReason: null,
    startedAt: null,
    endedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (!admin) return memoryStore.createCall(call);

  const { data, error } = await admin.from("call").insert(callToRow(call)).select().single();
  if (error) throw new Error(`Failed to create call: ${error.message}`);
  return callFromRow(data);
}

export async function getCall(id: string): Promise<CallRecord | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return memoryStore.getCall(id);

  const { data, error } = await admin.from("call").select().eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load call: ${error.message}`);
  return data ? callFromRow(data) : null;
}

export async function getCallByProviderCallId(providerCallId: string): Promise<CallRecord | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return memoryStore.getCallByProviderCallId(providerCallId);

  const { data, error } = await admin
    .from("call")
    .select()
    .eq("provider_call_id", providerCallId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load call: ${error.message}`);
  return data ? callFromRow(data) : null;
}

export async function updateCall(id: string, patch: Partial<CallRecord>): Promise<CallRecord | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return memoryStore.updateCall(id, patch);

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.providerCallId !== undefined) row.provider_call_id = patch.providerCallId;
  if (patch.interactionId !== undefined) row.interaction_id = patch.interactionId;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.durationSeconds !== undefined) row.duration_seconds = patch.durationSeconds;
  if (patch.transcript !== undefined) row.transcript = patch.transcript;
  if (patch.recordingUrl !== undefined) row.recording_url = patch.recordingUrl;
  if (patch.language !== undefined) row.language = patch.language;
  if (patch.failureReason !== undefined) row.failure_reason = patch.failureReason;
  if (patch.startedAt !== undefined) row.started_at = patch.startedAt;
  if (patch.endedAt !== undefined) row.ended_at = patch.endedAt;

  const { data, error } = await admin.from("call").update(row).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`Failed to update call: ${error.message}`);
  return data ? callFromRow(data) : null;
}
