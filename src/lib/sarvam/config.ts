import "server-only";

/**
 * Sarvam configuration. The three variables named in the product spec
 * (SARVAM_API_KEY, SARVAM_AGENT_ID, SARVAM_PHONE_NUMBER) are required.
 * Sarvam's Instant Outbound API additionally scopes calls under an
 * org/workspace/connection, so those are read too when present — see
 * README.md "Sarvam setup" for exactly what each one maps to.
 */
export interface SarvamConfig {
  apiKey: string;
  appId: string; // SARVAM_AGENT_ID
  agentPhoneNumber: string; // SARVAM_PHONE_NUMBER
  orgId: string;
  workspaceId: string;
  connectionId: string;
  /**
   * null tracks the agent's latest committed version at call time. Sarvam
   * requires this to be paired with versionFilter: "latest_committed" —
   * sending app_version: null alone 422s with "app_version is required
   * when version_filter is specific" (version_filter defaults to
   * "specific"). Set SARVAM_APP_VERSION to pin an explicit version instead
   * once production behavior should only change on your own schedule.
   */
  appVersion: number | null;
  versionFilter: "latest_committed" | "specific";
  webhookUrl: string;
}

export function getSarvamConfig(publicDemo = false): SarvamConfig | null {
  const apiKey = process.env.SARVAM_API_KEY;
  const appId = publicDemo ? process.env.SARVAM_DEMO_AGENT_ID : process.env.SARVAM_AGENT_ID;
  const agentPhoneNumber = process.env.SARVAM_PHONE_NUMBER;
  const orgId = process.env.SARVAM_ORG_ID;
  const workspaceId = process.env.SARVAM_WORKSPACE_ID;
  const connectionId = process.env.SARVAM_CONNECTION_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiKey || !appId || !agentPhoneNumber || !orgId || !workspaceId || !connectionId || !appUrl) {
    return null;
  }

  let webhookUrl: URL;
  try {
    webhookUrl = new URL(`${appUrl.replace(/\/$/, "")}/api/webhooks/sarvam`);
  } catch {
    return null;
  }
  const version = publicDemo ? process.env.SARVAM_DEMO_APP_VERSION : process.env.SARVAM_APP_VERSION;
  const pinnedVersion = version ? Number(version) || null : null;

  const webhookSecret = process.env.SARVAM_WEBHOOK_SECRET;
  // Sarvam does not document HMAC signing. If we set a shared secret, attach it
  // to the per-call webhook URL so Sarvam's POST includes it as ?secret=.
  if (webhookSecret) {
    webhookUrl.searchParams.set("secret", webhookSecret);
  }

  return {
    apiKey,
    appId,
    agentPhoneNumber,
    orgId,
    workspaceId,
    connectionId,
    appVersion: pinnedVersion,
    versionFilter: pinnedVersion === null ? "latest_committed" : "specific",
    webhookUrl: webhookUrl.toString(),
  };
}

export function isRealModeConfigured(): boolean {
  return getSarvamConfig() !== null;
}
