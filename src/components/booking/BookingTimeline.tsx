import { CheckCircle, Circle, Clock } from "lucide-react";
import { format } from "date-fns";

interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  timestamp?: string;
  status: "completed" | "current" | "pending";
}

interface BookingTimelineProps {
  bookingDate: string;
  confirmedAt?: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
}

export function BookingTimeline({
  bookingDate,
  confirmedAt,
  checkInDate,
  checkOutDate,
  status,
}: BookingTimelineProps) {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  const getStepStatus = (stepId: string): "completed" | "current" | "pending" => {
    if (status === "cancelled") {
      return stepId === "submitted" || stepId === "confirmed" ? "completed" : "pending";
    }

    switch (stepId) {
      case "submitted":
        return "completed";
      case "confirmed":
        return confirmedAt || status === "confirmed" ? "completed" : "pending";
      case "hotel_notified":
        return confirmedAt || status === "confirmed" ? "completed" : "pending";
      case "checkin":
        if (now >= checkIn) return "completed";
        if (now >= new Date(checkIn.getTime() - 24 * 60 * 60 * 1000)) return "current";
        return "pending";
      case "checkout":
        return now >= checkOut ? "completed" : "pending";
      default:
        return "pending";
    }
  };

  const steps: TimelineStep[] = [
    {
      id: "submitted",
      label: "Booking Submitted",
      description: "Your reservation request was received",
      timestamp: bookingDate,
      status: getStepStatus("submitted"),
    },
    {
      id: "confirmed",
      label: "Booking Confirmed",
      description: "Payment verified and reservation confirmed",
      timestamp: confirmedAt || bookingDate,
      status: getStepStatus("confirmed"),
    },
    {
      id: "hotel_notified",
      label: "Hotel Notified",
      description: "The hotel has received your reservation",
      timestamp: confirmedAt || bookingDate,
      status: getStepStatus("hotel_notified"),
    },
    {
      id: "checkin",
      label: "Check-in",
      description: `Arrive at the hotel on ${format(checkIn, "MMMM d, yyyy")}`,
      timestamp: checkInDate,
      status: getStepStatus("checkin"),
    },
    {
      id: "checkout",
      label: "Check-out",
      description: `Complete your stay on ${format(checkOut, "MMMM d, yyyy")}`,
      timestamp: checkOutDate,
      status: getStepStatus("checkout"),
    },
  ];

  return (
    <div className="relative">
      {steps.map((step, index) => (
        <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`absolute left-[11px] top-6 w-0.5 h-full -translate-x-1/2 ${
                step.status === "completed"
                  ? "bg-primary"
                  : "bg-border"
              }`}
            />
          )}

          {/* Status Icon */}
          <div className="relative z-10 shrink-0">
            {step.status === "completed" ? (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-primary-foreground" />
              </div>
            ) : step.status === "current" ? (
              <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                <Clock className="w-3 h-3 text-primary" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                <Circle className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <h4
                className={`font-medium ${
                  step.status === "completed"
                    ? "text-foreground"
                    : step.status === "current"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </h4>
              {step.timestamp && step.status === "completed" && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(step.timestamp), "MMM d, h:mm a")}
                </span>
              )}
            </div>
            {step.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {step.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
