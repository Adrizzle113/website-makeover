import { useState, useMemo } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import { HotelCard } from "./HotelCard";
import { HotelMapView } from "./HotelMapView";
import { Loader2, ArrowUpDown, List, Map } from "lucide-react";
import type { Hotel } from "@/types/booking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type SortOption = "popularity" | "price-low" | "price-high" | "rating";
type ViewMode = "list" | "map";

const mockHotels: Hotel[] = [
  {
    id: "hotel-1",
    name: "The Grand Palace Hotel",
    description: "Experience luxury at its finest with stunning city views and world-class amenities.",
    address: "123 Main Street",
    city: "Los Angeles",
    country: "USA",
    starRating: 5,
    reviewScore: 9.2,
    reviewCount: 1248,
    mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    images: [{ url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800" }],
    amenities: [
      { id: "wifi", name: "Free WiFi" },
      { id: "pool", name: "Swimming Pool" },
      { id: "spa", name: "Spa & Wellness" },
      { id: "gym", name: "Fitness Center" },
      { id: "restaurant", name: "Restaurant" },
    ],
    priceFrom: 299,
    currency: "USD",
    latitude: 34.0522,
    longitude: -118.2437,
  },
  {
    id: "hotel-2",
    name: "Seaside Resort & Spa",
    description: "A tranquil beachfront retreat with pristine beaches and exceptional dining.",
    address: "456 Ocean Drive",
    city: "Los Angeles",
    country: "USA",
    starRating: 4,
    reviewScore: 8.7,
    reviewCount: 892,
    mainImage: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
    images: [{ url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800" }],
    amenities: [
      { id: "wifi", name: "Free WiFi" },
      { id: "beach", name: "Private Beach" },
      { id: "pool", name: "Infinity Pool" },
      { id: "parking", name: "Free Parking" },
    ],
    priceFrom: 199,
    currency: "USD",
    latitude: 34.0195,
    longitude: -118.4912,
  },
  {
    id: "hotel-3",
    name: "Urban Boutique Hotel",
    description: "Modern design meets comfort in the heart of downtown.",
    address: "789 Downtown Ave",
    city: "Los Angeles",
    country: "USA",
    starRating: 4,
    reviewScore: 8.4,
    reviewCount: 567,
    mainImage: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    images: [{ url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800" }],
    amenities: [
      { id: "wifi", name: "Free WiFi" },
      { id: "breakfast", name: "Breakfast Included" },
      { id: "gym", name: "Fitness Center" },
    ],
    priceFrom: 149,
    currency: "USD",
    latitude: 34.0407,
    longitude: -118.2468,
  },
];

export function SearchResultsSection() {
  const { searchResults, isLoading, error, searchParams } = useBookingStore();
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const hotels = useMemo(() => {
    const baseHotels = searchResults.length > 0 ? searchResults : mockHotels;
    
    return [...baseHotels].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.priceFrom - b.priceFrom;
        case "price-high":
          return b.priceFrom - a.priceFrom;
        case "rating":
          return (b.reviewScore || 0) - (a.reviewScore || 0);
        case "popularity":
        default:
          return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
    });
  }, [searchResults, sortBy]);

  if (!searchParams) {
    return null;
  }

  if (isLoading) {
    return (
      <section id="search-results" className="py-16 bg-cream/30">
        <div className="container">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <span className="text-body-lg text-muted-foreground">
              Searching for the best deals...
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="search-results" className="py-16 bg-cream/30">
        <div className="container">
          <div className="text-center py-20">
            <p className="text-destructive text-body-lg">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="search-results" className="py-16 bg-cream/30">
      <div className="container">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-heading-md text-foreground">
              {searchParams.destination}:{" "}
              <span className="text-muted-foreground font-normal">
                {hotels.length} {hotels.length === 1 ? "property" : "properties"} found
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Guest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="rounded-none"
              >
                <Map className="h-4 w-4 mr-1" />
                Map
              </Button>
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        ) : (
          <HotelMapView hotels={hotels} />
        )}
      </div>
    </section>
  );
}
