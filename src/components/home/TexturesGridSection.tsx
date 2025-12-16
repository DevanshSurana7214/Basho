import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import wabiSabiBowl from "@/assets/products/wabi-sabi-bowl.jpg";
import kintsugiPlatter from "@/assets/products/kintsugi-platter.jpg";
import rakuPlate from "@/assets/products/raku-dinner-plate.jpg";
import teapot from "@/assets/products/tokoname-teapot.jpg";

const textures = [
  {
    name: "Clay Grain",
    description: "The raw surface speaks of earth",
    image: wabiSabiBowl,
  },
  {
    name: "Glaze Imperfections",
    description: "Each bubble tells a story",
    image: kintsugiPlatter,
  },
  {
    name: "Hand Marks",
    description: "The maker's touch remains",
    image: rakuPlate,
  },
  {
    name: "Fire Patterns",
    description: "Where flame kissed clay",
    image: teapot,
  },
];

const TexturesGridSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <section ref={ref} className="py-40 md:py-56 bg-paper relative overflow-hidden">
      {/* Grain overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="container px-8 md:px-12 lg:px-24">
        {/* Section header - cinematic */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-24 md:mb-32"
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground/60 mb-8">
            Sensory Experience
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground font-light">
            Textures & Materials
          </h2>
        </motion.div>

        {/* Grid - slow staggered reveal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {textures.map((texture, index) => (
            <TextureCard 
              key={texture.name} 
              texture={texture} 
              index={index}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const TextureCard = ({ 
  texture, 
  index,
  isInView
}: { 
  texture: typeof textures[0]; 
  index: number;
  isInView: boolean;
}) => {
  const cardRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ 
        duration: 1.2, 
        delay: index * 0.2,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className="relative aspect-[4/3] overflow-hidden group"
    >
      {/* Image with subtle parallax */}
      <motion.img
        src={texture.image}
        alt={texture.name}
        className="w-full h-[110%] object-cover transition-all duration-1000 ease-out"
        style={{ y: imageY }}
      />
      
      {/* Soft gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/20 to-transparent" />
      
      {/* Caption text */}
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <h3 className="font-serif text-xl text-cream font-light mb-2">
          {texture.name}
        </h3>
        <p className="font-sans text-cream/50 text-sm">
          {texture.description}
        </p>
      </div>
    </motion.div>
  );
};

export default TexturesGridSection;
