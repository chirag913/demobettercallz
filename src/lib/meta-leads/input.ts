import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { normalizeIndianPhone } from "@/lib/phone";

export const metaLeadSchema = z.object({
  source: z.literal("meta_lead_campaign"),
  meta_lead_id: z.string().trim().min(1).max(160).regex(/^[a-zA-Z0-9_-]+$/),
  phone: z.string().max(40).refine(v => /^[+\d\s().-]+$/.test(v)).transform(normalizeIndianPhone).refine(v => v !== null),
  name: z.string().trim().max(200).optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  company: z.string().trim().max(300).optional(),
  form_id: z.string().max(160).optional(),
  page_id: z.string().max(160).optional(),
  form_context: z.string().max(2000).optional(),
  additional_fields: z.record(z.string().max(100), z.string().max(500)).refine(v => Object.keys(v).length <= 20).optional(),
}).strict();
export type MetaLeadInput = z.infer<typeof metaLeadSchema>;
export function isMetaAuthorized(header: string | null): boolean {
  const secret = process.env.BETTERCALLZ_META_API_TOKEN;
  if (!secret || secret.length < 32 || !header) return false;
  const provided = Buffer.from(header), expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
