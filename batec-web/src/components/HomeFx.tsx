"use client";

import { useEffect } from "react";
// Plain JS module (ported from the approved design preview).
import { initHome } from "@/lib/home-interactions";

export type TeeRow = [slug: string, color: string, melt: string, bodyHex: string, meltHex: string, shopHandle: string | null];

/** Attaches the homepage animations and the wardrobe to the server-rendered markup. Renders nothing. */
export function HomeFx({ tees, store, priceWords }: { tees: TeeRow[]; store: string; priceWords: string }) {
  useEffect(() => {
    const cleanup = initHome({ tees, store, priceWords });
    return cleanup;
  }, [tees, store, priceWords]);
  return null;
}
