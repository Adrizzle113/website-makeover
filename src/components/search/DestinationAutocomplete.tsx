import { useState, useEffect, useRef } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ratehawkApi } from "@/services/ratehawkApi";
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Fetch destinations with debounce and request cancellation
  useEffect(() => {
    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Debounce the API call
    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await ratehawkApi.getDestinations(query, controller.signal);
        
        // Only update state if this request wasn't cancelled
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setIsOpen(true);
        }
      } catch (error) {
        // Ignore AbortError - it's expected when user types quickly
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error("Error fetching destinations:", error);
        // Fallback suggestion for non-abort errors
        if (!controller.signal.aborted) {
          setSuggestions([
            { id: "", name: query, country: "Search this location", type: "city" },
          ]);
          setIsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    // Cleanup: cancel timeout and abort request on unmount or query change
    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (destination: Destination) => {
    setQuery(destination.name);
    onChange(destination.name, destination.id);
    setIsOpen(false);
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
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 h-12 text-body-small bg-background border-border"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
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

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Search className="h-4 w-4 text-muted-foreground animate-pulse" />
        </div>
      )}
    </div>
  );
}
