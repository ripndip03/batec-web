import { currentDrop } from "@/lib/drops";
import { site } from "@/lib/site";
import { HeartShape } from "../ui";

export function Ticker() {
  const items = [site.tagline.replace(".", ""), site.claim.replace(/\.$/, ""), `Drop ${currentDrop.number} — ${currentDrop.name}`];
  const loop = [...items, ...items, ...items, ...items];
  return (
    <div className="overflow-hidden whitespace-nowrap border-y border-ink bg-red text-paper" aria-hidden="true">
      <div className="motion-tick inline-flex gap-12 py-3.5">
        {loop.map((t, i) => (
          <span key={i} className="display inline-flex items-center gap-12 text-lg leading-none">
            {t}
            <HeartShape className="h-3 w-3" />
          </span>
        ))}
      </div>
    </div>
  );
}
