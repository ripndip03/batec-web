import { Pending } from "./ui";

/** Temporary page shell for routes scheduled in later phases, so navigation never 404s. */
export function PageStub({ eyebrow, title, phase, children }: { eyebrow: string; title: string; phase: string; children?: React.ReactNode }) {
  return (
    <section className="gutter py-[clamp(72px,10vw,140px)]">
      <span className="eyebrow text-mute-light">{eyebrow}</span>
      <h1 className="display mt-6 text-[clamp(44px,8vw,120px)]">{title}</h1>
      <div className="mt-10 max-w-[65ch] space-y-5 text-lg">{children}</div>
      <Pending className="mt-10 text-mute-light">{phase}</Pending>
    </section>
  );
}
