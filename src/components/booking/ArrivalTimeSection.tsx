import { Clock, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBookingStore } from "@/stores/bookingStore";

interface ArrivalTimeSectionProps {
  defaultCheckInTime?: string;
  onArrivalTimeChange?: (time: string | null) => void;
}

// Generate time slots from a given start time to 11:30 PM in 30-minute intervals
const generateTimeSlots = (startHour: number = 14) => {
  const slots: { value: string; label: string }[] = [];
  
  for (let hour = startHour; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 23 && minute > 30) break;
      const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const label = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
      slots.push({ value: time24, label });
    }
  }
  
  return slots;
};

export function ArrivalTimeSection({ 
  defaultCheckInTime = "15:00",
  onArrivalTimeChange 
}: ArrivalTimeSectionProps) {
  const { selectedUpsells } = useBookingStore();
  
  // Check if early check-in is selected
  const earlyCheckIn = selectedUpsells.find(u => u.type === "early_checkin");
  const hasEarlyCheckIn = !!earlyCheckIn;
  
  // Determine start time based on early check-in
  const startHour = hasEarlyCheckIn && earlyCheckIn.newTime
    ? parseInt(earlyCheckIn.newTime.split(":")[0])
    : parseInt(defaultCheckInTime.split(":")[0]);
    
  const timeSlots = generateTimeSlots(startHour);

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Estimated Arrival Time
            </h3>
            <p className="text-sm text-muted-foreground">
              Let the hotel know when you plan to arrive
            </p>
          </div>
        </div>

        {hasEarlyCheckIn && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              Early check-in requested from {earlyCheckIn.newTime || "10:00 AM"}
            </span>
          </div>
        )}

        <Select onValueChange={(value) => onArrivalTimeChange?.(value === "unknown" ? null : value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select estimated arrival time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unknown">
              I don't know yet
            </SelectItem>
            {timeSlots.map((slot) => (
              <SelectItem key={slot.value} value={slot.value}>
                {slot.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-xs text-muted-foreground mt-2">
          This helps the hotel prepare for your arrival. You can always update this later.
        </p>
      </CardContent>
    </Card>
  );
}
