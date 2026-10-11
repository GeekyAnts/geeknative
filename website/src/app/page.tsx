import { ColonyCanvas } from "@/components/colony/ColonyCanvas";
import { Hero } from "@/components/landing/Hero";
import { Idea } from "@/components/landing/Idea";
import { Agents, Apps, Closing, Contracts, HowItWorks, Parity, Triage } from "@/components/landing/Sections";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";

export default function Home() {
  return (
    // Relative, so the colony's canvas can span the whole page.
    <div className="relative">
      <Nav />
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
      <noscript>
        <style>{`.colony-fallback{opacity:1!important}`}</style>
      </noscript>
    </div>
  );
}
