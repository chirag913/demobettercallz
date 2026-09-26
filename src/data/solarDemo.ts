import type { ProjectRecord } from '@/lib/types';
export const SOLAR_DEMO_ID = 'solar';
// Existing, verified Sarvam SolarAgent; never fall back to the property agent.
export const SOLAR_AGENT_ID = 'SolarAgent-b2e90c51-d9fa';
export const solarProject: ProjectRecord = {
 id: SOLAR_DEMO_ID, name: 'Solar Lead Qualification', developer: 'BetterCallz', location: 'Residential & commercial solar', status: 'active',
 tagline: 'Turn a solar enquiry into a first conversation', configurations: 'Residential & commercial', possession: '', rera: '', projectType: 'Solar lead qualification demo',
 heroDescription: 'Experience a real AI call that asks about your solar requirement, electricity bill, property ownership, location and installation plans.',
 createdAt: '2026-09-26T00:00:00.000Z', updatedAt: '2026-09-26T00:00:00.000Z',
};
