"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ target }: { target: string }) {
  const t = Date.parse(target);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (Number.isNaN(t)) return null;
  const d = now === null ? 0 : Math.max(0, t - now);
  const parts = [
    [Math.floor(d / 864e5), "Days"],
    [Math.floor(d / 36e5) % 24, "Hours"],
    [Math.floor(d / 6e4) % 60, "Min"],
    [Math.floor(d / 1e3) % 60, "Sec"],
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-x-5 gap-y-1 tabular-nums" role="timer" aria-label="Time until launch">
      {parts.map(([v, l]) => (
        <b key={l} className="display-semi text-[clamp(32px,4vw,52px)] leading-none">{now === null ? "--" : pad(v)}</b>
      ))}
      {parts.map(([, l]) => (
        <small key={l} className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute-light">{l}</small>
      ))}
    </div>
  );
}
