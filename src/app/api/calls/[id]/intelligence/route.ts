import { NextRequest, NextResponse } from "next/server";
import { getCall, updateCall } from "@/lib/db/repository";
import { buildAgentKnowledgeBrief, getProject } from "@/lib/knowledge/service";
import { extractConversationIntelligence, IntelligenceError } from "@/lib/intelligence/extractConversationIntelligence";

// The Sarvam chat completion this route waits on can take up to ~25-30s.
// Vercel's default serverless timeout (10s on Hobby) isn't enough headroom.
export const maxDuration = 45;

/**
 * Analyzes a completed call's existing transcript into Conversation
 * Intelligence — never re-triggers Sarvam or creates a second transcript.
 * Idempotent: returns the stored result unless ?regenerate=true is passed.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const regenerate = request.nextUrl.searchParams.get("regenerate") === "true";

  let call;
  try {
    call = await getCall(id);
  } catch (err) {
    console.error("GET call for intelligence failed", err);
    return NextResponse.json({ error: "Conversation intelligence is temporarily unavailable." }, { status: 500 });
  }

  if (!call) {
    return NextResponse.json({ error: "Call not found." }, { status: 404 });
  }

  if (call.status !== "completed") {
    return NextResponse.json({ error: "This call has not completed yet." }, { status: 400 });
  }

  if (call.conversationIntelligence && !regenerate) {
    return NextResponse.json({ intelligence: call.conversationIntelligence });
  }

  const project = getProject(call.projectId);
  if (!project) {
    return NextResponse.json({ error: "Project knowledge is temporarily unavailable." }, { status: 500 });
  }

  try {
    const intelligence = await extractConversationIntelligence({
      transcript: call.transcript ?? [],
      projectName: project.name,
      knowledgeBrief: buildAgentKnowledgeBrief(project.id),
    });

    await updateCall(call.id, { conversationIntelligence: intelligence });

    return NextResponse.json({ intelligence });
  } catch (err) {
    if (err instanceof IntelligenceError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("POST /api/calls/[id]/intelligence failed", err);
    return NextResponse.json(
      { error: "Conversation intelligence is temporarily unavailable." },
      { status: 500 },
    );
  }
}
