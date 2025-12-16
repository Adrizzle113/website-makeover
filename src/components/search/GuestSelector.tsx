import { useState, useRef, useEffect } from "react";
import { Users, ChevronDown, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuestSelectorProps {
  guests: number;
  rooms: number;
  onGuestsChange: (guests: number) => void;
  onRoomsChange: (rooms: number) => void;
}

export function GuestSelector({
  guests,
  rooms,
  onGuestsChange,
  onRoomsChange,
}: GuestSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const Counter = ({
    label,
    value,
    onChange,
    min = 1,
    max = 10,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
  }) => (
    <div className="flex items-center justify-between py-3">
      <span className="text-foreground font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => value > min && onChange(value - 1)}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-semibold">{value}</span>
        <button
          onClick={() => value < max && onChange(value + 1)}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-12 px-4 bg-background border border-border rounded-lg hover:border-primary transition-colors min-w-[180px]"
      >
        <Users className="h-5 w-5 text-muted-foreground" />
        <span className="text-body-small text-foreground">
          {guests} Guest{guests > 1 ? "s" : ""}, {rooms} Room{rooms > 1 ? "s" : ""}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-72 mt-1 bg-card border border-border rounded-lg shadow-card p-4">
          <Counter
            label="Guests"
            value={guests}
            onChange={onGuestsChange}
            min={1}
            max={20}
          />
          <div className="border-t border-border" />
          <Counter
            label="Rooms"
            value={rooms}
            onChange={onRoomsChange}
            min={1}
            max={10}
          />
          <Button
            onClick={() => setIsOpen(false)}
            className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
