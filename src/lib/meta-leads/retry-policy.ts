export type RetryOutcome = "BUSY" | "NO_ANSWER" | "CONFIRMED_CALL_FAILURE" | "PROVIDER_TIMEOUT" | "COMPLETED" | "CONNECTED" | "DO_NOT_CALL" | "WRONG_NUMBER" | "UNKNOWN";

export function shouldRetryCall(status: RetryOutcome, attemptCount: number) {
  if (attemptCount >= 3) return { retry: false, reason: "RETRY_EXHAUSTED" };
  return { retry: ["BUSY", "NO_ANSWER", "CONFIRMED_CALL_FAILURE", "PROVIDER_TIMEOUT"].includes(status), reason: status };
}

// Use named-zone calendar parts, then construct an explicitly offset IST timestamp.
// India has no daylight-saving transitions. Storage always uses UTC ISO strings.
export function getNextCallTime(attemptNumber: number, currentTime = new Date()): Date {
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1 || attemptNumber > 3 || !Number.isFinite(currentTime.getTime())) throw new Error("Invalid attempt or time");
  const due = new Date(currentTime.getTime() + (attemptNumber === 2 ? 45 : attemptNumber === 3 ? 180 : 0) * 60000);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(due).map(p => [p.type, p.value]));
  const hour = Number(parts.hour);
  if (hour >= 8 && hour < 21) return due;
  const ten = new Date(`${parts.year}-${parts.month}-${parts.day}T10:00:00+05:30`);
  if (hour >= 21) ten.setTime(ten.getTime() + 86400000);
  return ten;
}

export function classifyMetaOutcome(payload: {status: string; failure_reason?: string | null; duration?: number | null; interaction_id?: string | null; interaction_transcript?: unknown[] | null}): RetryOutcome {
  const reason = (payload.failure_reason || "").toLowerCase();
  if (/\b(dnd|ndnc|do.not.call|refused|declined|opt.out|not interested|stop calling|don't call)\b/.test(reason)) return "DO_NOT_CALL";
  if (/\b(wrong|invalid|unallocated|disconnected) (?:phone )?number\b/.test(reason)) return "WRONG_NUMBER";
  if (payload.status === "connected") return "COMPLETED";
  // Conflicting evidence is never permission to redial.
  if (payload.interaction_id || (payload.duration ?? 0) > 0 || payload.interaction_transcript?.length) return "CONNECTED";
  if (payload.status === "busy") return "BUSY";
  if (payload.status === "no_answer") return "NO_ANSWER";
  // Only explicit provider confirmation. Bare failed/timeout and HTTP exceptions stay UNKNOWN.
  if (payload.status === "failed" && /(?:not connected|could not (?:connect|place)|never connected)/.test(reason)) {
    return /timeout|timed out/.test(reason) ? "PROVIDER_TIMEOUT" : "CONFIRMED_CALL_FAILURE";
  }
  return "UNKNOWN";
}
