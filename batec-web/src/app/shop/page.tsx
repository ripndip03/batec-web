import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <PageStub eyebrow="Shop" title="Drop 001" phase="Catalogue, filters and product pages — Phase 3">
      <p>The full catalogue with size, colour, collection and availability filters is built once the product photos and data are supplied.</p>
    </PageStub>
  );
}
