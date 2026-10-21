import Image from "next/image";
import Link from "next/link";
import { currentDrop } from "@/lib/drops";
import { site } from "@/lib/site";
import { Pending } from "../ui";

/** Set when the official campaign photo or video is supplied (files in /public/campaign/). */
const heroMedia: { type: "image" | "video"; src: string; alt: string; poster?: string } | null = null;

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate -mt-[68px] overflow-hidden bg-ink text-paper">
      <div className="absolute inset-0 -z-10">
        {heroMedia?.type === "image" && (
          <Image src={heroMedia.src} alt={heroMedia.alt} fill priority sizes="100vw" className="object-cover opacity-80" />
        )}
        {heroMedia?.type === "video" && (
          <video className="h-full w-full object-cover opacity-80" src={heroMedia.src} poster={heroMedia.poster} autoPlay muted loop playsInline aria-label={heroMedia.alt} />
        )}
        {!heroMedia && (
          <div
            className="shutter h-full w-full"
            role="img"
            aria-label="Reserved space for the campaign photo or video"
            style={{
              backgroundColor: "#0e0e0e",
              backgroundImage:
                "repeating-linear-gradient(0deg, rgb(255 255 255 / .035) 0 2px, transparent 2px 14px), radial-gradient(60% 50% at 72% 38%, rgb(247 37 117 / .2), transparent 70%), radial-gradient(40% 35% at 20% 80%, rgb(230 0 53 / .14), transparent 70%)",
            }}
          />
        )}
      </div>

      <div className="gutter grid min-h-[clamp(620px,96svh,940px)] grid-rows-[1fr_auto] gap-10 pb-10 pt-[120px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <span className="eyebrow text-mute-dark">Barcelona · 41.39° N 2.17° E · Est. 2026</span>
          {!heroMedia && <Pending className="text-mute-dark">Campaign photo / video — pending</Pending>}
        </div>

        <div className="grid gap-7 self-end">
          <h1 id="hero-title" className="display motion-rise -ml-[0.04em] text-[clamp(84px,24vw,360px)] leading-[0.8]">
            BATEC<span className="text-red" aria-hidden="true">.</span>
          </h1>

          <svg className="motion-trace block h-14 w-full overflow-visible text-red" viewBox="0 0 1200 56" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0 30 H430 L450 30 L462 22 L474 30 H500 L512 30 L522 4 L536 52 L548 18 L558 30 H600 L620 24 L640 30 H1200"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="grid items-end gap-7 lg:grid-cols-[1.2fr_1fr_auto]">
            <p className="display-semi motion-rise text-[clamp(20px,2.6vw,32px)] leading-[1.05] [animation-delay:.1s]">{site.tagline}</p>
            <div className="motion-rise flex flex-col gap-1.5 [animation-delay:.25s]">
              <span className="eyebrow text-mute-dark">Now showing</span>
              <strong className="display-semi text-lg not-italic tracking-[0.02em]">
                DROP {currentDrop.number} — {currentDrop.name}
              </strong>
            </div>
            <Link href="#first-heartbeat" className="btn motion-rise group border-paper bg-paper text-ink hover:border-red hover:bg-red hover:text-paper [animation-delay:.4s]">
              Explore the drop <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
