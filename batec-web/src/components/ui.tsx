import { site } from "@/lib/site";

/** Marks anything waiting for a real asset or confirmed data. Never remove silently. */
export function Pending({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block border border-dashed border-current px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em] opacity-75 ${className}`}>
      {children}
    </span>
  );
}

/**
 * Official logo slot. Renders the supplied file from /public/brand/ when `site.logo.src`
 * is set. Until then: plain text placeholder. The logo must not be redrawn.
 */
export function Logo({ className = "" }: { className?: string }) {
  if (site.logo.src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={site.logo.src} alt="BATEC" width={site.logo.width} height={site.logo.height} className={className} />;
  }
  return (
    <span className={`display text-[26px] leading-none ${className}`} title="Placeholder: replace with the official logo">
      BATEC{site.trademark === "TM" && <sup className="ml-0.5 text-[10px] not-italic">TM</sup>}
    </span>
  );
}

/** Generic heart symbol (brand concept), not the logo artwork. */
export function HeartShape({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 92" className={className} fill="currentColor" aria-hidden="true">
      <path d="M50 90 C18 66 0 48 0 26 C0 11 11 0 26 0 C36 0 44 5 50 13 C56 5 64 0 74 0 C89 0 100 11 100 26 C100 48 82 66 50 90 Z" />
    </svg>
  );
}

/**
 * Reference t-shirt silhouette in the garment colour. It is NOT the product and does not
 * reproduce the original print: it only reserves the slot until real photos arrive.
 */
export function TeeSilhouette({
  bodyHex,
  meltHex,
  side = "front",
  label,
  className = "",
}: {
  bodyHex: string;
  meltHex?: string | [string, string];
  side?: "front" | "back";
  label: string;
  className?: string;
}) {
  const id = `g-${label.replace(/[^a-z0-9]/gi, "")}-${side}`;
  const stroke = Array.isArray(meltHex) ? `url(#${id})` : meltHex;
  return (
    <svg viewBox="0 0 200 210" role="img" aria-label={label} className={className}>
      {Array.isArray(meltHex) && (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor={meltHex[0]} />
            <stop offset="50%" stopColor={meltHex[1]} />
          </linearGradient>
        </defs>
      )}
      <path
        d="M70 8 C78 18 122 18 130 8 L172 24 L198 62 L170 80 L160 70 L160 204 L40 204 L40 70 L30 80 L2 62 L28 24 Z"
        fill={bodyHex}
        stroke="rgba(0,0,0,.18)"
      />
      <path d="M70 8 C78 22 122 22 130 8" fill="none" stroke="rgba(0,0,0,.22)" strokeWidth="2" />
      {meltHex && side === "front" && (
        <rect x="118" y="46" width="18" height="10" fill="none" stroke={Array.isArray(meltHex) ? meltHex[0] : meltHex} strokeWidth="1.2" strokeDasharray="2 2" />
      )}
      {meltHex && side === "back" && (
        <path
          transform="translate(62 60) scale(.76)"
          d="M50 90 C18 66 0 48 0 26 C0 11 11 0 26 0 C36 0 44 5 50 13 C56 5 64 0 74 0 C89 0 100 11 100 26 C100 48 82 66 50 90 Z"
          fill="none"
          stroke={stroke}
          strokeWidth="2.4"
          strokeDasharray="5 4"
        />
      )}
    </svg>
  );
}

export function SectionHead({ eyebrow, title, id, dark = false }: { eyebrow: string; title: React.ReactNode; id: string; dark?: boolean }) {
  return (
    <div className="mb-10 grid gap-6 md:mb-[72px] lg:grid-cols-[auto_1fr] lg:items-end lg:gap-x-16">
      <span className={`eyebrow ${dark ? "text-mute-dark" : "text-mute-light"}`}>{eyebrow}</span>
      <h2 id={id} className="display text-[clamp(44px,8vw,120px)]">
        {title}
      </h2>
    </div>
  );
}
