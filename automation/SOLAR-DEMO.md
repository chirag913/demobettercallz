# Solar demo

Routes: /projects/solar and /projects/solar/agent. Listed alongside F Premiere.

Uses existing Sarvam SolarAgent-b2e90c51-d9fa with latest committed version. Optional overrides: SARVAM_SOLAR_AGENT_ID and SARVAM_SOLAR_APP_VERSION. Shared existing org, workspace, API key, phone connection and webhook transport; separate app ID and project ID. Solar sends only user_name (empty when unknown), never the property-agent prompt or seeded Manan name.

Seed migration 0010_solar_demo.sql before deployment. Missing credentials/database fail closed; Solar never falls back to a simulated real-estate call. Original home demo, F Premiere and Meta routes retain their configuration.

Results show the real transcript. Solar does not run real-estate intelligence extraction or join Meta retry/Sheets/email automation. No automatic follow-up is promised.
