import { drops } from "@/lib/drops";
import { HeartShape } from "../ui";

export function BatecWorld() {
  return (
    <section aria-labelledby="world-title" className="overflow-hidden bg-ink py-[clamp(72px,10vw,140px)] text-center text-paper">
      <div className="gutter grid justify-items-center gap-10">
        <span className="eyebrow text-mute-dark">The BATEC world</span>
        {/* 72 BPM beat; disabled under prefers-reduced-motion */}
        <HeartShape className="motion-beat h-auto w-[min(62vw,420px)] text-red" />
        <h2 id="world-title" className="display max-w-[16ch] text-[clamp(34px,6.4vw,96px)]">
          One heartbeat. Different cities. <em className="text-red">Endless stories.</em>
        </h2>
        <p className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-mute-dark">
          <span><b className="font-medium text-paper">batec</b> /bəˈtɛk/</span>
          <span>català · n. m.</span>
          <b className="font-medium text-paper">heartbeat</b>
        </p>
        <ul className="flex flex-wrap justify-center gap-2.5" aria-label="Drops">
          {drops.map((d) => (
            <li
              key={d.id}
              className={`border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] ${
                d.status === "live" ? "border-red text-paper" : "border-[#333] text-[#777]"
              }`}
            >
              {d.number} · {d.city ?? "Coming soon"}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
