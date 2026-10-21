import Link from "next/link";
import { currentDrop } from "@/lib/drops";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-cols">
          <div className="foot-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.logo.src ?? "/brand/batec-logo-negative.png"} alt="BATEC" width={site.logo.width} height={site.logo.height} loading="lazy" />
            <p>{site.claim}</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li>
                <Link href="/#shop">
                  Drop {currentDrop.number} — {currentDrop.name}
                </Link>
              </li>
              <li>
                <a href={site.store} target="_blank" rel="noopener">
                  Online store ↗
                </a>
              </li>
              <li>
                <Link href="/#drops">Drops</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>BATEC</h4>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                {site.social.instagram ? (
                  <a href={site.social.instagram} target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                ) : (
                  <span className="pending">Instagram — URL pending</span>
                )}
              </li>
              <li>
                {site.social.tiktok ? (
                  <a href={site.social.tiktok} target="_blank" rel="noopener noreferrer">
                    TikTok
                  </a>
                ) : (
                  <span className="pending">TikTok — URL pending</span>
                )}
              </li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              {site.legal.map((l) => (
                <li key={l.slug}>
                  <Link href={`/legal/${l.slug}`}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="foot-base">
          <span>© 2026 BATEC</span>
          <span>Barcelona · 41.39° N 2.17° E</span>
        </div>
      </div>
    </footer>
  );
}
