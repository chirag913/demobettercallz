import type { ProjectRecord } from "@/lib/types";

/**
 * MVP ships with exactly one seeded demo project. Every value here is a
 * placeholder invented for the purposes of this demonstration — none of it
 * describes the real Godrej Arden project. Replace this record (and the
 * facts in demoKnowledge.ts) with client-provided, verified data before any
 * real-world use.
 */
export const DEMO_PROJECT_ID = "godrej-arden";

const now = new Date().toISOString();

export const demoProject: ProjectRecord = {
  id: DEMO_PROJECT_ID,
  name: "Godrej Arden",
  developer: "Godrej Properties",
  location: "Sector 106, Dwarka Expressway, Gurugram",
  status: "active",
  tagline: "Premium Residences",
  configurations: "3 & 4 BHK Residences",
  possession: "December 2028",
  rera: "HRERA-PKL-DEMO-0000",
  projectType: "High-rise residential towers",
  heroDescription:
    "A demonstration project used to showcase how BetterCallz AI turns a real-estate project into a verified knowledge base and an AI sales agent that can take a live phone call.",
  createdAt: now,
  updatedAt: now,
};
