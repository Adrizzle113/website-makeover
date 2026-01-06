import { useState, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface POISearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Common POI examples for hints
const POI_EXAMPLES = [
  "The Forum in Inglewood",
  "Madison Square Garden",
  "SoFi Stadium",
  "Disneyland",
  "Times Square",
  "Golden Gate Bridge",
];

export function POISearchInput({ value, onChange, placeholder, className }: POISearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const randomExample = POI_EXAMPLES[Math.floor(Math.random() * POI_EXAMPLES.length)];

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
      </div>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || `e.g., ${randomExample}`}
        className="pl-10 h-12"
      />
      {isFocused && !value && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-popover border border-border rounded-md shadow-md z-10">
          <p className="text-xs text-muted-foreground mb-2">
            Enter a landmark, venue, or point of interest:
          </p>
          <div className="flex flex-wrap gap-1">
            {POI_EXAMPLES.slice(0, 4).map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  onChange(example);
                  setIsFocused(false);
                }}
                className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
