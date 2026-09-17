import { DEMO_PROJECT_ID } from "./demoProject";
import type { KnowledgeFact } from "@/lib/types";

const PROVIDED_SOURCE = "Provided project material (demo dataset)";
const now = new Date().toISOString();

/**
 * The canonical knowledge layer for the demo project. This is the ONLY place
 * project/pricing facts are defined — the dashboard, the intelligence
 * screen, the public preview page, and the Sarvam agent context all read
 * from this list (plus demoInventory.ts for inventory) via
 * lib/knowledge/service.ts.
 *
 * Only facts explicitly confirmed for this demo are listed here. Anything
 * volatile that was not confirmed (possession date, current inventory,
 * discounts, payment plan, amenities) is deliberately left OUT rather than
 * invented — the agent's standard refusal line covers those questions, the
 * same way it already does for any other unlisted topic.
 */
export const demoKnowledge: KnowledgeFact[] = [
  // PROJECT
  {
    id: "fact-developer",
    projectId: DEMO_PROJECT_ID,
    category: "project",
    field: "developer",
    label: "Developer",
    value: "Jaypee Greens",
    verificationStatus: "verified",
    source: PROVIDED_SOURCE,
    sourceType: "project_brochure",
    confidence: 95,
    verifiedAt: now,
    isDemoValue: true,
  },
  {
    id: "fact-location",
    projectId: DEMO_PROJECT_ID,
    category: "project",
    field: "location",
    label: "Location",
    value: "Jaypee Greens Sports City, Yamuna Expressway, Greater Noida",
    verificationStatus: "verified",
    source: PROVIDED_SOURCE,
    sourceType: "project_brochure",
    confidence: 98,
    verifiedAt: now,
    isDemoValue: true,
  },
  {
    id: "fact-configurations",
    projectId: DEMO_PROJECT_ID,
    category: "project",
    field: "configurations",
    label: "Configurations",
    value: "2 & 3 BHK",
    verificationStatus: "verified",
    source: PROVIDED_SOURCE,
    sourceType: "project_brochure",
    confidence: 98,
    verifiedAt: now,
    isDemoValue: true,
  },
  {
    id: "fact-rera",
    projectId: DEMO_PROJECT_ID,
    category: "project",
    field: "rera",
    label: "RERA",
    value: "UPRERAPRJ7115 · UPRERAPRJ7173 · UPRERAPRJ7195",
    verificationStatus: "verified",
    source: PROVIDED_SOURCE,
    sourceType: "rera_filing",
    confidence: 99,
    verifiedAt: now,
    isDemoValue: true,
  },

  // PRICING
  {
    id: "fact-pricing",
    projectId: DEMO_PROJECT_ID,
    category: "pricing",
    field: "startingPrice",
    label: "Starting Price",
    value: "Price on Request",
    verificationStatus: "unverified",
    source: "Not yet confirmed for public disclosure — verify with the sales team (demo dataset)",
    sourceType: "internal_notes",
    confidence: 50,
    verifiedAt: null,
    isDemoValue: true,
  },
];
