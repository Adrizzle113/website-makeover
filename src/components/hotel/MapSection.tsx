import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapSectionProps {
  latitude?: number;
  longitude?: number;
  address: string;
  hotelName: string;
}

export function MapSection({ latitude, longitude, address, hotelName }: MapSectionProps) {
  const hasCoordinates = latitude && longitude;

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const embedUrl = hasCoordinates
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;

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
        <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-card">
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
      </div>
    </section>
  );
}
