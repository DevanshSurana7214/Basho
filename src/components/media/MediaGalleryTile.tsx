import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export interface MediaItem {
  id: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  alt: string;
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9";
  category: "workshop" | "studio" | "product" | "texture";
}

interface MediaGalleryTileProps {
  item: MediaItem;
  index: number;
  onClick: (item: MediaItem) => void;
  isPlaying?: boolean;
  onVisibilityChange?: (id: string, isVisible: boolean) => void;
}

const MediaGalleryTile = ({ 
  item, 
  index, 
  onClick, 
  isPlaying = false,
  onVisibilityChange 
}: MediaGalleryTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Aspect ratio classes - videos default to 9:16 (Instagram vertical)
  const aspectRatioClass = {
    "1:1": "aspect-square",
    "4:5": "aspect-[4/5]",
    "9:16": "aspect-[9/16]",
    "16:9": "aspect-video",
  }[item.aspectRatio || (item.type === "video" ? "9:16" : "4:5")];

  // Intersection Observer for viewport detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio > 0.5;
        setIsInView(visible);
        onVisibilityChange?.(item.id, visible);
      },
      { 
        threshold: [0, 0.5, 1],
        rootMargin: "-10% 0px -10% 0px"
      }
    );

    if (tileRef.current) {
      observer.observe(tileRef.current);
    }

    return () => observer.disconnect();
  }, [item.id, onVisibilityChange]);

  // Video play/pause based on visibility
  useEffect(() => {
    if (item.type !== "video" || !videoRef.current) return;

    if (isInView && isPlaying) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, that's okay
      });
    } else {
      videoRef.current.pause();
    }
  }, [isInView, isPlaying, item.type]);

  return (
    <motion.div
      ref={tileRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ 
        duration: 0.9, 
        delay: Math.min(index * 0.1, 0.5),
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className="break-inside-avoid mb-5 group cursor-pointer"
      onClick={() => onClick(item)}
    >
      <div className={`
        relative overflow-hidden rounded-xl bg-muted/30
        shadow-soft hover:shadow-warm
        transition-all duration-700 ease-elegant
        ring-1 ring-border/20 hover:ring-border/40
        ${aspectRatioClass}
      `}>
        {item.type === "image" ? (
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            onLoad={() => setHasLoaded(true)}
            className={`
              w-full h-full object-cover
              transition-all duration-700 ease-elegant
              group-hover:scale-[1.03]
              ${hasLoaded ? "opacity-100" : "opacity-0"}
            `}
          />
        ) : (
          <video
            ref={videoRef}
            src={item.src}
            poster={item.poster}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedData={() => setHasLoaded(true)}
            className={`
              w-full h-full object-cover
              transition-all duration-700 ease-elegant
              group-hover:scale-[1.03]
              ${hasLoaded ? "opacity-100" : "opacity-0"}
            `}
          />
        )}

        {/* Loading placeholder with warm shimmer */}
        {!hasLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse" />
        )}

        {/* Elegant warm overlay on hover */}
        <div className="
          absolute inset-0 
          bg-gradient-to-t from-charcoal/15 via-transparent to-transparent
          opacity-0 group-hover:opacity-100
          transition-opacity duration-500
          pointer-events-none
        " />

        {/* Subtle warm glow at bottom for videos */}
        {item.type === "video" && isInView && isPlaying && (
          <div className="
            absolute bottom-0 left-0 right-0 h-1
            bg-gradient-to-r from-transparent via-terracotta/30 to-transparent
            opacity-60
          " />
        )}
      </div>
    </motion.div>
  );
};

export default MediaGalleryTile;
