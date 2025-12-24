import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, ExternalLink, Store, Landmark, Plane, TrainFront, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiYm91Z2llYmFja3BhY2tlciIsImEiOiJjbWphZWgyZG4wNHN4M2RweWVjdzVpY3kyIn0.otTqyXhQRvR8qYCHhD8wqg";

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const hotelMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<{ name: string; category: string } | null>(null);

  const hasCoordinates = latitude && longitude;

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || !hasCoordinates) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add hotel marker
    const hotelEl = document.createElement("div");
    hotelEl.className = "hotel-marker";
    hotelEl.innerHTML = `
      <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `;

    hotelMarkerRef.current = new mapboxgl.Marker({ element: hotelEl })
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${hotelName}</strong>`))
      .addTo(map.current);

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [latitude, longitude, hasCoordinates, hotelName]);

  // Search and show POI on map when hovering
  const showPOIOnMap = useCallback(async (itemName: string, category: string) => {
    if (!map.current || !hasCoordinates || !mapLoaded) return;

    // Remove existing hover marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    try {
      // Search for the POI near the hotel
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(itemName)}.json?proximity=${longitude},${latitude}&limit=1&access_token=${MAPBOX_TOKEN}`
      );
      
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        
        // Get marker color based on category
        const colors: Record<string, string> = {
          nearby: "#10b981",
          placesOfInterest: "#8b5cf6",
          airports: "#3b82f6",
          subways: "#f97316",
        };
        const color = colors[category] || "#6366f1";

        // Create marker element
        const el = document.createElement("div");
        el.className = "poi-marker animate-scale-in";
        el.innerHTML = `
          <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${color}">
            <div class="w-2 h-2 bg-white rounded-full"></div>
          </div>
        `;

        // Add marker
        markerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!);

        // Add popup
        popupRef.current = new mapboxgl.Popup({ 
          offset: 25, 
          closeButton: false,
          className: "poi-popup"
        })
          .setLngLat([lng, lat])
          .setHTML(`<div class="font-medium text-sm">${itemName}</div>`)
          .addTo(map.current!);

        // Fit bounds to show both hotel and POI
        const bounds = new mapboxgl.LngLatBounds()
          .extend([longitude!, latitude!])
          .extend([lng, lat]);
        
        map.current!.fitBounds(bounds, { 
          padding: 80,
          maxZoom: 15,
          duration: 500
        });
      }
    } catch (error) {
      console.error("Error fetching POI location:", error);
    }
  }, [hasCoordinates, latitude, longitude, mapLoaded]);

  // Handle mouse leave - reset map
  const handleMouseLeave = useCallback(() => {
    setHoveredItem(null);
    
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    // Reset map view to hotel
    if (map.current && hasCoordinates) {
      map.current.flyTo({
        center: [longitude!, latitude!],
        zoom: 14,
        duration: 500
      });
    }
  }, [hasCoordinates, latitude, longitude]);

  const LocationColumn = ({
    title,
    icon: Icon,
    items,
    category,
  }: {
    title: string;
    icon: React.ElementType;
    items: NearbyItem[];
    category: string;
  }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="font-medium text-foreground text-sm">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const isHovered = hoveredItem?.name === item.name && hoveredItem?.category === category;
          return (
            <li
              key={idx}
              className={`flex justify-between text-sm cursor-pointer rounded-md px-2 py-1.5 -mx-2 transition-all duration-200 ${
                isHovered 
                  ? "bg-primary/10 scale-[1.02]" 
                  : "hover:bg-muted/50"
              }`}
              onMouseEnter={() => {
                setHoveredItem({ name: item.name, category });
                showPOIOnMap(item.name, category);
              }}
              onMouseLeave={handleMouseLeave}
            >
              <span className={`transition-colors ${isHovered ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {item.name}
              </span>
              <span className="text-foreground font-medium">{item.distance}</span>
            </li>
          );
        })}
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

        {/* Interactive Mapbox Map */}
        <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-card mb-8">
          {hasCoordinates ? (
            <div ref={mapContainer} className="absolute inset-0" />
          ) : (
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map showing location of ${hotelName}`}
            />
          )}
        </div>

        {/* Nearby Locations Grid */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : hasPOIData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearby.length > 0 && <LocationColumn title="What's Nearby" icon={Store} items={nearby} category="nearby" />}
            {placesOfInterest.length > 0 && <LocationColumn title="Places of Interest" icon={Landmark} items={placesOfInterest} category="placesOfInterest" />}
            {airports.length > 0 && <LocationColumn title="Airports" icon={Plane} items={airports} category="airports" />}
            {subways.length > 0 && <LocationColumn title="Subway" icon={TrainFront} items={subways} category="subways" />}
          </div>
        ) : null}
      </div>
    </section>
  );
}
