import type { Drop } from "./types";

export const drops: Drop[] = [
  {
    id: "drop-001",
    number: "001",
    name: "DREAM CITY KIDZz",
    city: "Barcelona",
    status: "live",
    launchAt: null,
    intro:
      "DROP 001 — DREAM CITY KIDZz is inspired by the streets, the energy and the dreams of a new generation.",
  },
  {
    // Name, products and date intentionally empty until BATEC announces them.
    id: "drop-002",
    number: "002",
    name: null,
    city: null,
    status: "coming_soon",
    launchAt: null,
    intro: null,
  },
];

export const currentDrop = drops.find((d) => d.status === "live")!;
export const nextDrop = drops.find((d) => d.status === "coming_soon") ?? null;
