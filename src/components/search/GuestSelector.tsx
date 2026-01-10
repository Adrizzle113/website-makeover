import { useState, useRef, useEffect } from "react";
import { Users, ChevronDown, Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RATEHAWK_CONSTRAINTS, VALIDATION_MESSAGES } from "@/config/apiConstraints";

interface Room {
  adults: number;
  childrenAges: number[];
}

interface GuestSelectorProps {
  rooms: Room[];
  onRoomsChange: (rooms: Room[]) => void;
  showValidation?: boolean;
}

// Use -1 to indicate unselected age
const UNSELECTED_AGE = -1;

export function GuestSelector({ rooms, onRoomsChange, showValidation = false }: GuestSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking inside the wrapper or on Radix select content (rendered in portal)
      if (
        wrapperRef.current?.contains(target) ||
        target.closest('[data-radix-popper-content-wrapper]')
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalGuests = rooms.reduce((sum, room) => sum + room.adults + room.childrenAges.length, 0);
  const totalRooms = rooms.length;
  const totalChildren = rooms.reduce((sum, room) => sum + room.childrenAges.length, 0);

  // Check if any children have unselected ages
  const hasUnselectedChildAges = rooms.some(room => 
    room.childrenAges.some(age => age === UNSELECTED_AGE)
  );

  const updateRoom = (roomIndex: number, updates: Partial<Room>) => {
    const newRooms = rooms.map((room, i) => 
      i === roomIndex ? { ...room, ...updates } : room
    );
    onRoomsChange(newRooms);
  };

  const addRoom = () => {
    if (rooms.length < RATEHAWK_CONSTRAINTS.MAX_ROOMS_PER_REQUEST) {
      onRoomsChange([...rooms, { adults: 2, childrenAges: [] }]);
    }
  };

  // Check if room has reached max children limit
  const hasMaxChildren = (room: Room) => 
    room.childrenAges.length >= RATEHAWK_CONSTRAINTS.MAX_CHILDREN_PER_ROOM;

  const removeRoom = (roomIndex: number) => {
    if (rooms.length > 1) {
      onRoomsChange(rooms.filter((_, i) => i !== roomIndex));
    }
  };

  const addChild = (roomIndex: number) => {
    const room = rooms[roomIndex];
    const totalInRoom = room.adults + room.childrenAges.length;
    // Check both total guests per room AND max children per room limits
    if (totalInRoom < RATEHAWK_CONSTRAINTS.MAX_GUESTS_PER_ROOM && 
        room.childrenAges.length < RATEHAWK_CONSTRAINTS.MAX_CHILDREN_PER_ROOM) {
      // Add child with UNSELECTED_AGE to require explicit selection
      updateRoom(roomIndex, { childrenAges: [...room.childrenAges, UNSELECTED_AGE] });
    }
  };

  const removeChild = (roomIndex: number, childIndex: number) => {
    const room = rooms[roomIndex];
    updateRoom(roomIndex, {
      childrenAges: room.childrenAges.filter((_, i) => i !== childIndex)
    });
  };

  const updateChildAge = (roomIndex: number, childIndex: number, age: number) => {
    const room = rooms[roomIndex];
    const newAges = [...room.childrenAges];
    newAges[childIndex] = age;
    updateRoom(roomIndex, { childrenAges: newAges });
  };

  const Counter = ({
    value,
    onChange,
    min = 1,
    max = 10,
  }: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
  }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => value > min && onChange(value - 1)}
        disabled={value <= min}
        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-6 text-center font-semibold">{value}</span>
      <button
        onClick={() => value < max && onChange(value + 1)}
        disabled={value >= max}
        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );

  // Build display text
  const getDisplayText = () => {
    const parts = [`${totalRooms} Room${totalRooms > 1 ? "s" : ""}`];
    parts.push(`${totalGuests} Guest${totalGuests > 1 ? "s" : ""}`);
    return parts.join(", ");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 h-12 px-4 bg-background border rounded-lg hover:border-primary transition-colors min-w-[180px]",
          showValidation && hasUnselectedChildAges 
            ? "border-destructive" 
            : "border-border"
        )}
      >
        <Users className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-foreground">
          {getDisplayText()}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-80 mt-1 bg-card border border-border rounded-lg shadow-lg p-4 max-h-[400px] overflow-y-auto">
          {/* Validation warning */}
          {hasUnselectedChildAges && (
            <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-xs text-destructive">
                Please select age for all children
              </p>
            </div>
          )}

          {rooms.map((room, roomIndex) => (
            <div key={roomIndex} className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-foreground">Room {roomIndex + 1}</span>
                {rooms.length > 1 && (
                  <button
                    onClick={() => removeRoom(roomIndex)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-foreground">Adults</span>
                <Counter
                  value={room.adults}
                  onChange={(adults) => updateRoom(roomIndex, { adults })}
                  min={1}
                  max={6 - room.childrenAges.length}
                />
              </div>

              <div className="mb-3">
                <span className="text-sm text-foreground block mb-2">Children</span>
                {room.childrenAges.length > 0 ? (
                  <div className="space-y-2">
                    {room.childrenAges.map((age, childIndex) => (
                      <div key={childIndex} className="flex items-center gap-2">
                        <Select
                          value={age === UNSELECTED_AGE ? "" : age.toString()}
                          onValueChange={(val) => updateChildAge(roomIndex, childIndex, parseInt(val))}
                        >
                          <SelectTrigger 
                            className={cn(
                              "flex-1 h-9",
                              age === UNSELECTED_AGE && showValidation && "border-destructive"
                            )}
                          >
                            <SelectValue placeholder="Select age" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 18 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i === 0 ? "Under 1" : `${i} years`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => removeChild(roomIndex, childIndex)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {room.adults + room.childrenAges.length < RATEHAWK_CONSTRAINTS.MAX_GUESTS_PER_ROOM && 
                 room.childrenAges.length < RATEHAWK_CONSTRAINTS.MAX_CHILDREN_PER_ROOM && (
                  <button
                    onClick={() => addChild(roomIndex)}
                    className="text-primary text-sm font-medium hover:underline mt-2"
                  >
                    + Add a child
                  </button>
                )}
                {hasMaxChildren(room) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {VALIDATION_MESSAGES.MAX_CHILDREN}
                  </p>
                )}
              </div>

              {roomIndex < rooms.length - 1 && <div className="border-t border-border mt-3" />}
            </div>
          ))}

          <div className="flex items-center justify-between pt-3 border-t border-border">
            {rooms.length < RATEHAWK_CONSTRAINTS.MAX_ROOMS_PER_REQUEST ? (
              <button
                onClick={addRoom}
                className="text-primary text-sm font-medium hover:underline"
              >
                + Add a room
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">
                {VALIDATION_MESSAGES.MAX_ROOMS}
              </p>
            )}
            <Button
              onClick={() => setIsOpen(false)}
              className="ml-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to check if rooms have valid children ages
export function hasValidChildrenAges(rooms: Room[]): boolean {
  return !rooms.some(room => room.childrenAges.some(age => age === UNSELECTED_AGE));
}

// Export the unselected age constant for use in other components
export { UNSELECTED_AGE };
