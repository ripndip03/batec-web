"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

/** Transparent over the home hero, solid once you scroll or on any other page. */
export function SiteHeader() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const solid = !overHero || scrolled || open;

  return (
    <>
      <header className={`header${solid ? " solid" : ""}`} id="top">
        <div className="wrap">
          <Link className="logo" href="/" aria-label="BATEC, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.logo.src ?? "/brand/batec-logo-negative.png"} alt="BATEC" width={site.logo.width} height={site.logo.height} />
          </Link>
          <nav className="nav" aria-label="Main">
            {site.nav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={item.href === pathname ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            ref={btnRef}
            className="menu-btn"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
          </button>
        </div>
      </header>

      <div className="drawer" id="mobile-menu" hidden={!open}>
        <nav aria-label="Mobile">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="eyebrow">{site.tagline} · 41.39° N 2.17° E</div>
      </div>
    </>
  );
}
