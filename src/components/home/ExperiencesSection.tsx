import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import beginnerWorkshop from "@/assets/workshops/beginner-pottery.jpg";
import coupleWorkshop from "@/assets/workshops/couple-pottery-date.jpg";

const ExperiencesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });

  const { data: workshops } = useQuery({
    queryKey: ['featured-workshops-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('is_active', true)
        .limit(2);
      
      if (error) throw error;
      return data;
    }
  });

  const workshopImages = [beginnerWorkshop, coupleWorkshop];

  return (
    <section ref={ref} className="py-40 md:py-56 bg-muted relative overflow-hidden">
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
            Human Connection
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground font-light">
            Experiences & Workshops
          </h2>
          <p className="font-sans text-muted-foreground/70 text-sm mt-8 max-w-md mx-auto leading-relaxed">
            Learn the ancient art of pottery in our intimate studio space. 
            Connect with clay, with others, with yourself.
          </p>
        </motion.div>

        {/* Workshop cards - slow reveal */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          {workshops?.map((workshop, index) => (
            <WorkshopCard 
              key={workshop.id}
              workshop={workshop}
              fallbackImage={workshopImages[index]}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>

        {/* CTA - subtle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 1.2 }}
          className="mt-20 md:mt-28 text-center"
        >
          <Link 
            to="/workshops"
            className="inline-flex items-center gap-4 text-foreground/70 text-sm tracking-[0.2em] uppercase font-sans hover:text-foreground transition-colors duration-700 group"
          >
            Book a Workshop
            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-700" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

const WorkshopCard = ({
  workshop,
  fallbackImage,
  index,
  isInView
}: {
  workshop: any;
  fallbackImage: string;
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
        delay: 0.4 + (index * 0.25),
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className="group"
    >
      {/* Image with subtle parallax */}
      <div className="relative aspect-[4/3] overflow-hidden mb-8">
        <motion.img
          src={workshop.image_url || fallbackImage}
          alt={workshop.title}
          className="w-full h-[110%] object-cover transition-all duration-1000"
          style={{ y: imageY }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 to-transparent" />
      </div>

      {/* Caption text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, delay: 0.6 + (index * 0.2) }}
        className="space-y-4"
      >
        <h3 className="font-serif text-xl md:text-2xl text-foreground font-light">
          {workshop.title}
        </h3>
        <p className="font-sans text-muted-foreground/70 text-sm leading-relaxed">
          {workshop.description}
        </p>
        
        {workshop.duration && (
          <p className="text-xs text-muted-foreground/50 tracking-wide">
            {workshop.duration}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ExperiencesSection;
