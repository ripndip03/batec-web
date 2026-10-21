import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageStub } from "@/components/PageStub";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return site.legal.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = site.legal.find((l) => l.slug === slug);
  return { title: page?.label ?? "Legal", robots: { index: false } };
}

/**
 * Legal texts must be written/reviewed with the real business data
 * (LSSI-CE, GDPR/LOPDGDD, consumer law). Placeholders below, never invented data.
 */
export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = site.legal.find((l) => l.slug === slug);
  if (!page) notFound();

  return (
    <PageStub eyebrow="Legal" title={page.label} phase="Legal text pending — needs the real business data">
      <ul className="list-disc space-y-1 pl-5 font-mono text-sm">
        <li>[LEGAL NAME / TRADE NAME]</li>
        <li>[NIF / CIF]</li>
        <li>[REGISTERED ADDRESS]</li>
        <li>[CONTACT EMAIL]</li>
        <li>[COMMERCIAL REGISTRY DATA, IF APPLICABLE]</li>
      </ul>
    </PageStub>
  );
}
