import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { MediaItem } from "./MediaGalleryTile";

interface MediaLightboxProps {
  item: MediaItem | null;
  onClose: () => void;
}

const MediaLightbox = ({ item, onClose }: MediaLightboxProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Play video when lightbox opens
  useEffect(() => {
    if (item?.type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [item]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Dark parchment background */}
          <div className="absolute inset-0 bg-charcoal/95 backdrop-blur-sm" />

          {/* Close button - subtle, top right */}
          <button
            onClick={onClose}
            className="
              absolute top-6 right-6 z-10
              p-2 rounded-full
              text-cream/60 hover:text-cream
              transition-colors duration-300
            "
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Media content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {item.type === "image" ? (
              <img
                src={item.src}
                alt={item.alt}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-elevated"
              />
            ) : (
              <video
                ref={videoRef}
                src={item.src}
                poster={item.poster}
                muted
                loop
                playsInline
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-elevated"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MediaLightbox;
