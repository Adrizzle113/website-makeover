import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import { HotelCard } from "./HotelCard";
import { HotelMapView } from "./HotelMapView";
import { PrimaryFilters, AdvancedFiltersDrawer, SortingDropdown, ActiveFilterChips } from "./filters";
import { Loader2, List, Map as MapIcon, Columns } from "lucide-react";
import type { Hotel, SortOption } from "@/types/booking";
import { ratehawkApi } from "@/services/ratehawkApi";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

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
    rawSearchResults,
    isLoading, 
    isLoadingMore,
    isEnriching,
    error, 
    searchParams,
    hasMoreResults,
    currentPage,
    totalResults,
    displayedCount,
    setSearchResults,
    setRawSearchResults,
    appendToDisplayed,
    appendSearchResults,
    setLoading,
    setLoadingMore,
    setEnriching,
    setError,
    getNextBatchToDisplay,
    filters,
    sortBy,
    getActiveFilterCount,
  } = useBookingStore();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);
  const [focusedHotelId, setFocusedHotelId] = useState<string | null>(null);
  const [isFilterSearching, setIsFilterSearching] = useState(false);
  const [enrichedHotels, setEnrichedHotels] = useState<Map<string, Hotel>>(new Map());
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Track previous filter state to detect changes
  const prevFiltersRef = useRef(filters);
  const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const enrichmentInProgressRef = useRef(false);
  
  // Refs for infinite scroll
  const listSentinelRef = useRef<HTMLDivElement>(null);
  const splitSentinelRef = useRef<HTMLDivElement>(null);

  // Track if we need to continue enriching
  const [pendingEnrichmentCount, setPendingEnrichmentCount] = useState(0);

  // Animate progress bar when loading or enriching
  useEffect(() => {
    if (isLoading || isFilterSearching || isEnriching) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + (90 - prev) * 0.1;
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
      const timeout = setTimeout(() => setLoadingProgress(0), 300);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, isFilterSearching, isEnriching]);

  // Enrich a batch of hotels - continues until all have images
  const enrichBatch = useCallback(async (hotels: Hotel[]) => {
    if (hotels.length === 0 || enrichmentInProgressRef.current) return;
    
    enrichmentInProgressRef.current = true;
    setEnriching(true);
    
    try {
      const { hotels: enriched, remainingNeedImages } = await ratehawkApi.enrichHotelBatch(hotels);
      
      // Update enriched hotels map
      setEnrichedHotels(prev => {
        const next = new Map(prev);
        enriched.forEach(h => next.set(h.id, h));
        return next;
      });
      
      // Track remaining for next batch
      setPendingEnrichmentCount(remainingNeedImages);
      
      console.log(`✅ Batch enriched: ${enriched.length} hotels, ${remainingNeedImages} still need images`);
    } catch (err) {
      console.error("❌ Enrichment failed:", err);
      setPendingEnrichmentCount(0);
    } finally {
      setEnriching(false);
      enrichmentInProgressRef.current = false;
    }
  }, [setEnriching]);

  // Enrich displayed hotels when they change
  useEffect(() => {
    if (searchResults.length === 0) return;
    
    // Find hotels that need enrichment (not yet in our map)
    const unenriched = searchResults.filter(h => !enrichedHotels.has(h.id));
    if (unenriched.length > 0) {
      enrichBatch(unenriched);
    }
  }, [searchResults, enrichedHotels, enrichBatch]);

  // Continue enriching if there are still eligible hotels
  useEffect(() => {
    // Only continue if API says there are remaining eligible hotels
    if (pendingEnrichmentCount > 0 && !enrichmentInProgressRef.current) {
      // Get all hotels from our enriched map for the next batch
      const allEnrichedHotels = Array.from(enrichedHotels.values());
      
      if (allEnrichedHotels.length > 0) {
        console.log(`🔄 Continuing enrichment: ${pendingEnrichmentCount} hotels still eligible`);
        // Small delay to avoid hammering the API
        const timer = setTimeout(() => {
          enrichBatch(allEnrichedHotels);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [pendingEnrichmentCount, enrichedHotels, enrichBatch]);

  // Server-side filter search
  const executeFilteredSearch = useCallback(async () => {
    if (!searchParams) return;
    
    setIsFilterSearching(true);
    setLoading(true);
    setEnrichedHotels(new Map()); // Clear enrichment cache on new search
    
    try {
      const response = await ratehawkApi.searchHotels(searchParams, 1, filters);
      // Store raw results and display first batch
      setRawSearchResults(response.hotels, response.totalResults);
      
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
  }, [searchParams, filters, setRawSearchResults, setLoading]);

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

  // Load more from raw results (no API call needed)
  const handleLoadMore = useCallback(async () => {
    if (!hasMoreResults || isLoadingMore || isEnriching) return;
    
    setLoadingMore(true);
    
    try {
      // Get next batch from raw results
      const nextBatch = getNextBatchToDisplay();
      
      if (nextBatch.length > 0) {
        appendToDisplayed(nextBatch);
        console.log(`📋 Loading next ${nextBatch.length} hotels (${displayedCount + nextBatch.length}/${rawSearchResults.length})`);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreResults, isLoadingMore, isEnriching, getNextBatchToDisplay, appendToDisplayed, setLoadingMore, displayedCount, rawSearchResults.length]);

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
    const prices = searchResults
      .map((h) => h.priceFrom)
      .filter((p): p is number => typeof p === 'number' && !isNaN(p) && p > 0);
    return {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 1000,
    };
  }, [searchResults]);

  // Apply client-side filtering AND sorting, only show enriched hotels with images
  const hotels = useMemo(() => {
    // Only show hotels that have been enriched and have images ready
    // Track original index for stable sorting
    let displayHotels = searchResults
      .map((h, originalIndex) => ({
        hotel: enrichedHotels.get(h.id),
        originalIndex
      }))
      .filter((item): item is { hotel: Hotel; originalIndex: number } => 
        item.hotel !== undefined && !!item.hotel.mainImage
      );

    // Star ratings filter - guard against undefined
    if (filters.starRatings && filters.starRatings.length > 0) {
      displayHotels = displayHotels.filter(item => 
        item.hotel.starRating !== undefined && item.hotel.starRating > 0 && filters.starRatings!.includes(item.hotel.starRating)
      );
    }

    // Price range filter - guard against undefined
    if (filters.priceMin !== undefined && filters.priceMin > 0) {
      displayHotels = displayHotels.filter(item => 
        typeof item.hotel.priceFrom === 'number' && item.hotel.priceFrom >= filters.priceMin!
      );
    }
    if (filters.priceMax !== undefined && filters.priceMax < Infinity) {
      displayHotels = displayHotels.filter(item => 
        typeof item.hotel.priceFrom === 'number' && item.hotel.priceFrom <= filters.priceMax!
      );
    }

    // Free cancellation filter
    if (filters.freeCancellationOnly) {
      displayHotels = displayHotels.filter(item => (item.hotel as any).freeCancellation === true);
    }

    // Meal plans filter
    if (filters.mealPlans && filters.mealPlans.length > 0) {
      displayHotels = displayHotels.filter(item => {
        const hotelMeal = (item.hotel as any).mealPlan?.toLowerCase() || '';
        return filters.mealPlans!.some(meal => 
          hotelMeal.includes(meal.toLowerCase()) || meal.toLowerCase() === 'any'
        );
      });
    }

    // Apply sorting with stable fallback to original index
    return displayHotels
      .sort((a, b) => {
        let result = 0;
        switch (sortBy) {
          case "price-low":
            result = (a.hotel.priceFrom || 0) - (b.hotel.priceFrom || 0);
            break;
          case "price-high":
            result = (b.hotel.priceFrom || 0) - (a.hotel.priceFrom || 0);
            break;
          case "rating":
            result = (b.hotel.reviewScore || 0) - (a.hotel.reviewScore || 0);
            break;
          case "distance":
            result = 0;
            break;
          case "free-cancellation":
            const aFree = (a.hotel as any).freeCancellation ? 1 : 0;
            const bFree = (b.hotel as any).freeCancellation ? 1 : 0;
            result = bFree - aFree;
            break;
          case "cheapest-rate":
            result = (a.hotel.priceFrom || 0) - (b.hotel.priceFrom || 0);
            break;
          case "popularity":
          default:
            result = (b.hotel.reviewCount || 0) - (a.hotel.reviewCount || 0);
        }
        // Fallback to original order for stability
        return result !== 0 ? result : a.originalIndex - b.originalIndex;
      })
      .map(item => item.hotel);
  }, [searchResults, enrichedHotels, sortBy, filters]);

  // Retry handler for 503 errors
  const handleRetrySearch = useCallback(async () => {
    if (!searchParams) return;
    
    setLoading(true);
    setError(null);
    setEnrichedHotels(new Map());
    
    try {
      const response = await ratehawkApi.searchHotels(searchParams, 1, filters);
      setRawSearchResults(response.hotels, response.totalResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchParams, filters, setLoading, setError, setRawSearchResults]);

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
    <section id="search-results" className="py-8 md:py-16 bg-cream/30 relative">
      {/* Top Loading Progress Bar */}
      {(isLoading || isFilterSearching || isEnriching || loadingProgress > 0) && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress 
            value={loadingProgress} 
            className="h-1 rounded-none bg-primary/20"
          />
        </div>
      )}
      
      {/* Loading enrichment state - show when search results exist but no enriched hotels yet */}
      {searchResults.length > 0 && hotels.length === 0 && isEnriching && (
        <div className="container">
          <div className="text-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground text-body-lg">
              Loading hotel details...
            </p>
          </div>
        </div>
      )}
      <div className="container px-3 md:px-4">
        {/* Header */}
        <div className="mb-4 md:mb-6 space-y-4">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-lg md:text-heading-md text-foreground">
                {searchParams.destination}:{" "}
                <span className="text-muted-foreground font-normal">
                  {displayedCount} of {totalResults} {totalResults === 1 ? "property" : "properties"}
                  {isFiltered && ` (filtered)`}
                </span>
              </h2>
              {(isFilterSearching || isLoading || isEnriching) && (
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
                <MapIcon className="h-4 w-4" />
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
