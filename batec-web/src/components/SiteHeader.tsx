"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { Logo } from "./ui";

/**
 * Search, account and bag icons are intentionally absent: they appear only once
 * those features are implemented (Phase 4).
 */
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
      <header
        className={`sticky top-[env(safe-area-inset-top,0px)] z-50 border-b text-paper transition-colors duration-300 ${
          solid ? "border-[#2a2a2a] bg-ink/90 backdrop-blur-md" : "border-transparent bg-transparent"
        }`}
      >
        <div className="gutter flex h-[68px] items-center justify-between gap-6">
          <Link href="/" aria-label="BATEC, home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden gap-9 lg:flex">
            {site.nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group relative py-2 font-mono text-xs uppercase tracking-[0.16em]"
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0.5 left-0 h-[1.5px] bg-red transition-[right] duration-300 ${
                      active ? "right-0" : "right-full group-hover:right-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
          <button
            ref={btnRef}
            type="button"
            className="-mr-3 grid h-12 w-12 place-items-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="relative block h-3.5 w-6">
              <span className={`absolute left-0 h-[1.5px] w-6 bg-current transition-transform ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 h-[1.5px] w-6 bg-current transition-opacity ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-[1.5px] w-6 bg-current transition-transform ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-0 z-40 flex flex-col justify-between bg-ink text-paper"
        style={{
          paddingTop: "calc(110px + env(safe-area-inset-top,0px))",
          paddingBottom: "calc(32px + env(safe-area-inset-bottom,0px))",
          paddingLeft: "max(16px, env(safe-area-inset-left,0px))",
          paddingRight: "max(16px, env(safe-area-inset-right,0px))",
        }}
      >
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {site.nav.map((item) => (
            <Link key={item.href} href={item.href} className="display text-[clamp(40px,12vw,64px)] leading-[1.05] hover:text-red">
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="eyebrow text-mute-dark">{site.tagline} · 41.39° N 2.17° E</p>
      </div>
    </>
  );
}
