import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDestinationAutocomplete } from "@/hooks/useDestinationAutocomplete";
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
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    suggestions,
    isLoading,
    isOpen,
    setIsOpen,
    handleSelect,
  } = useDestinationAutocomplete(onChange, { initialValue: value });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 h-12 text-body-small bg-background border-border"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-card border border-border rounded-lg shadow-card overflow-hidden">
          {suggestions.map((destination: Destination) => (
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
