import { HomeFx, type TeeRow } from "@/components/HomeFx";
import { Newsletter } from "@/components/Newsletter";
import { currentDrop, drops, nextDrop } from "@/lib/drops";
import { formatPrice, products, visibleVariants } from "@/lib/catalog";
import { site } from "@/lib/site";

const HEART = "M50 90 C18 66 0 48 0 26 C0 11 11 0 26 0 C36 0 44 5 50 13 C56 5 64 0 74 0 C89 0 100 11 100 26 C100 48 82 66 50 90 Z";

const shots = [
  { cls: "s1", title: "24h supermarket shutter", note: "Full look in front of the metal shutter. Direct flash, night." },
  { cls: "s2", title: "Concrete stairs", note: "Model seated, oversized fit, back print visible." },
  { cls: "s3", title: "Print detail", note: "Macro of the melted heart, gloss texture." },
  { cls: "s4", title: "Night street", note: "Barcelona after dark, street light and motion." },
  { cls: "s5", title: "Concrete wall", note: "Group shot, mixed colourways." },
  { cls: "s6", title: "City architecture", note: "Building facades as background, low angle." },
];

export default function HomePage() {
  const tee = products[0];
  const variants = visibleVariants(tee);
  const price = formatPrice(tee.variants[0].price) ?? "";
  const priceWords = tee.variants[0].price ? `${tee.variants[0].price.amount / 100} euros` : "";
  const dropLabel = `DROP ${currentDrop.number} — ${currentDrop.name}`;
  const shopUrl = (handle: string | null) => (handle ? `${site.store}/products/${handle}` : site.store);
  const bySlug = (slug: string) => tee.variants.find((v) => v.slug === slug)!;
  const featured = [
    { v: bySlug("black-fuchsia-melt"), side: "back" as const, caption: "Back · Black / Fuchsia Melt" },
    { v: bySlug("white-pink-melt"), side: "front" as const, caption: "White / Pink" },
    { v: bySlug("navy-mint-melt"), side: "back" as const, caption: "Navy / Mint" },
  ];
  const tees: TeeRow[] = variants.map((v) => [
    v.slug,
    v.color,
    v.melt,
    v.bodyHex,
    Array.isArray(v.meltHex) ? v.meltHex.join("|") : v.meltHex,
    v.shopHandle,
  ]);
  const tickerItems = Array.from({ length: 4 }).flatMap(() => [site.tagline.replace(/\.$/, ""), site.claim.replace(/\.$/, ""), dropLabel]);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-video">
          <video id="heroVid" muted loop playsInline preload="auto" poster="/hero/hero-desktop.jpg" aria-label="BATEC logo spinning" />
        </div>
        <div className="wrap">
          <div className="hero-top">
            <span className="eyebrow">Barcelona · 41.39° N 2.17° E · Est. 2026</span>
            <button className="vid-btn" id="vidBtn" type="button" aria-label="Pause video">
              <svg viewBox="0 0 14 14" aria-hidden="true">
                <rect x="2" y="1" width="3.5" height="12" />
                <rect x="8.5" y="1" width="3.5" height="12" />
              </svg>
            </button>
          </div>
          <div style={{ display: "grid", gap: 22, alignSelf: "end" }}>
            <h1 className="display rise" id="hero-title">
              BATEC<span className="dot" aria-hidden="true">.</span>
            </h1>
            <div className="monitor" aria-hidden="true">
              <canvas id="ecg" />
              <div className="bpm">
                <i />
                <b data-bpm="">72</b> BPM <span className="zone" data-zone="">resting</span>
              </div>
            </div>
            <div className="hero-bottom">
              <p className="tagline rise d1">{site.tagline}</p>
              <div className="drop-id rise d2">
                <span className="eyebrow">Now showing</span>
                <strong>{dropLabel}</strong>
              </div>
              <a className="btn btn-solid rise d3" href="#first-heartbeat" data-race="">
                Explore the drop <span className="arrow" aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Ticker ---------- */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track" id="tickerTrack">
          {tickerItems.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      {/* ---------- The first heartbeat ---------- */}
      <section className="band" id="first-heartbeat" aria-labelledby="fh-title">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Drop {currentDrop.number} / {currentDrop.city}</span>
            <h2 className="display" id="fh-title">The first heartbeat</h2>
          </div>
          <div className="fh">
            <div className="fh-copy">
              <p className="lead">Every city has a heartbeat. Ours started in Barcelona.</p>
              <p>{currentDrop.intro}</p>
              <a className="btn btn-ink" href="#shop" data-race="">
                Shop the drop <span className="arrow" aria-hidden="true">→</span>
              </a>
              <dl className="specs">
                <dt>Piece</dt>
                <dd>{tee.name}</dd>
                <dt>Front</dt>
                <dd>Small BATEC 001 logo, left chest</dd>
                <dt>Back</dt>
                <dd>Melted heart with BATEC, Sagrada Família, palm trees and contemporary architecture</dd>
                <dt>Colourways</dt>
                <dd>{tee.variants.length}</dd>
                <dt>Price</dt>
                <dd>{price}</dd>
              </dl>
            </div>
            <div className="fh-visual">
              {featured.map(({ v, side, caption }) => {
                const image = v.images[side]!;
                return (
                  <figure key={v.id}>
                    <a
                      className="buy"
                      href={shopUrl(v.shopHandle)}
                      target="_blank"
                      rel="noopener"
                      aria-label={`Buy Melted Heart Tee ${v.color} / ${v.melt}, ${priceWords} (opens the store in a new tab)`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" />
                      <span className="buy-pill">Buy · {price} ↗</span>
                      <figcaption>
                        <span className="eyebrow">{caption}</span>
                      </figcaption>
                    </a>
                  </figure>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Shop the drop: the wardrobe ---------- */}
      <section className="band" id="shop" aria-labelledby="shop-title" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              {tee.name} · {tee.variants.length} colourways · {price}
            </span>
            <h2 className="display" id="shop-title">Shop the drop</h2>
          </div>

          <div className="cabinet shut" id="cabinet">
            <div className="closet" id="closet">
              <div className="wall-back" aria-hidden="true" />
              <div className="wall-l" aria-hidden="true" />
              <div className="wall-r" aria-hidden="true" />
              <div className="ceiling" aria-hidden="true" />
              <div className="led" aria-hidden="true" />
              <span className="closet-hint" id="closetHint">Move along the rail · click a tee to turn it</span>
              <div className="rail" aria-hidden="true" />
              <div className="rack" id="rack" role="listbox" aria-label={`${tee.name} colourways`} tabIndex={0} />
              <div className="lightcone" aria-hidden="true" />
              <div className="floorboard" aria-hidden="true" />
            </div>
            <div className="door l" aria-hidden="true" />
            <div className="door r" aria-hidden="true" />
            <button className="open-doors" id="openDoors" type="button">
              Open the wardrobe
            </button>
            <button className="close-doors" id="closeDoors" type="button">
              Close the doors
            </button>
            <div className="drawer-front" id="drawerFront" aria-live="polite">
              <div className="di-name">
                <span className="di-count" id="diCount">
                  01 / {String(variants.length).padStart(2, "0")}
                </span>
                <h3 className="di-title">{tee.name}</h3>
                <span className="di-color">
                  <i className="dot2" id="diDot" />
                  <span id="diColor">—</span>
                </span>
              </div>
              <div className="di-price">
                <b>{price}</b>
                <small>Choose your size in the store</small>
              </div>
              <div className="di-actions">
                <button className="btn btn-ghost" type="button" id="diFlip">
                  View back
                </button>
                <a className="btn btn-buy" id="diBuy" href={site.store} target="_blank" rel="noopener" data-race="">
                  Buy now <span className="arrow" aria-hidden="true">↗</span>
                </a>
              </div>
              <div className="swatches" id="swatches">
                <div className="nav-arrows">
                  <button type="button" id="prevTee" aria-label="Previous colourway">
                    ←
                  </button>
                  <button type="button" id="nextTee" aria-label="Next colourway">
                    →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- The BATEC world ---------- */}
      <section className="band band-dark world" id="about" aria-labelledby="world-title">
        <div className="wrap">
          <span className="eyebrow" style={{ color: "var(--mute-dark)" }}>
            The BATEC world
          </span>
          <div className="heart-wrap">
            <canvas className="ripples" id="ripples" aria-hidden="true" />
            <svg className="heart" id="bigHeart" viewBox="0 0 100 92" aria-hidden="true" fill="currentColor">
              <path d={HEART} />
            </svg>
          </div>
          <div className="bpm" style={{ justifyContent: "center" }}>
            <i />
            <b data-bpm="">72</b> BPM <span className="zone" data-zone="">resting</span>
          </div>
          <h2 className="display" id="world-title">
            One heartbeat. Different cities. <em>Endless stories.</em>
          </h2>
          <div className="meaning">
            <span>
              <b>batec</b> /bəˈtɛk/
            </span>
            <span>català · n. m.</span>
            <span>
              <b>heartbeat</b>
            </span>
          </div>
          <ul className="cities" aria-label="Drops">
            {drops.map((d) => (
              <li key={d.id} className={d.status === "live" ? "on" : "off"}>
                {d.number} · {d.name ?? "Coming soon"}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Campaign editorial ---------- */}
      <section className="band band-dark" id="campaign" aria-labelledby="camp-title" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Campaign editorial · shot list</span>
            <div>
              <p className="camp-word" aria-hidden="true">
                {currentDrop.name}
              </p>
              <h2 className="display" id="camp-title">After dark</h2>
            </div>
          </div>
          <div className="camp-grid">
            {shots.map((s, i) => (
              <article key={s.cls} className={`shot ${s.cls}`}>
                <span className="n">{String(i + 1).padStart(2, "0")} · Pending photo</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.note}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Next drop ---------- */}
      {nextDrop && (
        <section className="band next" id="drops" aria-labelledby="next-title">
          <div className="wrap">
            <h2 className="display" id="next-title">
              Next heartbeat.<span>Coming soon.</span>
            </h2>
            <div className="next-status" id="next" data-launch={nextDrop.launchAt ?? ""}>
              <span className="eyebrow" style={{ color: "var(--mute-light)" }}>
                Drop {nextDrop.number}
              </span>
              <div className="countdown" id="countdown" hidden>
                <b id="cd-d">00</b>
                <b id="cd-h">00</b>
                <b id="cd-m">00</b>
                <b id="cd-s">00</b>
                <small>Days</small>
                <small>Hours</small>
                <small>Min</small>
                <small>Sec</small>
              </div>
              <span className="tbc" id="cd-tba">
                Date to be announced
              </span>
            </div>
          </div>
        </section>
      )}

      <Newsletter />

      <HomeFx tees={tees} store={site.store} priceWords={priceWords} />
    </>
  );
}
