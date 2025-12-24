import { MapPin, ExternalLink, Store, Landmark, Plane, TrainFront, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface NearbyItem {
  name: string;
  distance: string;
}

interface MapSectionProps {
  latitude?: number;
  longitude?: number;
  address: string;
  hotelName: string;
  nearby?: NearbyItem[];
  placesOfInterest?: NearbyItem[];
  airports?: NearbyItem[];
  subways?: NearbyItem[];
  isLoading?: boolean;
}

export function MapSection({
  latitude,
  longitude,
  address,
  hotelName,
  nearby = [],
  placesOfInterest = [],
  airports = [],
  subways = [],
  isLoading = false,
}: MapSectionProps) {
  const hasCoordinates = latitude && longitude;

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const embedUrl = hasCoordinates
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;

  const LocationColumn = ({
    title,
    icon: Icon,
    items,
  }: {
    title: string;
    icon: React.ElementType;
    items: NearbyItem[];
  }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="font-medium text-foreground text-sm">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.name}</span>
            <span className="text-foreground font-medium">{item.distance}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading nearby places... This may take a moment.</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  const hasPOIData = nearby.length > 0 || placesOfInterest.length > 0 || airports.length > 0 || subways.length > 0;

  return (
    <section className="py-8 bg-app-white-smoke">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-heading-standard text-foreground">
            Location
          </h2>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Maps
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="text-body-small">{address}</span>
        </div>

        {/* Map Embed */}
        <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-card mb-8">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map showing location of ${hotelName}`}
          />
        </div>

        {/* Nearby Locations Grid */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : hasPOIData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearby.length > 0 && <LocationColumn title="What's Nearby" icon={Store} items={nearby} />}
            {placesOfInterest.length > 0 && <LocationColumn title="Places of Interest" icon={Landmark} items={placesOfInterest} />}
            {airports.length > 0 && <LocationColumn title="Airports" icon={Plane} items={airports} />}
            {subways.length > 0 && <LocationColumn title="Subway" icon={TrainFront} items={subways} />}
          </div>
        ) : null}
      </div>
    </section>
  );
}
