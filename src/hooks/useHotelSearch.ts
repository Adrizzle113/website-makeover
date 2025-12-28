import { useState, useCallback } from 'react';
import { ratehawkApi } from '@/services/ratehawkApi';
import type { SearchParams, Hotel, SearchFilters } from '@/types/booking';

interface UseHotelSearchReturn {
  hotels: Hotel[];
  currentPage: number;
  hasMore: boolean;
  totalResults: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  search: (params: SearchParams, filters?: SearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export const useHotelSearch = (): UseHotelSearchReturn => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store current search params for "load more"
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters | undefined>();

  const search = useCallback(async (params: SearchParams, filters?: SearchFilters) => {
    setIsLoading(true);
    setError(null);
    
    // Store params for later use
    setSearchParams(params);
    setSearchFilters(filters);
    
    try {
      const response = await ratehawkApi.searchHotels(params, 1, filters);
      
      setHotels(response.hotels);
      setCurrentPage(1);
      setHasMore(response.hasMore);
      setTotalResults(response.totalResults);
      
      console.log("✅ Initial search complete:", {
        loaded: response.hotels.length,
        total: response.totalResults,
        hasMore: response.hasMore,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      console.error("❌ Search error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !searchParams) {
      console.log("⚠️ Cannot load more:", { hasMore, isLoadingMore, hasParams: !!searchParams });
      return;
    }
    
    setIsLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      const response = await ratehawkApi.searchHotels(searchParams, nextPage, searchFilters);
      
      setHotels(prev => [...prev, ...response.hotels]);
      setCurrentPage(nextPage);
      setHasMore(response.hasMore);
      
      console.log("✅ Loaded more hotels:", {
        page: nextPage,
        newHotels: response.hotels.length,
        totalLoaded: hotels.length + response.hotels.length,
        totalAvailable: totalResults,
      });
    } catch (err) {
      console.error('❌ Load more failed:', err);
      setError('Failed to load more hotels');
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, searchParams, searchFilters, currentPage, hotels.length, totalResults]);

  const reset = useCallback(() => {
    setHotels([]);
    setCurrentPage(1);
    setHasMore(false);
    setTotalResults(0);
    setError(null);
    setSearchParams(null);
    setSearchFilters(undefined);
  }, []);

  return {
    hotels,
    currentPage,
    hasMore,
    totalResults,
    isLoading,
    isLoadingMore,
    error,
    search,
    loadMore,
    reset,
  };
};
