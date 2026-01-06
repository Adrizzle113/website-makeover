import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import type { FilterValuesData, FilterValueOption } from "@/types/filterValues";

const CACHE_KEY = "ratehawk_filter_values_v2"; // v2 to invalidate old cache
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedFilterValues {
  data: FilterValuesData;
  expiresAt: number;
}

// Default fallback values
const DEFAULT_FILTER_VALUES: FilterValuesData = {
  countries: [
    { value: "US", desc: "United States" },
    { value: "GB", desc: "United Kingdom" },
    { value: "DE", desc: "Germany" },
    { value: "FR", desc: "France" },
    { value: "ES", desc: "Spain" },
    { value: "IT", desc: "Italy" },
    { value: "AU", desc: "Australia" },
    { value: "CA", desc: "Canada" },
    { value: "AE", desc: "United Arab Emirates" },
    { value: "SA", desc: "Saudi Arabia" },
  ],
  languages: [{ value: "en", desc: "English" }],
  serpFilters: [
    { value: "has_wifi", desc: "Wi-Fi" },
    { value: "has_internet", desc: "Internet" },
    { value: "has_parking", desc: "Parking" },
    { value: "has_pool", desc: "Pool" },
    { value: "has_fitness", desc: "Fitness" },
    { value: "has_spa", desc: "Spa" },
    { value: "has_meal_breakfast", desc: "Breakfast" },
    { value: "is_pet_friendly", desc: "Pet Friendly" },
    { value: "has_airport_transfer", desc: "Airport Transfer" },
  ],
  hotelKinds: [
    { value: "Hotel", desc: "Hotel" },
    { value: "Apart-hotel", desc: "Apart-Hotel" },
    { value: "Guesthouse", desc: "Guesthouse" },
    { value: "Hostel", desc: "Hostel" },
    { value: "Resort", desc: "Resort" },
    { value: "Villa", desc: "Villa" },
    { value: "Apartment", desc: "Apartment" },
    { value: "Motel", desc: "Motel" },
    { value: "B&B", desc: "Bed & Breakfast" },
  ],
  starRatings: [1, 2, 3, 4, 5],
};

// Helper to convert string or object to FilterValueOption
const toFilterOption = (item: unknown): FilterValueOption => {
  if (typeof item === 'string') {
    return { value: item, desc: item };
  }
  if (item && typeof item === 'object' && 'value' in item) {
    const obj = item as { value: string; desc?: string };
    return { value: obj.value, desc: obj.desc || obj.value };
  }
  return { value: String(item), desc: String(item) };
};

// Normalize API response to match frontend expected format
const normalizeFilterValues = (apiData: unknown): FilterValuesData => {
  if (!apiData || typeof apiData !== 'object') {
    return DEFAULT_FILTER_VALUES;
  }
  
  const d = apiData as Record<string, unknown>;
  
  // Helper to normalize array of items
  const normalizeArray = (
    data: unknown, 
    fallback: FilterValueOption[]
  ): FilterValueOption[] => {
    if (!Array.isArray(data) || data.length === 0) return fallback;
    return data.map(toFilterOption);
  };
  
  return {
    countries: normalizeArray(d.countries, DEFAULT_FILTER_VALUES.countries),
    languages: normalizeArray(d.languages, DEFAULT_FILTER_VALUES.languages),
    // Backend sends "amenities", frontend expects "serpFilters"
    serpFilters: normalizeArray(
      d.serpFilters || d.amenities, 
      DEFAULT_FILTER_VALUES.serpFilters
    ),
    // Backend sends "hotel_types", frontend expects "hotelKinds"
    hotelKinds: normalizeArray(
      d.hotelKinds || d.hotel_types, 
      DEFAULT_FILTER_VALUES.hotelKinds
    ),
    // Backend sends "star_ratings", frontend expects "starRatings"
    starRatings: Array.isArray(d.starRatings || d.star_ratings) 
      ? (d.starRatings || d.star_ratings) as number[]
      : DEFAULT_FILTER_VALUES.starRatings,
  };
};

export function useFilterValues() {
  const [filterValues, setFilterValues] = useState<FilterValuesData>(DEFAULT_FILTER_VALUES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilterValues = async () => {
      // Check localStorage cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsedCache: CachedFilterValues = JSON.parse(cached);
        if (parsedCache.expiresAt > Date.now()) {
            console.log("📋 Using cached filter values");
            setFilterValues(normalizeFilterValues(parsedCache.data));
            setIsLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem(CACHE_KEY);
        }
      }

      // Check if we recently failed (avoid spamming)
      const failedKey = `${CACHE_KEY}_failed`;
      const lastFailed = localStorage.getItem(failedKey);
      if (lastFailed && Date.now() - parseInt(lastFailed) < 5 * 60 * 1000) {
        console.log("📋 Using defaults (API recently unavailable)");
        setIsLoading(false);
        return;
      }

      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        console.log("📋 Fetching filter values from API");
        const response = await fetch(`${API_BASE_URL}/api/ratehawk/filter-values`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`${response.status}`);
        }

        const data = await response.json();

        if (data?.success && data?.data) {
          console.log("✅ Filter values fetched successfully");
          const normalized = normalizeFilterValues(data.data);
          setFilterValues(normalized);
          localStorage.removeItem(failedKey);

          const cacheData: CachedFilterValues = {
            data: normalized,
            expiresAt: Date.now() + CACHE_TTL,
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } else {
          console.warn("⚠️ Filter values API returned no data, using defaults");
        }
      } catch (err) {
        clearTimeout(timeoutId);
        const message = err instanceof Error ? err.message : "unknown";
        console.warn(`⚠️ Filter values unavailable (${message}), using defaults`);
        localStorage.setItem(failedKey, Date.now().toString());
        // Keep using default values - already in state
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilterValues();
  }, []);

  return { filterValues, isLoading, error };
}
