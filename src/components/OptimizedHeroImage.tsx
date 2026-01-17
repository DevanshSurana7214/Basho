import { useState, useEffect } from "react";
import { getHeroImage } from "@/lib/imageOptimization";

interface OptimizedHeroImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const OptimizedHeroImage = ({
  src,
  alt,
  className,
  priority = false,
}: OptimizedHeroImageProps) => {
  const optimizedSrc = getHeroImage(src) || src;
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (priority) {
      // Preload critical images
      const img = new Image();
      img.src = optimizedSrc;
      img.onload = () => setIsLoaded(true);
    }
  }, [optimizedSrc, priority]);

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      style={{
        opacity: priority && !isLoaded ? 0 : 1,
        transition: "opacity 0.3s ease-in-out",
      }}
    />
  );
};
