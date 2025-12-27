import { memo, useMemo, useRef } from "react";
import { cubicBezier, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import bg5 from "../../assets/bg5.png";

const TEXT =
  "In Japanese aesthetics, wabi-sabi finds beauty in imperfection, impermanence, and incompleteness—the philosophy that guides every piece we create.";

const EASE_ELEGANT = cubicBezier(0.25, 0.1, 0.25, 1);

// Using theme tokens (no hard-coded new colors): stone -> warm-white.
const COLOR_START = "hsl(var(--stone) / 0.35)";
const COLOR_END = "hsl(var(--warm-white) / 1)";

type RevealWordProps = {
  word: string;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
};

const RevealWord = memo(function RevealWord({ word, index, total, progress }: RevealWordProps) {
  // Key animation logic:
  // Each word gets its own small scroll segment so the reveal progresses left-to-right.
  // We add a bit of overlap to keep transitions smooth and premium.
  const start = Math.max(0, index / total - 0.02);
  const end = Math.min(1, (index + 2) / total);

  const opacity = useTransform(progress, [start, end], [0.35, 1], {
    ease: EASE_ELEGANT,
  });

  const color = useTransform(progress, [start, end], [COLOR_START, COLOR_END], {
    ease: EASE_ELEGANT,
  });

  return (
    <motion.span style={{ opacity, color, willChange: "opacity, color" }} className="inline-block">
      {word}
    </motion.span>
  );
});

export default function WabiSabiRevealSection() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  // Stable word list to avoid unnecessary work on re-renders.
  const words = useMemo(() => TEXT.split(/\s+/).filter(Boolean), []);

  // Scroll progress for this section only.
  // The section is taller than the viewport so we have a calm, premium scroll distance.
  // We keep the background+text sticky (still) until progress reaches 1 (last word revealed),
  // then the section scrolls away naturally.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      className="relative h-[220vh] w-full bg-charcoal"
      aria-label="Wabi-sabi philosophy"
    >
      {/* Sticky viewport: keeps background still while scrolling through the reveal */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Background image with elegant, strong blur (still recognizable) */}
        <div className="absolute inset-0">
          <img
            src={bg5}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover blur-xl scale-110"
            decoding="async"
            loading="lazy"
          />
          {/* Subtle dark overlay for readability */}
          <div className="absolute inset-0 bg-charcoal/60" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
          <p
            className="max-w-5xl text-center font-serif leading-[1.05] tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
            aria-label={TEXT}
          >
            {reducedMotion ? (
              <span className="text-warm-white">{TEXT}</span>
            ) : (
              // Screen readers should read the full sentence once; each animated word is aria-hidden.
              words.map((word, i) => (
                <span key={`${word}-${i}`} aria-hidden="true">
                  <RevealWord word={word} index={i} total={words.length} progress={scrollYProgress} />
                  {i < words.length - 1 ? " " : null}
                </span>
              ))
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
