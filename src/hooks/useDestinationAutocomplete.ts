import { useState, useEffect, useRef, useCallback } from "react";
import { ratehawkApi } from "@/services/ratehawkApi";
import { useDebounce } from "@/hooks/useDebounce";
import type { Destination } from "@/types/booking";

interface UseDestinationAutocompleteOptions {
  initialValue?: string;
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseDestinationAutocompleteReturn {
  query: string;
  setQuery: (value: string) => void;
  suggestions: Destination[];
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  handleSelect: (destination: Destination) => void;
  reset: () => void;
}

export function useDestinationAutocomplete(
  onChange: (value: string, destinationId?: string) => void,
  options: UseDestinationAutocompleteOptions = {}
): UseDestinationAutocompleteReturn {
  const {
    initialValue = "",
    debounceMs = 500,
    minQueryLength = 2,
  } = options;

  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce the query to prevent rapid-fire requests
  const debouncedQuery = useDebounce(query, debounceMs);

  // Fetch destinations when debounced query changes
  useEffect(() => {
    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (debouncedQuery.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchDestinations = async () => {
      setIsLoading(true);
      try {
        const results = await ratehawkApi.getDestinations(debouncedQuery, controller.signal);

        // Only update state if this request wasn't cancelled
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setIsOpen(true);
        }
      } catch (err) {
        // Ignore AbortError - it's expected when user types quickly
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        console.error("Error fetching destinations:", err);

        // For rate limits and other errors, silently use fallback
        if (!controller.signal.aborted) {
          setSuggestions([
            { id: "", name: debouncedQuery, country: "Search this location", type: "city" },
          ]);
          setIsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchDestinations();

    // Cleanup: abort request on unmount or query change
    return () => {
      controller.abort();
    };
  }, [debouncedQuery, minQueryLength]);

  const handleSelect = useCallback(
    (destination: Destination) => {
      setQuery(destination.name);
      onChange(destination.name, destination.id);
      setIsOpen(false);
    },
    [onChange]
  );

  const reset = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  }, []);

  // Handle query changes and notify parent
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      onChange(value);
    },
    [onChange]
  );

  return {
    query,
    setQuery: handleQueryChange,
    suggestions,
    isLoading,
    isOpen,
    setIsOpen,
    handleSelect,
    reset,
  };
}
