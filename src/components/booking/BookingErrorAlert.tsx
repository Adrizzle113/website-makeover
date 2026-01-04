import { AlertCircle, RefreshCw, ArrowLeft, Clock, Wifi } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export type BookingErrorType = 
  | "availability" 
  | "timeout" 
  | "network" 
  | "validation" 
  | "price_change" 
  | "unknown";

interface BookingErrorAlertProps {
  type: BookingErrorType;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  isRetrying?: boolean;
}

const errorConfig: Record<BookingErrorType, {
  title: string;
  description: string;
  icon: typeof AlertCircle;
  showRetry: boolean;
}> = {
  availability: {
    title: "Room No Longer Available",
    description: "This room may have been booked by someone else. Please select a different room or try again.",
    icon: AlertCircle,
    showRetry: true,
  },
  timeout: {
    title: "Request Timed Out",
    description: "The server is taking longer than expected. This often resolves itself - please try again.",
    icon: Clock,
    showRetry: true,
  },
  network: {
    title: "Connection Issue",
    description: "Unable to reach the booking server. Please check your internet connection and try again.",
    icon: Wifi,
    showRetry: true,
  },
  validation: {
    title: "Invalid Information",
    description: "Please check your booking details and ensure all required fields are filled correctly.",
    icon: AlertCircle,
    showRetry: false,
  },
  price_change: {
    title: "Price Has Changed",
    description: "The room price has changed since you started booking. Please review the new price.",
    icon: AlertCircle,
    showRetry: false,
  },
  unknown: {
    title: "Something Went Wrong",
    description: "An unexpected error occurred. Please try again or contact support if the problem persists.",
    icon: AlertCircle,
    showRetry: true,
  },
};

export function BookingErrorAlert({
  type,
  message,
  onRetry,
  onGoBack,
  isRetrying = false,
}: BookingErrorAlertProps) {
  const config = errorConfig[type];
  const IconComponent = config.icon;

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
      <IconComponent className="h-5 w-5" />
      <AlertTitle className="text-base font-semibold">{config.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-4">
          {message || config.description}
        </p>
        <div className="flex flex-wrap gap-3">
          {config.showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Retrying..." : "Try Again"}
            </Button>
          )}
          {onGoBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGoBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Helper to determine error type from error message
export function getBookingErrorType(error: Error | string): BookingErrorType {
  const message = typeof error === "string" ? error : error.message;
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return "timeout";
  }
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch") || lowerMessage.includes("connection")) {
    return "network";
  }
  if (lowerMessage.includes("availability") || lowerMessage.includes("no longer available") || lowerMessage.includes("sold out")) {
    return "availability";
  }
  if (lowerMessage.includes("invalid") || lowerMessage.includes("required") || lowerMessage.includes("missing")) {
    return "validation";
  }
  if (lowerMessage.includes("price") && lowerMessage.includes("change")) {
    return "price_change";
  }
  
  return "unknown";
}
