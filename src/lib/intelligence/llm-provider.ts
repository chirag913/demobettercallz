import "server-only";

/**
 * Minimal provider abstraction for structured-JSON text extraction. This is
 * deliberately narrow (one method) — Conversation Intelligence is the only
 * consumer today. Swapping providers later means implementing this one
 * interface, not touching extractConversationIntelligence.ts.
 */
export interface StructuredLLMProvider {
  readonly name: string;
  readonly model: string;
  /**
   * Sends a system + user prompt and asks for a JSON object. Returns the
   * parsed object as unknown — callers validate with zod, since "the model
   * returned well-formed but wrong-shaped JSON" is a real failure mode to
   * handle, not something to trust blindly.
   */
  extractJson(input: { systemPrompt: string; userPrompt: string }): Promise<unknown>;
}

const SARVAM_CHAT_URL = "https://api.sarvam.ai/v1/chat/completions";
// sarvam-105b is a reasoning model: it can spend its entire token budget on
// an internal reasoning_content chain-of-thought before ever emitting the
// final answer, sometimes taking 60-130+ seconds — well past what a Vercel
// serverless function can wait for. sarvam-105b-conversations returns no
// reasoning_content and responds in single-digit-to-low-20s seconds in
// testing, so that's what's used here despite the "-conversations" name.
const SARVAM_CHAT_MODEL = "sarvam-105b-conversations";

/**
 * Sarvam's general Chat Completions API (https://docs.sarvam.ai/api-reference/chat/chat-completions) —
 * a different product/key from the Voice Agents Instant Outbound API used
 * for placing calls (see lib/sarvam/). Chosen because it's the same vendor
 * the rest of the app already relies on and is tuned for Hindi/Hinglish/
 * English code-mixed conversation, which is exactly what these transcripts
 * are.
 *
 * Uses response_format: json_object (loose, "just return valid JSON") rather
 * than the OpenAI-compatible strict json_schema mode — in testing, strict
 * schema mode on this model gets stuck emitting whitespace padding and never
 * terminates before the token budget runs out. json_object mode is fast and
 * reliable; the exact shape is instead spelled out in the prompt (see
 * prompts.ts) and any minor deviation is normalized before zod validation
 * in extractConversationIntelligence.ts.
 */
export class SarvamChatProvider implements StructuredLLMProvider {
  readonly name = "sarvam-chat";
  readonly model = SARVAM_CHAT_MODEL;

  constructor(private readonly apiKey: string) {}

  async extractJson(input: { systemPrompt: string; userPrompt: string }): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40_000);

    let response: Response;
    try {
      response = await fetch(SARVAM_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": this.apiKey,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.1,
          messages: [
            { role: "system", content: input.systemPrompt },
            { role: "user", content: input.userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Conversation analysis timed out.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Sarvam chat completion failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Sarvam chat completion returned no content.");

    try {
      return JSON.parse(content);
    } catch {
      throw new Error("Sarvam chat completion returned malformed JSON.");
    }
  }
}

export function getStructuredLLMProvider(): StructuredLLMProvider | null {
  const apiKey = process.env.SARVAM_CHAT_API_KEY;
  if (!apiKey) return null;
  return new SarvamChatProvider(apiKey);
}
