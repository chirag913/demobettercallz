import type { InventoryUnit } from "@/lib/types";

/**
 * No specific unit-level inventory (sizes, unit pricing, availability
 * counts) was provided for this demo project, so this is intentionally
 * empty rather than invented — see demoKnowledge.ts for the same rule
 * applied to pricing. Callers (the Project Intelligence page, the public
 * preview page) already handle an empty inventory list gracefully.
 */
export const demoInventory: InventoryUnit[] = [];
