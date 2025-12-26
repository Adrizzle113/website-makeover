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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDestinations = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await ratehawkApi.getDestinations(query);
        setSuggestions(results);
        setIsOpen(true);
      } catch (error) {
        console.error("Error fetching destinations:", error);
        // Use the query as destination name (no ID) so search uses name resolution
        setSuggestions([
          { id: "", name: query, country: "Search this location", type: "city" },
        ]);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchDestinations, 300);
    return () => clearTimeout(debounce);
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
              key={destination.id}
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
