import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Hotel } from "@/types/booking";

interface HotelMapViewProps {
  hotels: Hotel[];
  onHotelSelect?: (hotel: Hotel) => void;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoiYm91Z2llYmFja3BhY2tlciIsImEiOiJjbWphZWgyZG4wNHN4M2RweWVjdzVpY3kyIn0.otTqyXhQRvR8qYCHhD8wqg";

export function HotelMapView({ hotels, onHotelSelect }: HotelMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || hotels.length === 0) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Calculate center from hotels
    const validHotels = hotels.filter(h => h.latitude && h.longitude);
    if (validHotels.length === 0) return;

    const avgLat = validHotels.reduce((sum, h) => sum + (h.latitude || 0), 0) / validHotels.length;
    const avgLng = validHotels.reduce((sum, h) => sum + (h.longitude || 0), 0) / validHotels.length;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [avgLng, avgLat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add markers for each hotel
    validHotels.forEach((hotel) => {
      const el = document.createElement("div");
      el.className = "hotel-marker";
      el.innerHTML = `
        <div class="bg-primary text-primary-foreground px-2 py-1 rounded-lg shadow-lg text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors">
          $${hotel.priceFrom}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2 max-w-[200px]">
          <img src="${hotel.mainImage}" alt="${hotel.name}" class="w-full h-24 object-cover rounded mb-2" />
          <h3 class="font-semibold text-sm">${hotel.name}</h3>
          <p class="text-xs text-gray-500">${hotel.address}</p>
          <div class="flex items-center gap-1 mt-1">
            <span class="text-xs bg-primary/10 text-primary px-1 rounded">${hotel.reviewScore}</span>
            <span class="text-xs text-gray-400">(${hotel.reviewCount} reviews)</span>
          </div>
          <p class="text-sm font-semibold mt-2">From $${hotel.priceFrom}/night</p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([hotel.longitude!, hotel.latitude!])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener("click", () => {
        onHotelSelect?.(hotel);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (validHotels.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      validHotels.forEach((hotel) => {
        bounds.extend([hotel.longitude!, hotel.latitude!]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, [hotels, onHotelSelect]);

  if (hotels.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-muted rounded-xl">
        <p className="text-muted-foreground">No hotels to display on map</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
