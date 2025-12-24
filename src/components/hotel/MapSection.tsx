import { useState } from "react";
import { MapPin, ExternalLink, Store, Landmark, Plane, TrainFront, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { hasMapboxToken, saveMapboxToken } from "@/config/mapbox";

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
  onRetryPOI?: () => void;
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
  onRetryPOI,
}: MapSectionProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);

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
  const handleSaveToken = () => {
    if (tokenInput.trim().startsWith("pk.")) {
      saveMapboxToken(tokenInput.trim());
      setTokenSaved(true);
      // Trigger retry after a short delay
      setTimeout(() => {
        onRetryPOI?.();
      }, 100);
    }
  };

  const hasPOIData = nearby.length > 0 || placesOfInterest.length > 0 || airports.length > 0 || subways.length > 0;
  const showTokenSetup = !isLoading && !hasPOIData && !hasMapboxToken();

  const EmptyState = () => (
    <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
      <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">Nearby places unavailable</span>
      </div>
      {showTokenSetup ? (
        <div className="max-w-md mx-auto space-y-4">
          <p className="text-sm text-muted-foreground">
            To display nearby places, airports, and landmarks, please enter your Mapbox public token.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="pk.eyJ1..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSaveToken}
              disabled={!tokenInput.trim().startsWith("pk.")}
              size="sm"
            >
              Save & Retry
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your free token at{" "}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
          </p>
          {tokenSaved && (
            <p className="text-sm text-green-600">Token saved! Retrying...</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            POI data could not be loaded. This may be a temporary issue.
          </p>
          {onRetryPOI && (
            <Button variant="outline" size="sm" onClick={onRetryPOI}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>
      )}
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
        {isLoading ? (
          <LoadingSkeleton />
        ) : hasPOIData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearby.length > 0 && <LocationColumn title="What's Nearby" icon={Store} items={nearby} />}
            {placesOfInterest.length > 0 && <LocationColumn title="Places of Interest" icon={Landmark} items={placesOfInterest} />}
            {airports.length > 0 && <LocationColumn title="Airports" icon={Plane} items={airports} />}
            {subways.length > 0 && <LocationColumn title="Subway" icon={TrainFront} items={subways} />}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}
