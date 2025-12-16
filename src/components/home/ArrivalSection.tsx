import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import handsImage from "@/assets/hero/hands-pottery-wheel.jpg";

// Free pottery video from Pexels (direct CDN link)
const HERO_VIDEO_URL = "https://videos.pexels.com/video-files/6975128/6975128-uhd_2560_1440_25fps.mp4";

const ArrivalSection = () => {
  const ref = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.4], ["0%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

  return (
    <section ref={ref} className="relative h-screen overflow-hidden">
      {/* Full-screen video with subtle parallax */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: backgroundY, scale }}
      >
        {/* Fallback image - shows while video loads */}
        <img 
          src={handsImage} 
          alt="Hands shaping clay on pottery wheel" 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        />
        
        {/* Video background - silent, looping, cinematic */}
        <video
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
        
        {/* Natural light gradient - softer, more cinematic */}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-transparent to-charcoal/50" />
      </motion.div>

      {/* Subtle grain overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Cinematic content - minimal text, generous whitespace */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-end pb-32 md:pb-40 text-center px-8"
        style={{ opacity: textOpacity, y: textY }}
      >
        {/* Caption-style tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1 }}
          className="text-[10px] md:text-xs tracking-[0.5em] uppercase text-cream/50 mb-8"
        >
          Handcrafted in Surat, India
        </motion.p>

        {/* Main Title - elegant, not bold */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.8, delay: 1.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="font-serif text-4xl md:text-6xl lg:text-7xl text-cream font-light leading-[1.1] tracking-tight"
        >
          Poetry in Clay
        </motion.h1>

        {/* Scroll indicator - very subtle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="w-px h-12 bg-gradient-to-b from-cream/30 to-transparent"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ArrivalSection;
