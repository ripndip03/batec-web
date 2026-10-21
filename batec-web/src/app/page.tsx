import { Hero } from "@/components/home/Hero";
import { Ticker } from "@/components/home/Ticker";
import { FirstHeartbeat } from "@/components/home/FirstHeartbeat";
import { ShopTheDrop } from "@/components/home/ShopTheDrop";
import { BatecWorld } from "@/components/home/BatecWorld";
import { CampaignEditorial } from "@/components/home/CampaignEditorial";
import { NextDrop } from "@/components/home/NextDrop";
import { Newsletter } from "@/components/Newsletter";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Ticker />
      <FirstHeartbeat />
      <ShopTheDrop />
      <BatecWorld />
      <CampaignEditorial />
      <NextDrop />
      <Newsletter />
    </>
  );
}
