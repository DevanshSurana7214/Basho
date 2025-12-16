import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef } from "react";
import handsImage from "@/assets/hero/hands-pottery-wheel.jpg";
import kilnImage from "@/assets/studio/kiln.jpg";
import toolsImage from "@/assets/studio/pottery-tools.jpg";
import studioImage from "@/assets/studio/studio-interior.jpg";

const steps = [
  {
    title: "Shaping",
    description: "Raw clay finds form on the wheel, guided by patient hands.",
    image: handsImage,
  },
  {
    title: "Drying",
    description: "Time slows as moisture leaves, revealing true character.",
    image: toolsImage,
  },
  {
    title: "Glazing",
    description: "Each surface receives its unique mineral embrace.",
    image: studioImage,
  },
  {
    title: "Firing",
    description: "The kiln's heat transforms earth into permanence.",
    image: kilnImage,
  },
];

const CraftStepsSection = () => {
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-30%" });

  return (
    <section ref={containerRef} className="bg-charcoal relative">
      {/* Section header - cinematic fade in */}
      <div ref={headerRef} className="h-[60vh] flex items-center justify-center sticky top-0 z-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center px-8"
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-cream/40 mb-8">
            The Process
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-cream font-light">
            From Earth to Art
          </h2>
        </motion.div>
      </div>

      {/* Steps - slow reveal with parallax */}
      {steps.map((step, index) => (
        <CraftStep key={step.title} step={step} index={index} isLast={index === steps.length - 1} />
      ))}
    </section>
  );
};

const CraftStep = ({ 
  step, 
  index, 
  isLast 
}: { 
  step: typeof steps[0]; 
  index: number;
  isLast: boolean;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-40%" });
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const imageOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.2, 1, 1, isLast ? 1 : 0.4]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <div ref={ref} className="relative">
      <motion.div
        className="relative h-screen"
        style={{ opacity: imageOpacity }}
      >
        <motion.img
          src={step.image}
          alt={step.title}
          className="w-full h-full object-cover"
          style={{ y: imageY }}
        />
        {/* Cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/30 to-charcoal/10" />
        
        {/* Content - slow fade */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0 flex items-end pb-28 md:pb-36"
        >
          <div className="container px-8 md:px-16 lg:px-24">
            <div className="max-w-lg">
              {/* Step number - very subtle */}
              <span className="font-serif text-6xl md:text-7xl text-cream/[0.06] block mb-6">
                {String(index + 1).padStart(2, '0')}
              </span>
              
              {/* Title - caption style */}
              <h3 className="font-serif text-2xl md:text-3xl text-cream font-light mb-4">
                {step.title}
              </h3>
              
              {/* Description - small, understated */}
              <p className="font-sans text-cream/50 text-sm md:text-base max-w-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CraftStepsSection;
