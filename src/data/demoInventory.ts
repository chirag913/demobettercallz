import { DEMO_PROJECT_ID } from "./demoProject";
import type { InventoryUnit } from "@/lib/types";

/** All values are demo placeholders — see demoProject.ts for context. */
export const demoInventory: InventoryUnit[] = [
  {
    id: "unit-3bhk",
    projectId: DEMO_PROJECT_ID,
    configuration: "3 BHK",
    areaSqft: "1,450 – 1,650 sq ft",
    priceRange: "₹2.85 Cr onwards",
    status: "available",
    verificationStatus: "verified",
  },
  {
    id: "unit-4bhk",
    projectId: DEMO_PROJECT_ID,
    configuration: "4 BHK",
    areaSqft: "2,100 – 2,400 sq ft",
    priceRange: "₹3.75 Cr onwards",
    status: "limited",
    verificationStatus: "verified",
  },
  {
    id: "unit-penthouse",
    projectId: DEMO_PROJECT_ID,
    configuration: "Penthouse",
    areaSqft: "3,800 sq ft",
    priceRange: "Price on request",
    status: "limited",
    verificationStatus: "restricted",
  },
];
