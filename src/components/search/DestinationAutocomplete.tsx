import { useState, useEffect, useRef } from "react";
import { MapPin, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ratehawkApi } from "@/services/ratehawkApi";
import { useDebounce } from "@/hooks/useDebounce";
import type { Destination } from "@/types/booking";

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string, destinationId?: string) => void;
  placeholder?: string;
}

export function DestinationAutocomplete({
  value,
  onChange,
  placeholder = "Where are you going?",
}: DestinationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce the query to prevent rapid-fire requests
  const debouncedQuery = useDebounce(query, 300);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch destinations when debounced query changes
  useEffect(() => {
    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset error state
    setError(null);

    if (debouncedQuery.length < 2) {
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
          setError(null);
        }
      } catch (err) {
        // Ignore AbortError - it's expected when user types quickly
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        
        console.error("Error fetching destinations:", err);
        
        // Handle rate limit errors
        if (err instanceof Error && err.message.includes('429')) {
          setError("Too many requests. Please wait a moment.");
        } else {
          setError(null); // Don't show error for other cases, just fallback
        }
        
        // Fallback suggestion for non-abort errors
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
  }, [debouncedQuery]);

  const handleSelect = (destination: Destination) => {
    setQuery(destination.name);
    onChange(destination.name, destination.id);
    setIsOpen(false);
    setError(null);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => debouncedQuery.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 h-12 text-body-small bg-background border-border"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <div className="absolute z-50 w-full mt-1 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isOpen && suggestions.length > 0 && !error && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-card overflow-hidden">
          {suggestions.map((destination) => (
            <button
              key={destination.id || destination.name}
              onClick={() => handleSelect(destination)}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">{destination.name}</p>
                <p className="text-sm text-muted-foreground">{destination.country}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
