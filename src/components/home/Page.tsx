"use client";

import { HeroScrollZoom } from "@/components/home/HeroScrollZoom";

export default function Home() {
  return (
    <main className="bg-charcoal">
      <HeroScrollZoom />
      
      <section className="min-h-screen bg-cream flex items-center justify-center px-8">
        <div className="max-w-4xl text-center">
          <p className="text-earth/60 text-sm tracking-[0.5em] uppercase mb-8">Philosophy</p>
          <h2 className="text-charcoal text-4xl md:text-6xl font-extralight leading-tight mb-8">
            In the imperfection of clay,<br />we find perfect beauty.
          </h2>
          <p className="text-earth/70 text-lg md:text-xl font-light max-w-2xl mx-auto">
            Every piece carries the warmth of hands that shaped it, the patience of time that dried it, 
            and the fire that transformed it into something eternal.
          </p>
        </div>
      </section>
    </main>
  );
}
