import type { ProjectRecord } from "@/lib/types";

/**
 * MVP ships with exactly one seeded demo project. Only the facts explicitly
 * provided for this demo (name, tagline, location, configurations, RERA
 * numbers) are real; everything else that real-estate buyers would treat as
 * volatile (current pricing, current inventory, possession date, payment
 * plan) is deliberately left as "available on request" rather than invented
 * — see demoKnowledge.ts, which mirrors the same rule for the AI agent's
 * knowledge brief. Replace this record with client-provided, verified data
 * before any real-world use.
 */
export const DEMO_PROJECT_ID = "f-premiere";

const now = new Date().toISOString();

export const demoProject: ProjectRecord = {
  id: DEMO_PROJECT_ID,
  name: "F Premiere",
  developer: "Jaypee Greens",
  location: "Jaypee Greens Sports City, Yamuna Expressway, Greater Noida",
  status: "active",
  tagline: "Home & Soul",
  configurations: "2 & 3 BHK",
  possession: "Possession information available on request",
  rera: "UPRERAPRJ7115 · UPRERAPRJ7173 · UPRERAPRJ7195",
  projectType: "Residential apartments within Jaypee Greens Sports City",
  heroDescription:
    "A demonstration project used to showcase how BetterCallz AI turns a real-estate project into a verified knowledge base and an AI sales agent that can take a live phone call — built for Investors Clinic.",
  createdAt: now,
  updatedAt: now,
};
