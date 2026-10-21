import type { Metadata } from "next";
import { PageStub } from "@/components/PageStub";
import { drops } from "@/lib/drops";

export const metadata: Metadata = { title: "Drops" };

export default function DropsPage() {
  return (
    <PageStub eyebrow="Drops" title="Every drop, a city" phase="Drop landing pages — Phase 3">
      <ul className="space-y-2">
        {drops.map((d) => (
          <li key={d.id} className="display-semi text-2xl">
            DROP {d.number} — {d.name ?? "Coming soon"}
          </li>
        ))}
      </ul>
    </PageStub>
  );
}
