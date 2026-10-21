import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";
import { Pending } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PageStub eyebrow="Contact" title="Talk to BATEC" phase="Contact form — Phase 4">
      <p>General enquiries, wholesale and collaborations.</p>
      <p>{site.contact.email ?? <Pending>Official email pending</Pending>}</p>
    </PageStub>
  );
}
