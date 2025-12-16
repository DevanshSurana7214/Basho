import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import toolsImage from "@/assets/studio/pottery-tools.jpg";

const CulturalGroundingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-30%" });
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.02, 1]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  const lines = [
    "The old pond—",
    "a frog jumps in,",
    "sound of water."
  ];

  return (
    <section ref={ref} className="min-h-screen bg-paper relative overflow-hidden">
      {/* Grain overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left: Poetic text - slow, deliberate reveals */}
        <div className="flex items-center justify-center px-8 md:px-16 lg:px-24 py-32">
          <div className="max-w-sm space-y-12">
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground/60"
            >
              松尾芭蕉 — Matsuo Bashō
            </motion.p>

            <div className="space-y-2">
              {lines.map((line, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ 
                    duration: 1.2, 
                    delay: 0.5 + (index * 0.4),
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                  className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed font-light"
                >
                  {line}
                </motion.p>
              ))}
            </div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 2, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-16 h-px bg-border/50 origin-left"
            />

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, delay: 2.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-sans text-muted-foreground/70 text-sm leading-relaxed"
            >
              In Japanese aesthetics, <em className="text-foreground/80">wabi-sabi</em> finds beauty in imperfection, 
              impermanence, and incompleteness—the philosophy that guides every piece we create.
            </motion.p>
          </div>
        </div>

        {/* Right: Image with subtle parallax */}
        <motion.div 
          className="relative overflow-hidden"
          style={{ scale: imageScale }}
        >
          <motion.img
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 2, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            src={toolsImage}
            alt="Close-up of raw clay texture"
            className="w-full h-full object-cover min-h-[50vh] lg:min-h-screen"
            style={{ y: imageY }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-paper/20 to-transparent lg:hidden" />
        </motion.div>
      </div>
    </section>
  );
};

export default CulturalGroundingSection;
