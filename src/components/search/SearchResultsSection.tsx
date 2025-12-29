import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import { HotelCard } from "./HotelCard";
import { HotelMapView } from "./HotelMapView";
import { PrimaryFilters, AdvancedFiltersDrawer, SortingDropdown, ActiveFilterChips } from "./filters";
import { Loader2, List, Map, Columns } from "lucide-react";
import type { Hotel, SortOption } from "@/types/booking";
import { ratehawkApi } from "@/services/ratehawkApi";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type ViewMode = "list" | "map" | "split";

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
  const { 
    searchResults, 
    isLoading, 
    isLoadingMore,
    error, 
    searchParams,
    hasMoreResults,
    currentPage,
    totalResults,
    setSearchResults,
    appendSearchResults,
    setLoading,
    setLoadingMore,
    setError,
    filters,
    sortBy,
    getActiveFilterCount,
  } = useBookingStore();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);
  const [focusedHotelId, setFocusedHotelId] = useState<string | null>(null);
  const [isFilterSearching, setIsFilterSearching] = useState(false);
  
  // Track previous filter state to detect changes
  const prevFiltersRef = useRef(filters);
  const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for infinite scroll
  const listSentinelRef = useRef<HTMLDivElement>(null);
  const splitSentinelRef = useRef<HTMLDivElement>(null);

  // Server-side filter search
  const executeFilteredSearch = useCallback(async () => {
    if (!searchParams) return;
    
    setIsFilterSearching(true);
    setLoading(true);
    
    try {
      const response = await ratehawkApi.searchHotels(searchParams, 1, filters);
      setSearchResults(response.hotels, response.hasMore, response.totalResults);
      
      // Results kept in memory only - URL params preserve search criteria
    } catch (err) {
      console.error("Filtered search error:", err);
      toast({
        title: "Filter search failed",
        description: "Unable to apply filters. Showing cached results.",
        variant: "destructive",
      });
    } finally {
      setIsFilterSearching(false);
      setLoading(false);
    }
  }, [searchParams, filters, setSearchResults, setLoading]);

  // Watch for filter changes and trigger server-side search
  useEffect(() => {
    // Skip if no search params or on initial render
    if (!searchParams || searchResults.length === 0) return;
    
    // Check if filters actually changed
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
    if (!filtersChanged) return;
    
    prevFiltersRef.current = filters;
    
    // Debounce filter changes to avoid too many API calls
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
    }
    
    filterDebounceRef.current = setTimeout(() => {
      executeFilteredSearch();
    }, 500);
    
    return () => {
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
  }, [filters, searchParams, searchResults.length, executeFilteredSearch]);

  const handleLoadMore = useCallback(async () => {
    if (!searchParams || isLoadingMore || !hasMoreResults) return;
    
    setLoadingMore(true);
    try {
      const response = await ratehawkApi.searchHotels(searchParams, currentPage + 1, filters);
      appendSearchResults(response.hotels, response.hasMore);
    } catch (err) {
      console.error("Error loading more results:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [searchParams, isLoadingMore, hasMoreResults, currentPage, filters, appendSearchResults, setLoadingMore]);

  // Infinite scroll observer for list view
  useEffect(() => {
    const sentinel = listSentinelRef.current;
    if (!sentinel || viewMode !== "list") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreResults && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, hasMoreResults, isLoadingMore, handleLoadMore]);

  // Infinite scroll observer for split view
  useEffect(() => {
    const sentinel = splitSentinelRef.current;
    if (!sentinel || viewMode !== "split") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreResults && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { root: sentinel.parentElement, rootMargin: "100px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, hasMoreResults, isLoadingMore, handleLoadMore]);

  // Calculate price range from results
  const priceRange = useMemo(() => {
    const baseHotels = searchResults;
    const prices = baseHotels.map((h) => h.priceFrom);
    return {
      min: Math.min(...prices, 0),
      max: Math.max(...prices, 1000),
    };
  }, [searchResults]);

  // Apply client-side sorting (filtering is server-side now)
  const hotels = useMemo(() => {
    const baseHotels = searchResults;

    // Apply sorting only - filtering is done server-side
    return [...baseHotels].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.priceFrom - b.priceFrom;
        case "price-high":
          return b.priceFrom - a.priceFrom;
        case "rating":
          return (b.reviewScore || 0) - (a.reviewScore || 0);
        case "distance":
          // Would need distance data from API
          return 0;
        case "free-cancellation":
          // Sort by free cancellation first
          const aFree = (a as any).freeCancellation ? 1 : 0;
          const bFree = (b as any).freeCancellation ? 1 : 0;
          return bFree - aFree;
        case "cheapest-rate":
          return a.priceFrom - b.priceFrom;
        case "popularity":
        default:
          return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
    });
  }, [searchResults, sortBy]);

  // Retry handler for 503 errors - MUST be before any early returns
  const handleRetrySearch = useCallback(async () => {
    if (!searchParams) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await ratehawkApi.searchHotels(searchParams, 1, filters);
      setSearchResults(response.hotels, response.hasMore, response.totalResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchParams, filters, setLoading, setError, setSearchResults]);

  const activeFilterCount = getActiveFilterCount();
  const isFiltered = activeFilterCount > 0;

  if (!searchParams) {
    return null;
  }

  if (isLoading && !isFilterSearching) {
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
    const isServiceUnavailable = error.toLowerCase().includes('temporarily') || 
                                  error.toLowerCase().includes('unavailable') ||
                                  error.toLowerCase().includes('try again');
    
    return (
      <section id="search-results" className="py-16 bg-cream/30">
        <div className="container">
          <div className="text-center py-20 space-y-4">
            <p className="text-destructive text-body-lg">{error}</p>
            {isServiceUnavailable && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  The hotel search service is warming up. This usually takes 20-30 seconds.
                </p>
                <Button onClick={handleRetrySearch} variant="outline">
                  <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : 'hidden'}`} />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // On mobile, default to list view if split was selected
  const effectiveViewMode = viewMode === "split" && typeof window !== "undefined" && window.innerWidth < 1024 ? "list" : viewMode;

  return (
    <section id="search-results" className="py-8 md:py-16 bg-cream/30">
      <div className="container px-3 md:px-4">
        {/* Header */}
        <div className="mb-4 md:mb-6 space-y-4">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-lg md:text-heading-md text-foreground">
                {searchParams.destination}:{" "}
                <span className="text-muted-foreground font-normal">
                  {totalResults} {totalResults === 1 ? "property" : "properties"}
                  {isFiltered && ` (filtered)`}
                </span>
              </h2>
              {(isFilterSearching || isLoading) && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border">
            <PrimaryFilters priceRange={priceRange} />
            <AdvancedFiltersDrawer />
          </div>

          {/* Active Filter Chips */}
          <ActiveFilterChips />

          {/* Sort & View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <SortingDropdown />

            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden self-start sm:self-auto">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none px-3 md:px-4"
              >
                <List className="h-4 w-4" />
                <span className="ml-1.5 hidden sm:inline">List</span>
              </Button>
              <Button
                variant={viewMode === "split" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("split")}
                className="rounded-none px-3 md:px-4 hidden lg:flex"
              >
                <Columns className="h-4 w-4" />
                <span className="ml-1.5">Split</span>
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className="rounded-none px-3 md:px-4"
              >
                <Map className="h-4 w-4" />
                <span className="ml-1.5 hidden sm:inline">Map</span>
              </Button>
            </div>
          </div>
        </div>

        {/* No Results */}
        {hotels.length === 0 && (
          <div className="text-center py-20 space-y-4">
            {isFiltered ? (
              <>
                <p className="text-muted-foreground text-body-lg">
                  No properties match your current filters.
                </p>
                <Button variant="outline" onClick={() => useBookingStore.getState().resetFilters()}>
                  Clear All Filters
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-body-lg">
                  No hotels found for "{searchParams.destination}" with these dates.
                </p>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your dates or searching for a nearby city.
                </p>
                <Button variant="outline" onClick={handleRetrySearch} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Search Again
                </Button>
              </>
            )}
          </div>
        )}

        {/* Results */}
        {hotels.length > 0 && effectiveViewMode === "list" && (
          <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
            {hotels.map((hotel, index) => (
              <HotelCard key={`${hotel.id}-${index}`} hotel={hotel} />
            ))}
            
            {/* Infinite scroll sentinel */}
            <div ref={listSentinelRef} className="h-4" />
            
            {/* Loading indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more properties...</span>
                </div>
              </div>
            )}
            
            {/* End of results message */}
            {!hasMoreResults && searchResults.length > 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                You've reached the end of the results
              </div>
            )}
          </div>
        )}

        {hotels.length > 0 && effectiveViewMode === "map" && (
          <div className="h-[calc(100vh-280px)] min-h-[400px] rounded-xl overflow-hidden">
            <HotelMapView hotels={hotels} />
          </div>
        )}

        {hotels.length > 0 && effectiveViewMode === "split" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-3 md:space-y-4 max-h-[600px] overflow-y-auto pr-1 md:pr-2">
              {hotels.map((hotel, index) => (
                <HotelCard 
                  key={`${hotel.id}-${index}`} 
                  hotel={hotel} 
                  compact 
                  onHover={setHoveredHotelId}
                  onFocus={setFocusedHotelId}
                />
              ))}
              
              {/* Infinite scroll sentinel for split view */}
              <div ref={splitSentinelRef} className="h-4" />
              
              {/* Loading indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="hidden lg:block sticky top-0 h-[600px] rounded-xl overflow-hidden">
              <HotelMapView 
                hotels={hotels} 
                highlightedHotelId={hoveredHotelId} 
                focusedHotelId={focusedHotelId}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
