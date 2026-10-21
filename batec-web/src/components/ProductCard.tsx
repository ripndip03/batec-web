"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product, Variant } from "@/lib/types";
import { availabilityLabel, formatPrice } from "@/lib/catalog";
import { TeeSilhouette } from "./ui";

export function ProductCard({ product, variant }: { product: Product; variant: Variant }) {
  const [showBack, setShowBack] = useState(false);
  const name = `${variant.color} / ${variant.melt}`;
  const price = formatPrice(variant.price);
  const hasPhotos = !!variant.images.front && !!variant.images.back;

  const face = (side: "front" | "back") => {
    const img = variant.images[side];
    if (img) {
      return <Image src={img.src} alt={img.alt} fill sizes="(min-width:1200px) 20vw, (min-width:760px) 33vw, 50vw" className="object-cover" />;
    }
    return (
      <TeeSilhouette
        bodyHex={variant.bodyHex}
        meltHex={variant.meltHex}
        side={side}
        label={`${side === "front" ? "Front" : "Back"} silhouette, ${name}`}
        className="w-[76%] drop-shadow-[0_10px_14px_rgba(0,0,0,.10)]"
      />
    );
  };

  return (
    <article className="flex min-w-0 flex-col gap-3">
      <div className="group relative aspect-[4/5] max-w-full overflow-hidden bg-cement-2">
        <div className={`absolute inset-0 grid place-items-center transition duration-500 [@media(hover:hover)]:group-hover:scale-[1.02] [@media(hover:hover)]:group-hover:opacity-0 ${showBack ? "opacity-0" : ""}`}>
          {face("front")}
        </div>
        <div className={`absolute inset-0 grid place-items-center transition duration-500 [@media(hover:hover)]:group-hover:scale-[1.02] [@media(hover:hover)]:group-hover:opacity-100 ${showBack ? "opacity-100" : "opacity-0"}`}>
          {face("back")}
        </div>
        {!hasPhotos && (
          <span className="absolute left-2.5 top-2.5 border border-dashed border-mute-light bg-paper px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-mute-light">
            Photo pending
          </span>
        )}
        {/* Touch devices have no hover: explicit toggle */}
        <button
          type="button"
          aria-pressed={showBack}
          onClick={() => setShowBack((s) => !s)}
          className="absolute bottom-2 right-2 min-h-9 border border-ink bg-paper px-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
        >
          {showBack ? "Front" : "Back"}
        </button>
      </div>

      <div className="flex flex-col gap-1.5 text-sm text-mute-light">
        <h3 className="display-semi text-[15px] leading-tight tracking-[0.01em] text-ink">{product.name}</h3>
        <span className="inline-flex items-center gap-2 text-ink">
          <i className="h-3.5 w-3.5 flex-none rounded-full border border-black/25" style={{ background: variant.bodyHex }} />
          {name}
        </span>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.06em]">{price ?? "Price TBC"}</span>
          <span className="bg-cement px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2">
            {variant.availability ? availabilityLabel[variant.availability] : "Stock TBC"}
          </span>
        </div>
      </div>
    </article>
  );
}
