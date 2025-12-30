import { useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBookingStore } from "@/stores/bookingStore";
import { format, parseISO } from "date-fns";
import type { SearchFilters, SortOption, MealPlan } from "@/types/booking";

// URL parameter keys
const URL_PARAMS = {
  // Search params
  destination: "dest",
  destinationId: "destId",
  checkIn: "checkIn",
  checkOut: "checkOut",
  guests: "guests",
  rooms: "rooms",
  children: "children",
  childrenAges: "ages",
  // Filters
  starRatings: "stars",
  priceMin: "priceMin",
  priceMax: "priceMax",
  mealPlans: "meals",
  amenities: "amenities",
  freeCancellation: "freeCancellation",
  residency: "residency",
  // Sort
  sortBy: "sort",
} as const;

// Parse URL params to state
export function parseSearchParamsFromURL(searchParams: URLSearchParams) {
  const destination = searchParams.get(URL_PARAMS.destination) || "";
  const destinationId = searchParams.get(URL_PARAMS.destinationId) || undefined;
  const checkInStr = searchParams.get(URL_PARAMS.checkIn);
  const checkOutStr = searchParams.get(URL_PARAMS.checkOut);
  const guests = parseInt(searchParams.get(URL_PARAMS.guests) || "2", 10);
  const rooms = parseInt(searchParams.get(URL_PARAMS.rooms) || "1", 10);
  const children = parseInt(searchParams.get(URL_PARAMS.children) || "0", 10);
  const agesStr = searchParams.get(URL_PARAMS.childrenAges);
  const childrenAges = agesStr ? agesStr.split(",").map(Number).filter(n => !isNaN(n)) : [];

  // Parse dates
  let checkIn: Date | null = null;
  let checkOut: Date | null = null;
  try {
    if (checkInStr) checkIn = parseISO(checkInStr);
    if (checkOutStr) checkOut = parseISO(checkOutStr);
  } catch (e) {
    // Invalid date format, ignore
  }

  return {
    destination,
    destinationId,
    checkIn,
    checkOut,
    guests,
    rooms,
    children,
    childrenAges,
    hasSearchParams: !!(destination && destinationId && checkIn && checkOut),
  };
}

export function parseFiltersFromURL(searchParams: URLSearchParams): Partial<SearchFilters> {
  const filters: Partial<SearchFilters> = {};

  const starsStr = searchParams.get(URL_PARAMS.starRatings);
  if (starsStr) {
    filters.starRatings = starsStr.split(",").map(Number).filter(n => !isNaN(n));
  }

  const priceMin = searchParams.get(URL_PARAMS.priceMin);
  if (priceMin) filters.priceMin = parseInt(priceMin, 10);

  const priceMax = searchParams.get(URL_PARAMS.priceMax);
  if (priceMax) filters.priceMax = parseInt(priceMax, 10);

  const mealsStr = searchParams.get(URL_PARAMS.mealPlans);
  if (mealsStr) {
    filters.mealPlans = mealsStr.split(",") as MealPlan[];
  }

  const amenitiesStr = searchParams.get(URL_PARAMS.amenities);
  if (amenitiesStr) {
    filters.amenities = amenitiesStr.split(",");
  }

  const freeCancellation = searchParams.get(URL_PARAMS.freeCancellation);
  if (freeCancellation === "true") {
    filters.freeCancellationOnly = true;
  }

  const residency = searchParams.get(URL_PARAMS.residency);
  if (residency) filters.residency = residency;

  return filters;
}

export function parseSortFromURL(searchParams: URLSearchParams): SortOption | null {
  const sort = searchParams.get(URL_PARAMS.sortBy);
  if (sort && ["popularity", "price-low", "price-high", "rating", "distance", "free-cancellation", "cheapest-rate"].includes(sort)) {
    return sort as SortOption;
  }
  return null;
}

