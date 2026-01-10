import { useState } from "react";
import { Heart, X, Plus, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RATEHAWK_CONSTRAINTS, VALIDATION_MESSAGES } from "@/config/apiConstraints";

interface HotelIdsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function HotelIdsInput({ value, onChange, className }: HotelIdsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const isAtLimit = value.length >= RATEHAWK_CONSTRAINTS.MAX_HOTELS_PER_ID_SEARCH;

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed) && !isAtLimit) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Heart className="h-4 w-4" />
          </div>
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter hotel ID (e.g., hotel_123)"
            className="pl-10 h-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={!inputValue.trim() || isAtLimit}
          className="h-10 w-10"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="max-w-[150px] truncate">{id}</span>
              <button
                type="button"
                onClick={() => handleRemove(id)}
                className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Enter hotel IDs to search for specific hotels. You can find hotel IDs from your previous bookings or favorites.
        </p>
      )}

      {value.length > 0 && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {value.length} hotel{value.length !== 1 ? "s" : ""} selected
          </p>
          {isAtLimit && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>{VALIDATION_MESSAGES.MAX_HOTELS}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
