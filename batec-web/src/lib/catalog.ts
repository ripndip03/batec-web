import type { Product, Variant } from "./types";
import { showDrafts } from "./site";

/**
 * Colourways listed in the brief. Images, price, sizes and stock are null until
 * BATEC supplies them; `published` stays false until all are confirmed.
 *
 * To publish a variant:
 *   1. Add front/back photos under /public/products/melted-heart-tee/<slug>/
 *   2. Fill `images`, `price`, `sizes`, `availability`
 *   3. Set `published: true`
 */
type Seed = [color: string, melt: string, bodyHex: string, meltHex: string | [string, string]];

const seeds: Seed[] = [
  ["White", "Pink Melt", "#F4F4F2", "#F59BB8"],
  ["Black", "Fuchsia Melt", "#151515", "#F72575"],
  ["Brown", "Honey Melt", "#5A3B2A", "#E0A53C"],
  ["Brown", "Light Pink Melt", "#5A3B2A", "#F6C1D0"],
  ["Brown", "Pink Melt", "#5A3B2A", "#EE6F9A"],
  ["Navy", "Mint Melt", "#1C2440", "#9FE3C9"],
  ["Off-White", "Navy Melt", "#EDE8DC", "#1C2440"],
  ["Off-White", "Blaugrana Melt", "#EDE8DC", ["#A50044", "#004D98"]],
  ["Pastel Pink", "Fuchsia Melt", "#F6CFD8", "#F72575"],
  ["Pastel Pink", "Mint Melt", "#F6CFD8", "#9FE3C9"],
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const variants: Variant[] = seeds.map(([color, melt, bodyHex, meltHex]) => {
  const slug = slugify(`${color}-${melt}`);
  return {
    id: `mht-${slug}`,
    slug,
    color,
    melt,
    bodyHex,
    meltHex,
    images: { front: null, back: null, gallery: [] },
    price: null,
    sizes: null,
    availability: null,
    published: false,
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

/** A variant is ready to sell only when every commercial field is confirmed. */
export const isComplete = (v: Variant) =>
  v.published && !!v.images.front && !!v.images.back && !!v.price && !!v.sizes && !!v.availability;

export function visibleVariants(product: Product): Variant[] {
  return product.variants.filter((v) => isComplete(v) || showDrafts);
}

export function formatPrice(price: Variant["price"]): string | null {
  if (!price) return null;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: price.currency }).format(price.amount / 100);
}

export const availabilityLabel: Record<NonNullable<Variant["availability"]>, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  sold_out: "Sold out",
  coming_soon: "Coming soon",
};
