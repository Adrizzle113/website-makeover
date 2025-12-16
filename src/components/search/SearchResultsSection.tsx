import { useBookingStore } from "@/stores/bookingStore";
import { HotelCard } from "./HotelCard";
import { Loader2 } from "lucide-react";

export function SearchResultsSection() {
  const { searchResults, isLoading, error, searchParams } = useBookingStore();

  if (!searchParams) {
    return null;
  }

  if (isLoading) {
    return (
      <section id="search-results" className="py-12 bg-app-white-smoke">
        <div className="container">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">
              Searching for the best deals...
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="search-results" className="py-12 bg-app-white-smoke">
        <div className="container">
          <div className="text-center py-20">
            <p className="text-destructive text-lg">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (searchResults.length === 0) {
    return (
      <section id="search-results" className="py-12 bg-app-white-smoke">
        <div className="container">
          <div className="text-center py-20">
            <h3 className="font-heading text-heading-medium text-foreground mb-4">
              No hotels found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or dates.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="search-results" className="py-12 bg-app-white-smoke">
      <div className="container">
        <div className="mb-8">
          <h2 className="font-heading text-heading-medium text-foreground mb-2">
            {searchResults.length} Hotels Found
          </h2>
          <p className="text-muted-foreground">
            in {searchParams.destination}
          </p>
        </div>

        <div className="space-y-6">
          {searchResults.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      </div>
    </section>
  );
}
