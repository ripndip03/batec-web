import { Children } from "react";
import Link from "next/link";
import { site } from "@/lib/site";
import { Pending } from "./ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#2a2a2a] bg-ink text-paper">
      <div className="gutter grid gap-12 pt-14" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom,0px))" }}>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <p className="display-semi col-span-2 max-w-[18ch] text-xl leading-[1.1] lg:col-span-1">{site.claim}</p>
          <FooterCol title="Shop">
            <Link href="/shop">Drop 001</Link>
            <Link href="/drops">Drops</Link>
            <Link href="/shop#size-guide">Size guide</Link>
          </FooterCol>
          <FooterCol title="BATEC">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            {site.social.instagram ? (
              <a href={site.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
            ) : (
              <Pending className="text-[10px] text-mute-dark">Instagram — URL pending</Pending>
            )}
            {site.social.tiktok ? (
              <a href={site.social.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>
            ) : (
              <Pending className="text-[10px] text-mute-dark">TikTok — URL pending</Pending>
            )}
          </FooterCol>
          <FooterCol title="Legal">
            {site.legal.map((l) => (
              <Link key={l.slug} href={`/legal/${l.slug}`}>{l.label}</Link>
            ))}
          </FooterCol>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-[#2a2a2a] pt-6 font-mono text-[11px] uppercase tracking-[0.1em] text-mute-dark">
          <span>© 2026 BATEC</span>
          <span>Barcelona · 41.39° N 2.17° E</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Children.toArray(children);
  return (
    <div>
      <h2 className="mb-3.5 font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-mute-dark">{title}</h2>
      <ul className="flex flex-col gap-2.5 text-[15px] [&_a:hover]:text-red">
        {items.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
