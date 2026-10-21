import Link from "next/link";
import { products } from "@/lib/catalog";
import { Pending, SectionHead, TeeSilhouette } from "../ui";

export function FirstHeartbeat() {
  const tee = products[0];
  const featured = ["black-fuchsia-melt", "white-pink-melt", "navy-mint-melt"]
    .map((s) => tee.variants.find((v) => v.slug === s)!)
    .filter(Boolean);

  return (
    <section id="first-heartbeat" aria-labelledby="fh-title" className="scroll-mt-20 py-[clamp(72px,10vw,140px)]">
      <div className="gutter">
        <SectionHead eyebrow="Drop 001 / Barcelona" title="The first heartbeat" id="fh-title" />

        <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div>
            <p className="display-semi mb-5 text-[clamp(26px,3vw,40px)] leading-[1.05] [text-wrap:balance]">
              Every city has a heartbeat. Ours started in Barcelona.
            </p>
            <p className="mb-5 max-w-[34ch] text-[clamp(18px,1.6vw,22px)] leading-relaxed">
              DROP 001 — DREAM CITY KIDZz is inspired by the streets, the energy and the dreams of a new generation.
            </p>
            <Link href="#shop" className="btn group mt-4 border-ink bg-ink text-paper hover:border-red hover:bg-red">
              Shop the drop <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>

            <dl className="mt-9 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 border-t border-cement pt-6 text-sm">
              <dt className="eyebrow pt-0.5 text-[11px] text-mute-light">Piece</dt>
              <dd>{tee.name}</dd>
              <dt className="eyebrow pt-0.5 text-[11px] text-mute-light">Front</dt>
              <dd>Small BATEC 001 logo, left chest</dd>
              <dt className="eyebrow pt-0.5 text-[11px] text-mute-light">Back</dt>
              <dd>Melted heart with BATEC, Sagrada Família, palm trees and contemporary architecture</dd>
              <dt className="eyebrow pt-0.5 text-[11px] text-mute-light">Colourways</dt>
              <dd>{tee.variants.length} developed</dd>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {featured.map((v, i) => (
              <figure
                key={v.id}
                className={`relative m-0 grid max-w-full place-items-center overflow-hidden bg-cement-2 ${i === 0 ? "col-span-2 aspect-[16/11]" : "aspect-[4/5]"}`}
              >
                {/* Replace with next/image once v.images.* exist */}
                <TeeSilhouette bodyHex={v.bodyHex} meltHex={v.meltHex} side={i === 0 ? "back" : "front"} label={`${v.color} / ${v.melt} silhouette`} className={i === 0 ? "w-[30%]" : "w-[58%]"} />
                <figcaption className="absolute inset-x-3 bottom-3 flex flex-wrap justify-between gap-2 text-mute-light">
                  <Pending className={v.bodyHex === "#1C2440" ? "text-[#B9BCC8]" : ""}>{i === 0 ? "Back print — original file pending" : "Product photo pending"}</Pending>
                  {i === 0 && <span className="eyebrow text-[10px]">{v.color} / {v.melt}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
