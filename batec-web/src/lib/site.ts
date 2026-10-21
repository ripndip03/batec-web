/**
 * Brand-level configuration. Every `null` is data BATEC has not supplied yet.
 * Components render a clearly marked "pending" state instead of inventing it.
 */
export const site = {
  name: "BATEC",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://batec-web.vercel.app",
  tagline: "Every city has a heartbeat.",
  claim: "Born in Barcelona. Made for everywhere.",
  description:
    "BATEC is a streetwear brand born in Barcelona in 2026. In Catalan, batec means heartbeat. DROP 001 — SAFA.",
  /** Official logo. The negative version (black parts in off-white) is for dark backgrounds. */
  logo: { src: "/brand/batec-logo-negative.png" as string | null, width: 300, height: 227 },
  /** Show "TM" next to the logo only if the brand confirms it. */
  trademark: null as null | "TM",
  /** Checkout happens in the Shopify store. */
  store: "https://nr0tm0-tu.myshopify.com",
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
    { href: "/#shop", label: "Shop" },
    { href: "/#drops", label: "Drops" },
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
