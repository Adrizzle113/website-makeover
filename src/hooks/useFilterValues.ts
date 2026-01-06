import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import type { FilterValuesData } from "@/types/filterValues";

const CACHE_KEY = "ratehawk_filter_values";
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
            setFilterValues(parsedCache.data);
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
          setFilterValues(data.data);
          localStorage.removeItem(failedKey);

          const cacheData: CachedFilterValues = {
            data: data.data,
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
