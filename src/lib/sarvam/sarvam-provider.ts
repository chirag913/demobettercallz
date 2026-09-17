import "server-only";
import { getSarvamConfig } from "./config";
import { buildAgentInstructions } from "./agent-prompt";
import type { CallStatusResult, CreateCallParams, CreateCallResult, TranscriptResult, VoiceProvider } from "./types";

const SARVAM_BASE_URL = "https://apps.sarvam.ai/api/outbounds/v1";

/**
 * Real Sarvam integration using the Instant Outbound API
 * (https://docs.sarvam.ai/api-reference/instant-outbound). Sarvam does not
 * expose a documented polling endpoint for call state — status, duration,
 * and the transcript arrive asynchronously via the webhook
 * (/api/webhooks/sarvam) once the attempt finishes, which is why
 * getCallStatus/getTranscript here are best-effort only and the webhook is
 * the source of truth (see app/api/webhooks/sarvam/route.ts).
 */
export class SarvamVoiceProvider implements VoiceProvider {
  readonly name = "sarvam" as const;

  async createCall(params: CreateCallParams): Promise<CreateCallResult> {
    const config = getSarvamConfig();
    if (!config) {
      throw new Error("Sarvam is not configured. Set SARVAM_API_KEY, SARVAM_AGENT_ID, SARVAM_PHONE_NUMBER and related vars.");
    }

    const instructions = buildAgentInstructions(params.projectContext);

    const url = `${SARVAM_BASE_URL}/orgs/${config.orgId}/workspaces/${config.workspaceId}/outbounds`;
    const body = {
      app_config: {
        app_id: config.appId,
        app_version: config.appVersion,
        app_type: "agent",
        connection_config: {
          connection_id: config.connectionId,
          agent_phone_number: config.agentPhoneNumber,
        },
        agent_variables: {
          agent_instructions: instructions,
          project_name: params.projectContext.projectName,
        },
      },
      user_config: {
        user_phone_number: params.phoneNumber,
      },
      webhook_config: {
        url: config.webhookUrl,
        metadata: { callId: params.callId },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Conversations / Instant Outbound auth (not the speech API's api-subscription-key).
        "X-API-Key": config.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Sarvam createCall failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as { attempt_id: string };
    if (!data.attempt_id) {
      throw new Error("Sarvam createCall succeeded but returned no attempt_id.");
    }
    // Sarvam accepted the outbound; live ringing/in-call state is not pollable.
    return { providerCallId: data.attempt_id, interactionId: null, status: "ringing" };
  }

  async getCallStatus(_providerCallId: string): Promise<CallStatusResult | null> {
    // No documented polling endpoint — state is pushed via webhook instead.
    return null;
  }

  async getTranscript(_providerCallId: string): Promise<TranscriptResult | null> {
    // Transcript arrives inline in the completion webhook payload.
    return null;
  }

  async getRecording(_providerCallId: string): Promise<string | null> {
    // Sarvam's Instant Outbound webhook does not include a recording URL.
    return null;
  }
}
