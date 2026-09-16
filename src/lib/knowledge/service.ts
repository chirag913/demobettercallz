import { demoProject, DEMO_PROJECT_ID } from "@/data/demoProject";
import { demoKnowledge } from "@/data/demoKnowledge";
import { demoInventory } from "@/data/demoInventory";
import type {
  InventoryUnit,
  KnowledgeCategory,
  KnowledgeFact,
  KnowledgeStatusCounts,
  ProjectRecord,
} from "@/lib/types";

/**
 * Canonical Project Knowledge service.
 *
 * This is the single source of truth for everything the app knows about a
 * project. The dashboard, the Project Intelligence screen, the public
 * landing page (preview), and the Sarvam agent context all call into this
 * module instead of hardcoding facts locally. Today it is backed by the
 * demo dataset in /data; swapping in a database-backed implementation later
 * only requires changing this file.
 */

function inventoryToFacts(units: InventoryUnit[]): KnowledgeFact[] {
  return units.map((unit) => ({
    id: `fact-inventory-${unit.id}`,
    projectId: unit.projectId,
    category: "inventory" as KnowledgeCategory,
    field: unit.id,
    label: unit.configuration,
    value: `${unit.areaSqft} · ${unit.priceRange} · ${unit.status === "available" ? "Available" : unit.status === "limited" ? "Limited availability" : "Sold out"}`,
    verificationStatus: unit.verificationStatus,
    source:
      unit.verificationStatus === "restricted"
        ? "Sales desk only — not for AI disclosure (demo dataset)"
        : "Approved project material (demo dataset)",
    sourceType: "inventory_sheet",
    confidence: unit.verificationStatus === "verified" ? 95 : unit.verificationStatus === "unverified" ? 65 : 100,
    verifiedAt: unit.verificationStatus === "verified" ? new Date().toISOString() : null,
    isDemoValue: true,
  }));
}

export function getProject(projectId: string): ProjectRecord | null {
  if (projectId !== DEMO_PROJECT_ID) return null;
  return demoProject;
}

export function listProjects(): ProjectRecord[] {
  return [demoProject];
}

export function getInventory(projectId: string): InventoryUnit[] {
  return demoInventory.filter((unit) => unit.projectId === projectId);
}

export function getKnowledgeFacts(projectId: string): KnowledgeFact[] {
  const staticFacts = demoKnowledge.filter((fact) => fact.projectId === projectId);
  const inventoryFacts = inventoryToFacts(getInventory(projectId));
  return [...staticFacts, ...inventoryFacts];
}

export function getKnowledgeByCategory(projectId: string): Record<KnowledgeCategory, KnowledgeFact[]> {
  const facts = getKnowledgeFacts(projectId);
  return {
    project: facts.filter((f) => f.category === "project"),
    pricing: facts.filter((f) => f.category === "pricing"),
    amenities: facts.filter((f) => f.category === "amenities"),
    inventory: facts.filter((f) => f.category === "inventory"),
  };
}

export function getKnowledgeStatusCounts(projectId: string): KnowledgeStatusCounts {
  const facts = getKnowledgeFacts(projectId);
  return {
    verified: facts.filter((f) => f.verificationStatus === "verified").length,
    unverified: facts.filter((f) => f.verificationStatus === "unverified").length,
    restricted: facts.filter((f) => f.verificationStatus === "restricted").length,
    total: facts.length,
  };
}

export function findFact(projectId: string, field: string): KnowledgeFact | undefined {
  return getKnowledgeFacts(projectId).find((f) => f.field === field);
}

/**
 * Builds the plain-text knowledge brief handed to the Sarvam agent as call
 * context. Restricted facts are explicitly listed as topics NOT to discuss
 * rather than being silently omitted, so the agent can recognize the
 * question and give the approved refusal instead of guessing.
 */
export function buildAgentKnowledgeBrief(projectId: string): string {
  const project = getProject(projectId);
  if (!project) return "";
  const facts = getKnowledgeFacts(projectId);
  const disclosable = facts.filter((f) => f.verificationStatus !== "restricted");
  const restricted = facts.filter((f) => f.verificationStatus === "restricted");

  const lines: string[] = [];
  lines.push(`PROJECT: ${project.name} by ${project.developer}`);
  lines.push(`LOCATION: ${project.location}`);
  lines.push("");
  lines.push("APPROVED FACTS (verified or unverified — mark unverified facts as such if asked to confirm):");
  for (const fact of disclosable) {
    const tag = fact.verificationStatus === "unverified" ? " [unverified]" : "";
    lines.push(`- ${fact.label}: ${fact.value}${tag}`);
  }
  if (restricted.length > 0) {
    lines.push("");
    lines.push("DO NOT DISCLOSE (restricted — respond with the standard refusal if asked):");
    for (const fact of restricted) {
      lines.push(`- ${fact.label}`);
    }
  }
  return lines.join("\n");
}

export function getRestrictedTopics(projectId: string): string[] {
  return getKnowledgeFacts(projectId)
    .filter((f) => f.verificationStatus === "restricted")
    .map((f) => f.label);
}
