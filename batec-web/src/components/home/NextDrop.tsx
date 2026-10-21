import { nextDrop } from "@/lib/drops";
import { Countdown } from "../Countdown";

export function NextDrop() {
  if (!nextDrop) return null;
  return (
    <section id="next-drop" aria-labelledby="next-title" className="border-y border-cement bg-paper py-[clamp(72px,10vw,140px)]">
      <div className="gutter grid items-end gap-8 lg:grid-cols-[1fr_auto]">
        <h2 id="next-title" className="display text-[clamp(48px,10vw,150px)]">
          Next heartbeat.
          <span className="stroke-text block text-ink">Coming soon.</span>
        </h2>
        <div className="flex flex-col items-start gap-3">
          <span className="eyebrow text-mute-light">Drop {nextDrop.number}</span>
          {/* Countdown renders only when an official launchAt date is set in lib/drops.ts */}
          {nextDrop.launchAt ? (
            <Countdown target={nextDrop.launchAt} />
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-[0.06em]">Date to be announced</span>
          )}
        </div>
      </div>
    </section>
  );
}
