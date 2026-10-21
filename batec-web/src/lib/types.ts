/**
 * Domain types. Kept independent from any vendor (Shopify, Stripe, DB) so the
 * data source can later move from static files to a database or headless commerce
 * without touching the UI components.
 */

export type Availability = "in_stock" | "low_stock" | "sold_out" | "coming_soon";

export interface Money {
  /** Amount in minor units (cents) to avoid floating point errors. */
  amount: number;
  currency: "EUR";
}

export interface SizeStock {
  size: string; // e.g. "S", "M" — real size run still to be confirmed
  available: boolean;
}

export interface ProductImage {
  src: string; // path under /public or a remote URL
  alt: string;
  width: number;
  height: number;
}

export interface Variant {
  id: string;
  slug: string;
  /** Garment colour, e.g. "Black" */
  color: string;
  /** Print colourway, e.g. "Fuchsia Melt" */
  melt: string;
  /** Reference hex values used only for swatches and placeholders. */
  bodyHex: string;
  meltHex: string | [string, string];
  images: { front: ProductImage | null; back: ProductImage | null; gallery: ProductImage[] };
  /** null = not confirmed yet. The UI must never invent a value. */
  price: Money | null;
  sizes: SizeStock[] | null;
  availability: Availability | null;
  /** Only published variants appear in production. */
  published: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string; // "Melted Heart Tee"
  dropId: string;
  description: string | null;
  /** Composition, weight, care: null until supplied by the brand. */
  composition: string | null;
  weight: string | null;
  care: string[] | null;
  variants: Variant[];
}

export interface Drop {
  id: string;
  number: string; // "001"
  name: string | null; // null = not announced
  city: string | null;
  status: "live" | "coming_soon" | "archived";
  /** ISO 8601 launch date; only set when officially confirmed. */
  launchAt: string | null;
  intro: string | null;
}
