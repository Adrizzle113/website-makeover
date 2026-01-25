import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import type { MultiroomFailedRoom } from "@/types/etgBooking";

interface PartialRoomFailureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  failedRooms: MultiroomFailedRoom[];
  successfulRooms: number;
  totalRooms: number;
  roomNames?: Map<number, string>;
  onContinue: () => void;
  onGoBack: () => void;
  onRetryWithNewSession?: () => void;
}

// Map error codes to user-friendly messages
function getErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    double_booking_form: "Session conflict - please try again",
    rate_not_found: "Rate no longer available",
    soldout: "Room is sold out",
    timeout: "Booking system timed out",
    prebook_failed: "Could not verify availability",
    invalid_book_hash: "Rate expired - please select again",
    no_available_rates: "Rate no longer available",
    incorrect_children_data: "Guest composition mismatch",
    insufficient_b2b_balance: "Payment method unavailable",
  };
  return errorMessages[code] || "Unable to process this room";
}

// Check if any failed room is due to a session conflict (double_booking_form)
function hasSessionConflict(failedRooms: MultiroomFailedRoom[]): boolean {
  return failedRooms.some(room => room.code === "double_booking_form");
}

// Check if all failures are due to session conflicts
function allAreSessionConflicts(failedRooms: MultiroomFailedRoom[]): boolean {
  return failedRooms.length > 0 && failedRooms.every(room => room.code === "double_booking_form");
}

export function PartialRoomFailureModal({
  open,
  onOpenChange,
  failedRooms,
  successfulRooms,
  totalRooms,
  roomNames,
  onContinue,
  onGoBack,
  onRetryWithNewSession,
}: PartialRoomFailureModalProps) {
  const isSessionConflict = hasSessionConflict(failedRooms);
  const isAllSessionConflicts = allAreSessionConflicts(failedRooms);
  
  // If ANY room failed due to session conflict, show conflict messaging and block partial continue
  const title = isSessionConflict 
    ? "Booking Session Conflict" 
    : "Room Availability Issue";
    
  const description = isSessionConflict
    ? "Your booking session has been interrupted. You'll need to start a fresh booking to ensure all rooms are available."
    : `${failedRooms.length} of ${totalRooms} room${totalRooms > 1 ? "s" : ""} could not be processed`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isSessionConflict ? 'bg-destructive/10' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
            {isSessionConflict ? (
              <AlertCircle className="h-6 w-6 text-destructive" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Failed rooms */}
          {failedRooms.map((room) => (
            <div
              key={room.roomIndex}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                room.code === "double_booking_form" 
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                room.code === "double_booking_form" 
                  ? "bg-amber-500/20"
                  : "bg-destructive/20"
              }`}>
                <span className={`text-xs font-medium ${
                  room.code === "double_booking_form" ? "text-amber-600" : "text-destructive"
                }`}>✕</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {roomNames?.get(room.roomIndex) || `Room ${room.roomIndex + 1}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getErrorMessage(room.code)}
                </p>
              </div>
            </div>
          ))}

          {/* Successful rooms indicator - hidden when any session conflict exists */}
          {successfulRooms > 0 && !isSessionConflict && (
            <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-3 w-3 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {successfulRooms} room{successfulRooms > 1 ? "s" : ""} ready to book
                </p>
                <p className="text-xs text-muted-foreground">
                  You can proceed with {successfulRooms === 1 ? "this room" : "these rooms"}
                </p>
              </div>
            </div>
          )}
          
          {/* Session conflict explanation */}
          {isSessionConflict && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> This usually happens when the page was refreshed or the booking was interrupted. 
                Starting a fresh booking will get you new, valid room rates.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {/* Continue with successful rooms - blocked when ANY session conflict exists */}
          {successfulRooms > 0 && !isSessionConflict && (
            <Button
              onClick={onContinue}
              className="w-full"
            >
              Continue with {successfulRooms} Room{successfulRooms > 1 ? "s" : ""}
            </Button>
          )}
          
          {/* Retry with new session - shown for session conflicts */}
          {isSessionConflict && onRetryWithNewSession && (
            <Button
              variant="outline"
              onClick={onRetryWithNewSession}
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry with New Session
            </Button>
          )}
          
          <Button
            variant={isSessionConflict ? "default" : "outline"}
            onClick={onGoBack}
            className="w-full gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {isSessionConflict ? "Start Fresh Booking" : "Select Different Rooms"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}