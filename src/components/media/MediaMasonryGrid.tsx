import { useState, useCallback, useMemo } from "react";
import MediaGalleryTile, { MediaItem } from "./MediaGalleryTile";

interface MediaMasonryGridProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  columns?: 1 | 2 | 3;
  maxConcurrentVideos?: number;
}

const MediaMasonryGrid = ({ 
  items, 
  onItemClick, 
  columns = 3,
  maxConcurrentVideos = 2 
}: MediaMasonryGridProps) => {
  const [visibleVideos, setVisibleVideos] = useState<Set<string>>(new Set());

  // Track which videos are visible
  const handleVisibilityChange = useCallback((id: string, isVisible: boolean) => {
    setVisibleVideos(prev => {
      const next = new Set(prev);
      if (isVisible) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // Determine which videos should actually play (limit concurrent)
  const playingVideos = useMemo(() => {
    const visibleArray = Array.from(visibleVideos);
    return new Set(visibleArray.slice(0, maxConcurrentVideos));
  }, [visibleVideos, maxConcurrentVideos]);

  // Column classes
  const columnClasses = {
    1: "columns-1",
    2: "columns-1 sm:columns-2",
    3: "columns-1 sm:columns-2 lg:columns-3",
  }[columns];

  return (
    <div className={`${columnClasses} gap-5`}>
      {items.map((item, index) => (
        <MediaGalleryTile
          key={item.id}
          item={item}
          index={index}
          onClick={onItemClick}
          isPlaying={item.type === "video" && playingVideos.has(item.id)}
          onVisibilityChange={item.type === "video" ? handleVisibilityChange : undefined}
        />
      ))}
    </div>
  );
};

export default MediaMasonryGrid;
