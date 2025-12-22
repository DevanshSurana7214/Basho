import { Skeleton } from "@/components/ui/skeleton";

const WorkshopCardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      {/* Image with price badge skeleton */}
      <div className="relative aspect-video">
        <Skeleton className="w-full h-full" />
        {/* Price badge skeleton */}
        <div className="absolute top-4 right-4">
          <Skeleton className="h-8 w-28 rounded-sm" />
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Title */}
        <Skeleton className="h-7 w-3/4" />
        
        {/* Tagline */}
        <Skeleton className="h-4 w-full" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        
        {/* Metadata row (duration, days, location) */}
        <div className="flex flex-wrap gap-4 pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        
        {/* Footer with date and button */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-28 rounded-sm" />
        </div>
      </div>
    </div>
  );
};

export const WorkshopGridSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <WorkshopCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default WorkshopCardSkeleton;
