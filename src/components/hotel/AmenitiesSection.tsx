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

const getIcon = (name: string) => {
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
    <section className="py-8 bg-background">
      <div className="container">
        <h2 className="font-heading text-heading-standard text-foreground mb-6">
          Amenities & Facilities
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allAmenities.map((amenity) => {
            const Icon = getIcon(amenity.name);
            return (
              <div
                key={amenity.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-body-small text-foreground">{amenity.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
