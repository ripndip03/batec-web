import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";

export const metadata: Metadata = { title: "About", description: "BATEC was born in Barcelona in 2026. In Catalan, batec means heartbeat." };

export default function AboutPage() {
  return (
    <PageStub eyebrow="About BATEC" title="BATEC is more than a name. It's a heartbeat." phase="Editorial layout — Phase 3">
      <p>BATEC was born in Barcelona in 2026.</p>
      <p>In Catalan, BATEC means heartbeat.</p>
      <p>We created this brand to represent the energy of a generation, the creativity of the streets and the feeling of belonging to something bigger.</p>
      <p>Our first heartbeat started in Barcelona, but our story doesn&apos;t stop there.</p>
      <p>Every city has a rhythm. Every generation has a voice.</p>
      <p className="display-semi text-2xl">This is ours.</p>
    </PageStub>
  );
}
