import { useBookingStore } from "@/stores/bookingStore";
import { HotelCard } from "./HotelCard";
import { Loader2, Search } from "lucide-react";

export function SearchResultsSection() {
  const { searchResults, isLoading, error, searchParams } = useBookingStore();

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

  if (searchResults.length === 0) {
    return (
      <section id="search-results" className="py-16 bg-cream/30">
        <div className="container">
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-heading-medium text-foreground mb-4">
              No hotels found
            </h3>
            <p className="text-muted-foreground text-body-md">
              Try adjusting your search criteria or dates.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="search-results" className="py-16 bg-cream/30">
      <div className="container">
        <div className="mb-10 text-center">
          <p className="heading-spaced text-primary mb-4">SEARCH RESULTS</p>
          <h2 className="font-heading text-heading-lg text-foreground mb-3">
            {searchResults.length} Hotels Found
          </h2>
          <p className="text-muted-foreground text-body-md">
            in {searchParams.destination}
          </p>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
          {searchResults.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      </div>
    </section>
  );
}
