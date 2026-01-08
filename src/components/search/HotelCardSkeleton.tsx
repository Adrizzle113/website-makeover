import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HotelCardSkeletonProps {
  compact?: boolean;
}

export function HotelCardSkeleton({ compact = false }: HotelCardSkeletonProps) {
  if (compact) {
    return (
      <Card className="overflow-hidden bg-card border-border/50 rounded-xl">
        <div className="flex">
          <Skeleton className="w-24 sm:w-28 h-24 sm:h-28 flex-shrink-0" />
          <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-0.5 mb-0.5 sm:mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-3 sm:h-4 w-3/4 mb-1" />
              <Skeleton className="h-2.5 sm:h-3 w-1/2" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 sm:h-4 w-16" />
              <Skeleton className="h-3 sm:h-4 w-3 sm:w-4 rounded-full" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-card border-border/50 rounded-xl md:rounded-2xl animate-pulse">
      <div className="flex flex-col sm:flex-row">
        {/* Image skeleton */}
        <Skeleton className="w-full sm:w-48 md:w-80 h-48 sm:h-48 md:h-[340px] flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 p-4 md:p-6 flex flex-col">
          <div className="flex-1">
            {/* Stars */}
            <div className="flex items-center gap-0.5 md:gap-1 mb-2 md:mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-3 md:w-4 h-3 md:h-4 rounded-full" />
              ))}
            </div>

            {/* Name */}
            <Skeleton className="h-5 md:h-7 w-3/4 mb-1.5 md:mb-2" />

            {/* Location */}
            <div className="flex flex-col gap-0.5 mb-3 md:mb-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Skeleton className="w-3.5 md:w-4 h-3.5 md:h-4 rounded-full" />
                <Skeleton className="h-3 md:h-4 w-32" />
              </div>
              <Skeleton className="h-2.5 md:h-3 w-48 ml-5 md:ml-6" />
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 md:mb-5">
              <Skeleton className="h-5 md:h-6 w-16 md:w-20 rounded-full" />
              <Skeleton className="h-5 md:h-6 w-20 md:w-24 rounded-full" />
              <Skeleton className="h-5 md:h-6 w-14 md:w-18 rounded-full" />
            </div>
          </div>

          {/* Price & CTA */}
          <div className="flex items-end justify-between pt-3 md:pt-4 border-t border-border/50 gap-3">
            <div>
              <Skeleton className="h-2.5 md:h-3 w-16 mb-1" />
              <Skeleton className="h-6 md:h-8 w-24 mb-1" />
              <Skeleton className="h-2.5 md:h-3 w-12" />
            </div>
            <Skeleton className="h-8 md:h-9 w-24 md:w-32 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}