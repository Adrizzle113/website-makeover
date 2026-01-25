import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";
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
}

// Map error codes to user-friendly messages
function getErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    double_booking_form: "This room is already being booked",
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

export function PartialRoomFailureModal({
  open,
  onOpenChange,
  failedRooms,
  successfulRooms,
  totalRooms,
  roomNames,
  onContinue,
  onGoBack,
}: PartialRoomFailureModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center text-xl">
            Room Availability Issue
          </DialogTitle>
          <DialogDescription className="text-center">
            {failedRooms.length} of {totalRooms} room{totalRooms > 1 ? "s" : ""} could not be processed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Failed rooms */}
          {failedRooms.map((room) => (
            <div
              key={room.roomIndex}
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
            >
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive/20">
                <span className="text-xs font-medium text-destructive">✕</span>
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

          {/* Successful rooms indicator */}
          {successfulRooms > 0 && (
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
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {successfulRooms > 0 && (
            <Button
              onClick={onContinue}
              className="w-full"
            >
              Continue with {successfulRooms} Room{successfulRooms > 1 ? "s" : ""}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onGoBack}
            className="w-full gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Select Different Rooms
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
