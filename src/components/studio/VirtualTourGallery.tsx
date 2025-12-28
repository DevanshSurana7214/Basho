import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import studio images
import studioInterior from "@/assets/studio/studio-interior.jpg";
import kilnImage from "@/assets/studio/kiln.jpg";
import potteryTools from "@/assets/studio/pottery-tools.jpg";
import potteryDrying from "@/assets/studio/pottery-drying.jpg";
import rawClayTexture from "@/assets/studio/raw-clay-texture.jpg";
import potteryGlazing from "@/assets/studio/pottery-glazing.jpg";

interface TourImage {
  src: string;
  alt: string;
  title: string;
  description: string;
}

const tourImages: TourImage[] = [
  {
    src: studioInterior,
    alt: "Basho studio interior with natural light",
    title: "The Workshop Space",
    description: "Our main workspace where creativity flows—bathed in natural light and filled with the quiet hum of creation."
  },
  {
    src: kilnImage,
    alt: "Pottery kiln at Basho studio",
    title: "The Heart of Fire",
    description: "Our kiln, where raw clay transforms into lasting art through the ancient alchemy of fire."
  },
  {
    src: potteryTools,
    alt: "Handcrafted pottery tools",
    title: "Tools of the Trade",
    description: "Each tool tells a story—worn smooth by years of use, shaped by the hands that wield them."
  },
  {
    src: potteryDrying,
    alt: "Pottery pieces drying on shelves",
    title: "The Drying Room",
    description: "Patience made visible—pieces rest here, slowly releasing moisture before their journey to the kiln."
  },
  {
    src: rawClayTexture,
    alt: "Raw clay texture closeup",
    title: "Earth's Canvas",
    description: "Raw clay awaiting transformation—the beginning of every piece we create."
  },
  {
    src: potteryGlazing,
    alt: "Pottery glazing process",
    title: "The Glazing Corner",
    description: "Where color meets form—glazes mixed by hand, each shade a carefully guarded secret."
  }
];

const VirtualTourGallery = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const openFullscreen = (index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = useCallback(() => {
    setSelectedIndex(null);
    setIsAutoPlaying(false);
    document.body.style.overflow = "";
  }, []);

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => 
      prev !== null ? (prev - 1 + tourImages.length) % tourImages.length : null
    );
  }, []);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => 
      prev !== null ? (prev + 1) % tourImages.length : null
    );
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") closeFullscreen();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, closeFullscreen, goToPrevious, goToNext]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || selectedIndex === null) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, selectedIndex, goToNext]);

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-sand via-parchment/50 to-sand relative overflow-hidden">
      {/* Decorative background elements */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--terracotta)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-0 left-0 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-clay/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-terracotta/10 mb-6"
          >
            <Play className="w-5 h-5 text-terracotta" />
          </motion.div>
          <span className="block font-sans text-xs tracking-[0.3em] uppercase text-terracotta mb-4">
            Explore Our Space
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-deep-clay">
            Virtual Studio Tour
          </h2>
          <p className="font-sans text-clay/80 mt-4 max-w-lg mx-auto">
            Step inside our sanctuary of creation. Click any image to explore in full-screen.
          </p>
        </motion.div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {tourImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer shadow-lg shadow-deep-clay/10 hover:shadow-xl hover:shadow-terracotta/15 transition-all duration-500"
              onClick={() => openFullscreen(index)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-clay/70 via-deep-clay/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
                <span className="font-serif text-base text-white text-center px-4">
                  {image.title}
                </span>
              </div>
              {/* Subtle border glow on hover */}
              <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-terracotta/30 transition-colors duration-500" />
            </motion.div>
          ))}
        </div>

        {/* Start Tour Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            className="bg-gradient-to-r from-terracotta to-terracotta/90 hover:from-terracotta/90 hover:to-terracotta text-white px-8 py-6 text-xs tracking-[0.2em] uppercase font-sans shadow-lg shadow-terracotta/20 hover:shadow-xl hover:shadow-terracotta/30 transition-all duration-300"
            onClick={() => {
              openFullscreen(0);
              setIsAutoPlaying(true);
            }}
          >
            <Play className="w-4 h-4 mr-3" />
            Start Virtual Tour
          </Button>
        </motion.div>
      </div>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-deep-clay/98 backdrop-blur-sm flex items-center justify-center"
            onClick={closeFullscreen}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 z-50 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all"
              onClick={closeFullscreen}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Arrows */}
            <button
              className="absolute left-4 md:left-8 z-50 p-4 bg-white/5 backdrop-blur-sm rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              className="absolute right-4 md:right-8 z-50 p-4 bg-white/5 backdrop-blur-sm rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image Container */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-5xl max-h-[80vh] mx-auto px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={tourImages[selectedIndex].src}
                  alt={tourImages[selectedIndex].alt}
                  className="max-w-full max-h-[70vh] object-contain mx-auto"
                />
              </div>
              
              {/* Image Info */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mt-8"
              >
                <h3 className="font-serif text-2xl md:text-3xl text-white">
                  {tourImages[selectedIndex].title}
                </h3>
                <p className="font-sans text-white/60 mt-3 max-w-lg mx-auto leading-relaxed">
                  {tourImages[selectedIndex].description}
                </p>
              </motion.div>
            </motion.div>

            {/* Thumbnail Navigation */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-full">
              {tourImages.map((_, index) => (
                <button
                  key={index}
                  className="relative w-2.5 h-2.5 rounded-full bg-white/30 hover:bg-white/50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(index);
                  }}
                >
                  {index === selectedIndex && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute inset-0 bg-terracotta rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Auto-play indicator */}
            {isAutoPlaying && (
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
                <span className="font-sans text-sm text-white/80">Auto-playing</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default VirtualTourGallery;
