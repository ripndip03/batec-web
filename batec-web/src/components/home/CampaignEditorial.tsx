import Image from "next/image";

/**
 * Shot list from the art direction. Each slot shows a labelled placeholder until
 * the real campaign photo is supplied (`image`). No invented imagery is presented as real.
 */
type Shot = {
  title: string;
  note: string;
  span: string;
  image: { src: string; alt: string } | null;
};

const shots: Shot[] = [
  { title: "24h supermarket shutter", note: "Full look in front of the metal shutter. Direct flash, night.", span: "col-span-2 lg:col-[1/8] lg:row-span-5", image: null },
  { title: "Concrete stairs", note: "Model seated, oversized fit, back print visible.", span: "lg:col-[8/13] lg:row-span-3", image: null },
  { title: "Print detail", note: "Macro of the melted heart, gloss texture.", span: "lg:col-[8/13] lg:row-span-2", image: null },
  { title: "Night street", note: "Barcelona after dark, street light and motion.", span: "lg:col-[1/5] lg:row-span-3", image: null },
  { title: "Concrete wall", note: "Group shot, mixed colourways.", span: "lg:col-[5/9] lg:row-span-3", image: null },
  { title: "City architecture", note: "Building facades as background, low angle.", span: "lg:col-[9/13] lg:row-span-3", image: null },
];

export function CampaignEditorial() {
  return (
    <section aria-labelledby="camp-title" className="bg-ink pb-[clamp(72px,10vw,140px)] text-paper">
      <div className="gutter">
        <div className="mb-10 grid gap-6 md:mb-[72px] lg:grid-cols-[auto_1fr] lg:items-end lg:gap-x-16">
          <span className="eyebrow text-mute-dark">Campaign editorial · shot list</span>
          <div>
            <p aria-hidden="true" className="relative z-10 -mb-[0.12em] origin-bottom-left -rotate-3 font-campaign text-[clamp(48px,9vw,128px)] leading-[0.9] text-fuchsia">
              Dream City
            </p>
            <h2 id="camp-title" className="display text-[clamp(44px,8vw,120px)]">KIDZz after dark</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:auto-rows-[clamp(90px,9vw,130px)] lg:grid-cols-12">
          {shots.map((s, i) => (
            <article key={s.title} className={`relative flex min-h-[220px] flex-col justify-between overflow-hidden border border-[#232323] bg-[#171717] p-3.5 text-mute-dark lg:min-h-0 ${s.span}`}>
              {s.image ? (
                <Image src={s.image.src} alt={s.image.alt} fill sizes="(min-width:900px) 50vw, 100vw" className="object-cover" />
              ) : (
                <>
                  <span className="relative font-mono text-[11px] tracking-[0.1em]">{String(i + 1).padStart(2, "0")} · PENDING PHOTO</span>
                  <div className="relative">
                    <h3 className="display-semi mb-1.5 text-[clamp(15px,1.4vw,19px)] leading-[1.1] text-paper">{s.title}</h3>
                    <p className="m-0 max-w-[34ch] text-[13px] leading-snug">{s.note}</p>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
