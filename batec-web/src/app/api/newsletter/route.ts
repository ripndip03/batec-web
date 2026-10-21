import { NextResponse } from "next/server";

/**
 * Newsletter signup endpoint. Validates input server-side and forwards to the provider
 * once one is chosen (e.g. Brevo, Mailchimp, Klaviyo, Resend Audiences).
 * Until NEWSLETTER_PROVIDER is set it answers 501 and stores nothing.
 *
 * TODO (Phase 4): rate limiting per IP, double opt-in, store consent timestamp + text version.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: { email?: unknown; consent?: unknown; company?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot filled → silently accept and drop
  if (typeof body.company === "string" && body.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "invalid_email" }, { status: 422 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "consent_required" }, { status: 422 });
  }

  if (!process.env.NEWSLETTER_PROVIDER || !process.env.NEWSLETTER_API_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  // Provider integration goes here.
  return NextResponse.json({ error: "provider_not_implemented" }, { status: 501 });
}
