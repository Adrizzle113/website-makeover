import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import { HotelCard } from "./HotelCard";
import { HotelCardSkeleton } from "./HotelCardSkeleton";
import { HotelMapView } from "./HotelMapView";
import { PrimaryFilters, AdvancedFiltersDrawer, SortingDropdown, ActiveFilterChips } from "./filters";
import { Loader2, List, Map as MapIcon, Columns } from "lucide-react";
import type { Hotel, SortOption } from "@/types/booking";
import { ratehawkApi } from "@/services/ratehawkApi";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "map" | "split";

export function SearchResultsSection() {
  const { 
    searchResults, 
    rawSearchResults,
    enrichedHotels,
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
    setEnrichedHotels,
    clearEnrichedHotels,
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

  // Animate progress bar - complete when RAW results arrive (not enrichment)
  useEffect(() => {
    if (isLoading || isFilterSearching) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + (90 - prev) * 0.1;
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      // Finish when search completes (enrichment continues in background)
      setLoadingProgress(100);
      const timeout = setTimeout(() => setLoadingProgress(0), 300);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, isFilterSearching]); // Remove isEnriching - progress completes when raw results arrive

  // Enrich a batch of hotels - continues until all have images
  const enrichBatch = useCallback(async (hotels: Hotel[]) => {
    if (hotels.length === 0 || enrichmentInProgressRef.current) return;
    
    enrichmentInProgressRef.current = true;
    setEnriching(true);
    
    try {
      const { hotels: enriched, remainingNeedImages } = await ratehawkApi.enrichHotelBatch(hotels);
      
      // Update enriched hotels in the store (cached)
      setEnrichedHotels(enriched);
      
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
  }, [setEnriching, setEnrichedHotels]);

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
    if (pendingEnrichmentCount > 0 && !enrichmentInProgressRef.current) {
      const allEnrichedHotels = Array.from(enrichedHotels.values());
      
      if (allEnrichedHotels.length > 0) {
        console.log(`🔄 Continuing enrichment: ${pendingEnrichmentCount} hotels still eligible`);
        const timer = setTimeout(() => {
          enrichBatch(allEnrichedHotels);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [pendingEnrichmentCount, enrichedHotels, enrichBatch]);

  // Server-side filter search - keep current results visible until new ones arrive
  const executeFilteredSearch = useCallback(async () => {
    if (!searchParams) return;
    
    // Only set filter searching state - DO NOT clear results or enrichment cache
    setIsFilterSearching(true);
    
    try {
      const response = await ratehawkApi.searchHotels(searchParams, 1, filters);
      // Swap in new results only after they arrive
      setRawSearchResults(response.hotels, response.totalResults);
    } catch (err) {
      console.error("Filtered search error:", err);
      toast({
        title: "Filter search failed",
        description: "Unable to apply filters. Showing cached results.",
        variant: "destructive",
      });
    } finally {
      setIsFilterSearching(false);
    }
  }, [searchParams, filters, setRawSearchResults]);

  // Watch for filter changes and trigger server-side search
  useEffect(() => {
    if (!searchParams || searchResults.length === 0) return;
    
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
    if (!filtersChanged) return;
    
    prevFiltersRef.current = filters;
    
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

  // Create rows that include both raw and enriched data
  const rows = useMemo(() => {
    return searchResults.map((rawHotel, originalIndex) => ({
      raw: rawHotel,
      enriched: enrichedHotels.get(rawHotel.id),
      originalIndex,
    }));
  }, [searchResults, enrichedHotels]);

  // Apply filtering and sorting on the rows
  const filteredRows = useMemo(() => {
    let displayRows = [...rows];
    
    // Use enriched data for filtering if available, else raw
    const getHotel = (row: typeof rows[0]) => row.enriched || row.raw;

    // Star ratings filter
    if (filters.starRatings && filters.starRatings.length > 0) {
      displayRows = displayRows.filter(row => {
        const h = getHotel(row);
        return h.starRating !== undefined && h.starRating > 0 && filters.starRatings!.includes(h.starRating);
      });
    }

    // Price range filter
    if (filters.priceMin !== undefined && filters.priceMin > 0) {
      displayRows = displayRows.filter(row => {
        const h = getHotel(row);
        return typeof h.priceFrom === 'number' && h.priceFrom >= filters.priceMin!;
      });
    }
    if (filters.priceMax !== undefined && filters.priceMax < Infinity) {
      displayRows = displayRows.filter(row => {
        const h = getHotel(row);
        return typeof h.priceFrom === 'number' && h.priceFrom <= filters.priceMax!;
      });
    }

    // Free cancellation filter
    if (filters.freeCancellationOnly) {
      displayRows = displayRows.filter(row => (getHotel(row) as any).freeCancellation === true);
    }

    // Meal plans filter
    if (filters.mealPlans && filters.mealPlans.length > 0) {
      displayRows = displayRows.filter(row => {
        const h = getHotel(row);
        const hotelMeal = (h as any).mealPlan?.toLowerCase() || '';
        return filters.mealPlans!.some(meal => 
          hotelMeal.includes(meal.toLowerCase()) || meal.toLowerCase() === 'any'
        );
      });
    }

    // Sort using enriched data when available
    return displayRows.sort((a, b) => {
      const aHotel = getHotel(a);
      const bHotel = getHotel(b);
      let result = 0;
      
      switch (sortBy) {
        case "price-low":
          result = (aHotel.priceFrom || 0) - (bHotel.priceFrom || 0);
          break;
        case "price-high":
          result = (bHotel.priceFrom || 0) - (aHotel.priceFrom || 0);
          break;
        case "rating":
          result = (bHotel.reviewScore || 0) - (aHotel.reviewScore || 0);
          break;
        case "distance":
          result = 0;
          break;
        case "free-cancellation":
          const aFree = (aHotel as any).freeCancellation ? 1 : 0;
          const bFree = (bHotel as any).freeCancellation ? 1 : 0;
          result = bFree - aFree;
          break;
        case "cheapest-rate":
          result = (aHotel.priceFrom || 0) - (bHotel.priceFrom || 0);
          break;
        case "popularity":
        default:
          result = (bHotel.reviewCount || 0) - (aHotel.reviewCount || 0);
      }
      
      // Fallback to original order for stability
      return result !== 0 ? result : a.originalIndex - b.originalIndex;
    });
  }, [rows, sortBy, filters]);

  // Get hotels for map view (use enriched if available)
  const hotelsForMap = useMemo(() => {
    return filteredRows.map(row => row.enriched || row.raw);
  }, [filteredRows]);

  // Retry handler for 503 errors
  const handleRetrySearch = useCallback(async () => {
    if (!searchParams) return;
    
    setLoading(true);
    setError(null);
    clearEnrichedHotels();
    
    try {
      const response = await ratehawkApi.searchHotels(searchParams, 1, filters);
      setRawSearchResults(response.hotels, response.totalResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchParams, filters, setLoading, setError, setRawSearchResults, clearEnrichedHotels]);

  // Preload next batch images when idle
  useEffect(() => {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) return;
    if (filteredRows.length === 0) return;
    
    // Preload images for next 6 hotels beyond current display
    const nextBatch = filteredRows
      .slice(6, 12)
      .map(r => r.enriched?.mainImage)
      .filter((url): url is string => !!url);

    const id = (window as any).requestIdleCallback(() => {
      nextBatch.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    });

    return () => (window as any).cancelIdleCallback?.(id);
  }, [filteredRows]);

  const activeFilterCount = getActiveFilterCount();
  const isFiltered = activeFilterCount > 0;

  if (!searchParams) {
    return null;
  }

  // On mobile, default to list view if split was selected
  const effectiveViewMode = viewMode === "split" && typeof window !== "undefined" && window.innerWidth < 1024 ? "list" : viewMode;

  // Check if we're in initial loading state (no raw results yet) - brand new search only
  const isInitialLoading = isLoading && !isFilterSearching && searchResults.length === 0;
  
  // Filter update loading - keep old results visible with overlay
  const isUpdatingFilters = isFilterSearching && filteredRows.length > 0;

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

  return (
    <section id="search-results" className="py-8 md:py-16 bg-cream/30 relative">
      {/* Top Loading Progress Bar */}
      {(isLoading || isFilterSearching || loadingProgress > 0) && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress 
            value={isFilterSearching ? 50 : loadingProgress} 
            className="h-1 rounded-none bg-primary/20"
          />
        </div>
      )}
      
      {/* Updating Filters Overlay Banner */}
      {isUpdatingFilters && (
        <div className="fixed top-1 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Updating results...
        </div>
      )}
      
      <div className="container px-3 md:px-4">
        {/* Header */}
        <div className="mb-4 md:mb-6 space-y-4 relative z-20">
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

        {/* Show 20 skeleton cards during initial loading (no raw results yet) */}
        {isInitialLoading && (
          <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
            {Array.from({ length: 20 }).map((_, i) => (
              <HotelCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isInitialLoading && filteredRows.length === 0 && !isEnriching && (
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
            ) : searchResults.length === 0 ? (
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
            ) : null}
          </div>
        )}

        {/* Results - Show raw cards immediately, upgrade as enrichment completes */}
        {!isInitialLoading && filteredRows.length > 0 && effectiveViewMode === "list" && (
          <div className={cn(
            "space-y-4 md:space-y-6 max-w-4xl mx-auto transition-opacity duration-200",
            isUpdatingFilters && "opacity-60 pointer-events-none"
          )}>
            {filteredRows.map(({ raw, enriched, originalIndex }, index) => (
              <HotelCard 
                key={`${raw.id}-${originalIndex}`} 
                hotel={raw}
                enrichedHotel={enriched}
                priority={index < 6}
              />
            ))}
            
            {/* Infinite scroll sentinel */}
            <div ref={listSentinelRef} className="h-4" />
            
            {/* Show skeleton cards for "load more" */}
            {isLoadingMore && (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <HotelCardSkeleton key={`loadmore-skeleton-${i}`} />
                ))}
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

        {!isInitialLoading && filteredRows.length > 0 && effectiveViewMode === "map" && (
          <div className="h-[calc(100vh-280px)] min-h-[400px] rounded-xl overflow-hidden">
            <HotelMapView hotels={hotelsForMap} />
          </div>
        )}

        {!isInitialLoading && filteredRows.length > 0 && effectiveViewMode === "split" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className={cn(
              "space-y-3 md:space-y-4 max-h-[600px] overflow-y-auto pr-1 md:pr-2 transition-opacity duration-200",
              isUpdatingFilters && "opacity-60 pointer-events-none"
            )}>
              {filteredRows.map(({ raw, enriched, originalIndex }, index) => (
                <HotelCard 
                  key={`${raw.id}-${originalIndex}`} 
                  hotel={raw}
                  enrichedHotel={enriched}
                  compact 
                  priority={index < 6}
                  onHover={setHoveredHotelId}
                  onFocus={setFocusedHotelId}
                />
              ))}
              
              {/* Infinite scroll sentinel for split view */}
              <div ref={splitSentinelRef} className="h-4" />
              
              {/* Loading indicator */}
              {isLoadingMore && (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <HotelCardSkeleton key={`split-loadmore-${i}`} compact />
                  ))}
                </div>
              )}
            </div>
            <div className="hidden lg:block sticky top-0 h-[600px] rounded-xl overflow-hidden">
              <HotelMapView 
                hotels={hotelsForMap} 
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