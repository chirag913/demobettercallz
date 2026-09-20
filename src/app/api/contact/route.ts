import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact/schema";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Please submit through the contact page." }, { status: 403 });
  }
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 16000) return NextResponse.json({ error: "Your message is too long." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Please check your form and try again." }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "We can’t receive inquiries right now. Please try again later." }, { status: 503 });
    const inquiry = parsed.data;
    const { error } = await admin.from("contact_inquiry").insert({
      name: inquiry.name, email: inquiry.email, phone: inquiry.phone,
      company: inquiry.company, website: inquiry.website || null,
      lead_volume: inquiry.leadVolume, interest: inquiry.interest,
      message: inquiry.message, source: "/contact",
    });
    if (error) throw new Error("Contact persistence failed");
    return NextResponse.json({ submitted: true }, { status: 201 });
  } catch {
    // Never log submitted personal data or claim receipt after a storage failure.
    console.error("Contact inquiry could not be saved.");
    return NextResponse.json({ error: "We couldn’t save your inquiry. Your details are still here—please try again." }, { status: 503 });
  }
}
