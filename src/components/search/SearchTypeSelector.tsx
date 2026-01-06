import { MapPin, Navigation, Heart, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchType } from "@/types/booking";

interface SearchTypeSelectorProps {
  value: SearchType;
  onChange: (type: SearchType) => void;
  className?: string;
}

const searchTypes: { value: SearchType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "region", label: "Region", icon: Building2, description: "Search by city or region" },
  { value: "poi", label: "POI", icon: MapPin, description: "Search near landmarks" },
  { value: "geo", label: "Map", icon: Navigation, description: "Search by coordinates" },
  { value: "ids", label: "Favorites", icon: Heart, description: "Search saved hotels" },
];

export function SearchTypeSelector({ value, onChange, className }: SearchTypeSelectorProps) {
  return (
    <div className={cn("flex gap-1 p-1 bg-muted rounded-lg", className)}>
      {searchTypes.map((type) => {
        const Icon = type.icon;
        const isActive = value === type.value;
        
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
            title={type.description}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}
