import type { Product, ProductImage, Variant } from "./types";
import { showDrafts } from "./site";

/**
 * DROP 001 — SAFA · Melted Heart Tee.
 * Photos live in /public/products/melted-heart-tee/<slug>-front.webp and -back.webp.
 * Checkout happens in the Shopify store: `shopHandle` is the product handle there.
 * Sizes and stock are managed in Shopify, so they stay null here.
 */
type Seed = [
  color: string,
  melt: string,
  bodyHex: string,
  meltHex: string | [string, string],
  shopHandle: string | null,
];

const PRICE = { amount: 2700, currency: "EUR" } as const;

// Order = order on the wardrobe rail.
const seeds: Seed[] = [
  ["Black", "Fuchsia Melt", "#141414", "#F72575", "batec-001-melted-heart-tee-black-pink-melt"],
  ["White", "Pink Melt", "#FAFAF8", "#E8365E", "batec-001-melted-heart-tee-white"],
  ["Off-White", "Navy Melt", "#EFEBE2", "#22356E", "batec-001-melted-heart-tee-white-blue-melt"],
  ["Brown", "Honey Melt", "#3A2418", "#E0A126", "batec-001-melted-heart-tee-brown-honey-melt"],
  ["Navy", "Mint Melt", "#14223F", "#5FD8B4", "batec-001-melted-heart-tee-navy-mint-melt"],
  // Shopify title still says "Navy & Mint Melt", but this product is the pastel pink / fuchsia tee.
  ["Pastel Pink", "Fuchsia Melt", "#F6C6D3", "#E8365E", "batec-001-melted-heart-tee-navy-mint-melt-1"],
  ["Off-White", "Blaugrana Melt", "#EFEBE2", ["#A50044", "#2A3B8F"], "batec-001-melted-heart-tee-barca-inspo"],
  ["Brown", "Light Pink Melt", "#3A2418", "#F6C1D0", "batec-001-melted-heart-tee-brown"],
  ["Pastel Pink", "Mint Melt", "#F6C6D3", "#8FE3C7", "batec-001-melted-heart-tee-pink-mint-melt"],
  ["Brown", "Pink Melt", "#3A2418", "#F0437A", "batec-001-melted-heart-tee-brown-glowy-pink-melt"],
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const img = (slug: string, side: "front" | "back", label: string): ProductImage => ({
  src: `/products/melted-heart-tee/${slug}-${side}.webp`,
  alt: `Melted Heart Tee, ${label}, ${side}`,
  width: 814,
  height: 900,
});

const variants: Variant[] = seeds.map(([color, melt, bodyHex, meltHex, shopHandle]) => {
  const slug = slugify(`${color}-${melt}`);
  const label = `${color} / ${melt}`;
  return {
    id: `mht-${slug}`,
    slug,
    color,
    melt,
    bodyHex,
    meltHex,
    images: { front: img(slug, "front", label), back: img(slug, "back", label), gallery: [] },
    shopHandle,
    price: PRICE,
    sizes: null,
    availability: null,
    published: true,
  };
});

export const products: Product[] = [
  {
    id: "melted-heart-tee",
    slug: "melted-heart-tee",
    name: "Melted Heart Tee",
    dropId: "drop-001",
    description:
      "Small BATEC 001 logo on the left chest. On the back, BATEC melts into a heart with references to Barcelona: the Sagrada Família, palm trees and contemporary architecture.",
    composition: null,
    weight: null,
    care: null,
    variants,
  },
];

/** A variant can be shown when it has photos, a price and a store link. */
export const isComplete = (v: Variant) =>
  v.published && !!v.images.front && !!v.images.back && !!v.price && !!v.shopHandle;

export function visibleVariants(product: Product): Variant[] {
  return product.variants.filter((v) => isComplete(v) || showDrafts);
}

export function formatPrice(price: Variant["price"]): string | null {
  if (!price) return null;
  const euros = price.amount / 100;
  return Number.isInteger(euros) ? `${euros} €` : new Intl.NumberFormat("es-ES", { style: "currency", currency: price.currency }).format(euros);
}

export const availabilityLabel: Record<NonNullable<Variant["availability"]>, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  sold_out: "Sold out",
  coming_soon: "Coming soon",
};
