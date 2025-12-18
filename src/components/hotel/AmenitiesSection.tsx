import {
  Wifi,
  Car,
  Dumbbell,
  Coffee,
  Utensils,
  Waves,
  Wind,
  Tv,
  Bath,
  Sparkles,
  Accessibility,
  Globe,
} from "lucide-react";
import type { HotelAmenity } from "@/types/booking";

interface AmenitiesSectionProps {
  amenities: HotelAmenity[];
  facilities?: string[];
}

const iconMap: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  gym: Dumbbell,
  fitness: Dumbbell,
  breakfast: Coffee,
  restaurant: Utensils,
  pool: Waves,
  "air conditioning": Wind,
  ac: Wind,
  tv: Tv,
  spa: Bath,
  cleaning: Sparkles,
  accessible: Accessibility,
  "24-hour": Globe,
};

const getIcon = (name: string | undefined) => {
  if (!name) return Sparkles;
  const lowerName = name.toLowerCase();
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return Icon;
    }
  }
  return Sparkles;
};

export function AmenitiesSection({ amenities, facilities }: AmenitiesSectionProps) {
  const allAmenities = [
    ...amenities,
    ...(facilities || []).map((f, i) => ({ id: `facility-${i}`, name: f })),
  ];

  if (allAmenities.length === 0) {
    return null;
  }

  return (
    <section className="py-6 bg-background">
      <div className="container">
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-1">
            {allAmenities.filter(a => a.name).map((amenity) => {
              const Icon = getIcon(amenity.name);
              return (
                <div
                  key={amenity.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted transition-colors flex-shrink-0"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{amenity.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