// Build URL params from state
export function buildURLParams(
  searchParams: {
    destination?: string;
    destinationId?: string;
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
    rooms?: number;
    children?: number;
    childrenAges?: number[];
  } | null,
  filters: SearchFilters,
  sortBy: SortOption
): URLSearchParams {
  const params = new URLSearchParams();

  // Search params
  if (searchParams) {
    if (searchParams.destination) params.set(URL_PARAMS.destination, searchParams.destination);
    if (searchParams.destinationId) params.set(URL_PARAMS.destinationId, searchParams.destinationId);
    if (searchParams.checkIn) params.set(URL_PARAMS.checkIn, format(searchParams.checkIn, "yyyy-MM-dd"));
    if (searchParams.checkOut) params.set(URL_PARAMS.checkOut, format(searchParams.checkOut, "yyyy-MM-dd"));
    if (searchParams.guests) params.set(URL_PARAMS.guests, searchParams.guests.toString());
    if (searchParams.rooms) params.set(URL_PARAMS.rooms, searchParams.rooms.toString());
    if (searchParams.children && searchParams.children > 0) {
      params.set(URL_PARAMS.children, searchParams.children.toString());
    }
    if (searchParams.childrenAges && searchParams.childrenAges.length > 0) {
      params.set(URL_PARAMS.childrenAges, searchParams.childrenAges.join(","));
    }
  }

  // Filters (only set non-default values)
  if (filters.starRatings.length > 0) {
    params.set(URL_PARAMS.starRatings, filters.starRatings.join(","));
  }
  if (filters.priceMin !== undefined) {
    params.set(URL_PARAMS.priceMin, filters.priceMin.toString());
  }
  if (filters.priceMax !== undefined) {
    params.set(URL_PARAMS.priceMax, filters.priceMax.toString());
  }
  if (filters.mealPlans.length > 0) {
    params.set(URL_PARAMS.mealPlans, filters.mealPlans.join(","));
  }
  if (filters.amenities.length > 0) {
    params.set(URL_PARAMS.amenities, filters.amenities.join(","));
  }
  if (filters.freeCancellationOnly) {
    params.set(URL_PARAMS.freeCancellation, "true");
  }
  if (filters.residency && filters.residency !== "US") {
    params.set(URL_PARAMS.residency, filters.residency);
  }

  // Sort (only set non-default)
  if (sortBy !== "popularity") {
    params.set(URL_PARAMS.sortBy, sortBy);
  }

  return params;
}

// Hook to sync URL with store state
export function useURLSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    searchParams: storeSearchParams, 
    filters, 
    sortBy,
    setSearchParams: setStoreSearchParams,
    setFilters,
    setSortBy,
  } = useBookingStore();
  
  const isInitialMount = useRef(true);
  const isUpdatingFromURL = useRef(false);

  // On mount, restore state from URL if present
  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    const parsed = parseSearchParamsFromURL(searchParams);
    const parsedFilters = parseFiltersFromURL(searchParams);
    const parsedSort = parseSortFromURL(searchParams);

    // Only restore if URL has search params
    if (parsed.hasSearchParams && parsed.checkIn && parsed.checkOut) {
      isUpdatingFromURL.current = true;
      
      setStoreSearchParams({
        destination: parsed.destination,
        destinationId: parsed.destinationId,
        checkIn: parsed.checkIn,
        checkOut: parsed.checkOut,
        guests: parsed.guests,
        rooms: parsed.rooms,
        children: parsed.children,
        childrenAges: parsed.childrenAges,
      });

      if (Object.keys(parsedFilters).length > 0) {
        setFilters(parsedFilters);
      }

      if (parsedSort) {
        setSortBy(parsedSort);
      }

      // Reset flag after a tick
      setTimeout(() => {
        isUpdatingFromURL.current = false;
      }, 100);
    }
  }, []); // Only run on mount

  // Sync store state to URL when it changes
  const updateURL = useCallback(() => {
    if (isUpdatingFromURL.current) return;

    const newParams = buildURLParams(storeSearchParams, filters, sortBy);
    const currentParamsStr = searchParams.toString();
    const newParamsStr = newParams.toString();

    // Only update if params actually changed
    if (currentParamsStr !== newParamsStr) {
      setSearchParams(newParams, { replace: true });
    }
  }, [storeSearchParams, filters, sortBy, searchParams, setSearchParams]);

  // Update URL when store changes (debounced)
  useEffect(() => {
    if (isInitialMount.current) return;
    
    const timer = setTimeout(updateURL, 100);
    return () => clearTimeout(timer);
  }, [storeSearchParams, filters, sortBy, updateURL]);

  return {
    updateURL,
    getShareableURL: () => {
      const params = buildURLParams(storeSearchParams, filters, sortBy);
      return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    },
  };
}

// Hook to get initial values from URL for forms
export function useURLSearchParams() {
  const [searchParams] = useSearchParams();
  return parseSearchParamsFromURL(searchParams);
}

export function useURLFilters() {
  const [searchParams] = useSearchParams();
  return parseFiltersFromURL(searchParams);
}

export function useURLSort() {
  const [searchParams] = useSearchParams();
  return parseSortFromURL(searchParams);
}
