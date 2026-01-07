import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import studioInterior from "@/assets/studio/studio-interior.jpg";
import kilnImage from "@/assets/studio/kiln.jpg";
import founderImage from "@/assets/founder-shivangi.jpg";

const TrustSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Grain overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Studio section - cinematic grid */}
      <StudioGrid />
    </section>
  );
};

const StudioGrid = () => {
  const gridRef = useRef(null);
  const isGridInView = useInView(gridRef, { once: true, margin: "-15%" });

  return (
    <div ref={gridRef} className="bg-background py-16 md:py-24">
      <div className="container px-8 md:px-12 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isGridInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-20 md:mb-28"
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground/60 mb-8">
            The Space
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-foreground font-light">
            Our Studio
          </h2>
        </motion.div>

        {/* Studio photo grid with slow reveals */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isGridInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="col-span-2 aspect-[16/9] overflow-hidden"
          >
            <img
              src={studioInterior}
              alt="Studio interior"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isGridInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="aspect-square overflow-hidden"
          >
            <img
              src={kilnImage}
              alt="Kiln"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isGridInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="aspect-square overflow-hidden"
          >
            <img
              src={founderImage}
              alt="Founder at work"
              className="w-full h-full object-cover"
            />
          </motion.div>
          
          {/* Visit card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isGridInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, delay: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
            className="col-span-2 md:col-span-2 aspect-[21/9] overflow-hidden bg-charcoal flex items-center justify-center"
          >
            <div className="text-center px-8 py-12">
              <p className="text-[10px] tracking-[0.4em] uppercase text-cream/40 mb-6">
                Visit Us
              </p>
              <h3 className="font-serif text-xl md:text-2xl text-cream font-light mb-4">
                Piplod, Surat
              </h3>
              <p className="text-cream/40 text-xs mb-8">
                Gujarat, India · Tue-Sun, 10am-6pm
              </p>
              <Link 
                to="/contact"
                className="inline-flex items-center gap-3 text-cream/60 text-xs tracking-[0.2em] uppercase hover:text-cream transition-colors duration-700 group"
              >
                Get Directions
                <ArrowRight className="w-3 h-3 group-hover:translate-x-2 transition-transform duration-700" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TrustSection;
