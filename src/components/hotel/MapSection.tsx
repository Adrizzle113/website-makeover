import { MapPin, ExternalLink, Store, Landmark, Plane, TrainFront } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

const defaultNearby: NearbyItem[] = [
  { name: "Central Park", distance: "0.3 km" },
  { name: "Shopping Mall", distance: "0.5 km" },
  { name: "Restaurant District", distance: "0.2 km" },
];

const defaultPlacesOfInterest: NearbyItem[] = [
  { name: "City Museum", distance: "1.2 km" },
  { name: "Art Gallery", distance: "0.8 km" },
  { name: "Historic Square", distance: "1.0 km" },
];

const defaultAirports: NearbyItem[] = [
  { name: "International Airport", distance: "25 km" },
  { name: "Domestic Airport", distance: "15 km" },
];

const defaultSubways: NearbyItem[] = [
  { name: "Central Station", distance: "0.2 km" },
  { name: "Park Avenue Station", distance: "0.4 km" },
  { name: "Downtown Station", distance: "0.6 km" },
];

export function MapSection({
  latitude,
  longitude,
  address,
  hotelName,
  nearby = defaultNearby,
  placesOfInterest = defaultPlacesOfInterest,
  airports = defaultAirports,
  subways = defaultSubways,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <LocationColumn title="What's Nearby" icon={Store} items={nearby} />
          <LocationColumn title="Places of Interest" icon={Landmark} items={placesOfInterest} />
          <LocationColumn title="Airports" icon={Plane} items={airports} />
          <LocationColumn title="Subway" icon={TrainFront} items={subways} />
        </div>
      </div>
    </section>
  );
}
