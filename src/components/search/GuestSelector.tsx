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

interface Room {
  adults: number;
  childrenAges: number[];
}

interface GuestSelectorProps {
  rooms: Room[];
  onRoomsChange: (rooms: Room[]) => void;
}

export function GuestSelector({ rooms, onRoomsChange }: GuestSelectorProps) {
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

  const totalGuests = rooms.reduce((sum, room) => sum + room.adults + room.childrenAges.length, 0);
  const totalRooms = rooms.length;

  const updateRoom = (roomIndex: number, updates: Partial<Room>) => {
    const newRooms = rooms.map((room, i) => 
      i === roomIndex ? { ...room, ...updates } : room
    );
    onRoomsChange(newRooms);
  };

  const addRoom = () => {
    if (rooms.length < 5) {
      onRoomsChange([...rooms, { adults: 2, childrenAges: [] }]);
    }
  };

  const removeRoom = (roomIndex: number) => {
    if (rooms.length > 1) {
      onRoomsChange(rooms.filter((_, i) => i !== roomIndex));
    }
  };

  const addChild = (roomIndex: number) => {
    const room = rooms[roomIndex];
    const totalInRoom = room.adults + room.childrenAges.length;
    if (totalInRoom < 6) {
      updateRoom(roomIndex, { childrenAges: [...room.childrenAges, 5] });
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

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-12 px-4 bg-background border border-border rounded-lg hover:border-primary transition-colors min-w-[180px]"
      >
        <Users className="h-5 w-5 text-muted-foreground" />
        <span className="text-body-small text-foreground">
          {totalRooms} Room{totalRooms > 1 ? "s" : ""}, {totalGuests} Guest{totalGuests > 1 ? "s" : ""}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-80 mt-1 bg-card border border-border rounded-lg shadow-card p-4 max-h-[400px] overflow-y-auto">
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
                          value={age.toString()}
                          onValueChange={(val) => updateChildAge(roomIndex, childIndex, parseInt(val))}
                        >
                          <SelectTrigger className="flex-1 h-9">
                            <SelectValue placeholder="Age" />
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
                {room.adults + room.childrenAges.length < 6 && (
                  <button
                    onClick={() => addChild(roomIndex)}
                    className="text-primary text-sm font-medium hover:underline mt-2"
                  >
                    + Add a child
                  </button>
                )}
              </div>

              {roomIndex < rooms.length - 1 && <div className="border-t border-border mt-3" />}
            </div>
          ))}

          <div className="flex items-center justify-between pt-3 border-t border-border">
            {rooms.length < 5 && (
              <button
                onClick={addRoom}
                className="text-primary text-sm font-medium hover:underline"
              >
                + Add a room
              </button>
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
