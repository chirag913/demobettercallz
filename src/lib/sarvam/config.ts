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
  appVersion: number;
  webhookUrl: string;
}

export function getSarvamConfig(): SarvamConfig | null {
  const apiKey = process.env.SARVAM_API_KEY;
  const appId = process.env.SARVAM_AGENT_ID;
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
    appVersion: Number(process.env.SARVAM_APP_VERSION ?? "1") || 1,
    webhookUrl: webhookUrl.toString(),
  };
}

export function isRealModeConfigured(): boolean {
  return getSarvamConfig() !== null;
}
