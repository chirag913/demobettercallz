import { DEMO_PROJECT_ID } from "./demoProject";
import type { KnowledgeFact } from "@/lib/types";

const PROVIDED_SOURCE = "Provided project material (demo dataset)";
const INVESTORS_CLINIC_SOURCE = "Provided by Investors Clinic (demo dataset)";
const now = new Date().toISOString();

/**
 * The canonical knowledge layer for the demo project. This is the ONLY place
 * project/pricing facts are defined — the dashboard, the intelligence
 * screen, the public preview page, and the Sarvam agent context all read
 * from this list (plus demoInventory.ts for inventory) via
 * lib/knowledge/service.ts.
 *
 * Only facts explicitly confirmed for this demo are listed here. Anything
 * volatile that was not confirmed (possession date, current inventory
 * availability, discounts, payment plan, current amenity/operational
 * status) is deliberately left OUT rather than invented — the agent's
 * standard refusal line covers those questions, the same way it already
 * does for any other unlisted topic. The specific configuration sizes below
 * are the project's floor-plan catalog (a structural fact), not a claim
 * about what's available for sale today — see demoInventory.ts, which stays
 * empty because current availability was never confirmed.
 */
export const demoKnowledge: KnowledgeFact[] = [
  // PROJECT
  {
    id: "fact-developer",
    projectId: DEMO_PROJECT_ID,
    category: "project",
    field: "developer",
    label: "Developer",
    value: "Home & Soul Infratech",
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
    value: "GH B-3, Sector 25, Jaypee Greens Sports City, Yamuna Expressway, Greater Noida, Uttar Pradesh 201308",
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
    value: "2 BHK & 3 BHK",
    verificationStatus: "verified",
    source: PROVIDED_SOURCE,
    sourceType: "project_brochure",
    confidence: 98,
    verifiedAt: now,
    isDemoValue: true,
  },
  {
    id: "fact-configuration-sizes",
    projectId: DEMO_PROJECT_ID,
    category: "project",
    field: "configurationSizes",
    label: "Available Configurations & Sizes",
    value: "2 BHK: 1256 / 1435 / 1656 / 1685 sq ft — 3 BHK: 2219 / 2604 sq ft",
    verificationStatus: "verified",
    source: INVESTORS_CLINIC_SOURCE,
    sourceType: "project_brochure",
    confidence: 90,
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
