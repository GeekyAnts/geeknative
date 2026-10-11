import { ColonyCanvas } from "@/components/colony/ColonyCanvas";
import { Hero } from "@/components/landing/Hero";
import { Idea } from "@/components/landing/Idea";
import { Agents, Apps, Closing, Contracts, HowItWorks, Parity, Triage } from "@/components/landing/Sections";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { SmoothScroll } from "@/components/site/SmoothScroll";

export default function Home() {
  return (
    <>
      <Nav spawn />
      <main>
        <Hero />
        <Idea />
        <Apps />
        <HowItWorks />
        <Triage />
        <Contracts />
        <Parity />
        <Agents />
        <Closing />
      </main>
      <Footer colony />
      <ColonyCanvas />
      <SmoothScroll />
      <noscript>
        <style>{`.colony-fallback{opacity:1!important}`}</style>
      </noscript>
    </>
  );
}
