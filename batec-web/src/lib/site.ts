/**
 * Brand-level configuration. Every `null` is data BATEC has not supplied yet.
 * Components render a clearly marked "pending" state instead of inventing it.
 */
export const site = {
  name: "BATEC",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Every city has a heartbeat.",
  claim: "Born in Barcelona. Made for everywhere.",
  description:
    "BATEC is a streetwear brand born in Barcelona in 2026. In Catalan, batec means heartbeat. DROP 001 — DREAM CITY KIDZz.",
  /**
   * Official logo files go in /public/brand/. Set `src` once they are supplied.
   * Until then the header shows a plain text placeholder (not a redrawn logo).
   */
  logo: { src: null as string | null, width: 160, height: 40 },
  /** Show "TM" next to the logo only if the brand confirms it. Never ®. */
  trademark: null as null | "TM",
  contact: {
    email: null as string | null,
    business: null as string | null,
  },
  social: {
    instagram: null as string | null,
    tiktok: null as string | null,
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/drops", label: "Drops" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { slug: "legal-notice", label: "Legal notice" },
    { slug: "privacy", label: "Privacy" },
    { slug: "cookies", label: "Cookies" },
    { slug: "terms", label: "Terms of sale" },
  ],
} as const;

export const showDrafts = process.env.NEXT_PUBLIC_SHOW_DRAFTS === "true";
