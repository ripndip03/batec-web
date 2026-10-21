import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return site.nav.map((n) => ({
    url: `${site.url}${n.href === "/" ? "" : n.href}`,
    changeFrequency: "weekly",
    priority: n.href === "/" ? 1 : 0.7,
  }));
}
