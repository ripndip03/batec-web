import Link from "next/link";
import { products, visibleVariants } from "@/lib/catalog";
import { showDrafts } from "@/lib/site";
import { ProductCard } from "../ProductCard";
import { SectionHead } from "../ui";

export function ShopTheDrop() {
  const tee = products[0];
  const variants = visibleVariants(tee);

  return (
    <section id="shop" aria-labelledby="shop-title" className="scroll-mt-20 pb-[clamp(72px,10vw,140px)]">
      <div className="gutter">
        <SectionHead eyebrow={`${tee.name} · ${tee.variants.length} colourways`} title="Shop the drop" id="shop-title" />

        {variants.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 md:gap-x-4 md:gap-y-10 xl:grid-cols-5">
            {variants.map((v) => (
              <ProductCard key={v.id} product={tee} variant={v} />
            ))}
          </div>
        ) : (
          <p className="display-semi border-y border-cement py-16 text-center text-2xl">Products launching soon.</p>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-5">
          {showDrafts && (
            <p className="m-0 max-w-[60ch] text-sm text-mute-light">
              Design preview: colour silhouettes stand in for the original front and back photos. In production only variants with confirmed photos, price and stock are shown.
            </p>
          )}
          <Link href="/shop" className="btn group border-ink bg-ink text-paper hover:border-red hover:bg-red">
            View all <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
