"use client";

import Link from "next/link";
import { useState } from "react";

type Status = { kind: "idle" | "error" | "ok" | "info"; text: string };

export function Newsletter() {
  const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.elements.namedItem("email") as HTMLInputElement;
    const consent = form.elements.namedItem("consent") as HTMLInputElement;
    const company = (form.elements.namedItem("company") as HTMLInputElement).value; // honeypot

    if (!email.value || !email.checkValidity()) {
      setStatus({ kind: "error", text: "Enter a valid email address." });
      email.focus();
      return;
    }
    if (!consent.checked) {
      setStatus({ kind: "error", text: "Tick the consent box to subscribe." });
      consent.focus();
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, consent: true, company }),
      });
      if (res.status === 501) {
        setStatus({ kind: "info", text: "Signup isn't open yet. Your email was not stored." });
      } else if (res.ok) {
        setStatus({ kind: "ok", text: "Check your inbox to confirm your subscription." });
        form.reset();
      } else {
        setStatus({ kind: "error", text: "Something failed on our side. Try again in a few minutes." });
      }
    } catch {
      setStatus({ kind: "error", text: "No connection. Check your network and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="newsletter" aria-labelledby="nl-title" className="bg-ink py-[clamp(72px,10vw,140px)] text-paper">
      <div className="gutter grid gap-12 lg:grid-cols-2 lg:items-end lg:gap-20">
        <div>
          <h2 id="nl-title" className="display mb-5 text-[clamp(48px,8vw,120px)]">Stay in the loop.</h2>
          <p className="m-0 max-w-[36ch] text-xl text-mute-dark">Early access. New drops. BATEC worldwide.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <label htmlFor="nl-email" className="sr-only">Email</label>
          <div className="flex min-w-0 border-b-[1.5px] border-paper focus-within:border-fuchsia">
            <input
              id="nl-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="your@email.com"
              className="min-w-0 flex-1 bg-transparent py-4 text-lg text-paper outline-none placeholder:text-[#777]"
            />
            <button type="submit" disabled={busy} className="display-semi min-h-[52px] pl-4 pr-1 text-sm tracking-[0.08em] hover:text-fuchsia disabled:opacity-50">
              {busy ? "Sending…" : "Join →"}
            </button>
          </div>
          {/* Honeypot: hidden from people, bots fill it in */}
          <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <label htmlFor="nl-consent" className="flex cursor-pointer items-start gap-3 text-[13px] leading-normal text-mute-dark">
            <input
              id="nl-consent"
              name="consent"
              type="checkbox"
              required
              className="mt-0.5 h-[22px] w-[22px] flex-none cursor-pointer appearance-none border-[1.5px] border-paper checked:border-fuchsia checked:bg-fuchsia"
            />
            <span>
              I agree to receive commercial communications from BATEC about drops and early access. I can unsubscribe at any time. See the{" "}
              <Link href="/legal/privacy" className="text-paper underline">Privacy Policy</Link>.
            </span>
          </label>
          <p role="status" aria-live="polite" className={`m-0 min-h-[1.5em] font-mono text-xs ${status.kind === "error" ? "text-fuchsia" : "text-paper"}`}>
            {status.text}
          </p>
        </form>
      </div>
    </section>
  );
}
