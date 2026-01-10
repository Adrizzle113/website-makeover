import { AlertCircle, CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { MultiroomPrebookResponse, MultiroomFailedRoom } from "@/types/etgBooking";

interface MultiroomPriceChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prebookResponse: MultiroomPrebookResponse;
  roomNames: Map<number, string>; // Map roomIndex to room name
  currency: string;
  onAccept: () => void;
  onDecline: () => void;
  onContinueWithAvailable?: () => void; // Continue with only successful rooms
}

export function MultiroomPriceChangeModal({
  open,
  onOpenChange,
  prebookResponse,
  roomNames,
  currency,
  onAccept,
  onDecline,
  onContinueWithAvailable,
}: MultiroomPriceChangeModalProps) {
  const { rooms, failed = [], total_rooms, successful_rooms, failed_rooms } = prebookResponse.data;

  const roomsWithPriceChange = rooms.filter((r) => r.price_changed);
  const hasPriceChanges = roomsWithPriceChange.length > 0;
  const hasFailedRooms = failed_rooms > 0;
  const allRoomsFailed = failed_rooms === total_rooms;

  // Calculate total price difference
  const totalPriceDifference = roomsWithPriceChange.reduce((sum, room) => {
    const diff = (room.new_price || 0) - (room.original_price || 0);
    return sum + diff;
  }, 0);

  const isPriceIncrease = totalPriceDifference > 0;

  const getRoomName = (roomIndex: number): string => {
    return roomNames.get(roomIndex) || `Room ${roomIndex + 1}`;
  };

  // If all rooms failed, show a different message
  if (allRoomsFailed) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <XCircle className="h-5 w-5" />
              <AlertDialogTitle>Rooms Unavailable</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left space-y-3">
              <p>
                Unfortunately, all selected rooms are no longer available at the requested rates.
                This can happen when rooms are booked by other guests.
              </p>
              <div className="bg-destructive/10 rounded-lg p-3 space-y-2">
                {failed.map((room) => (
                  <div key={room.roomIndex} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{getRoomName(room.roomIndex)}</span>
                      <p className="text-muted-foreground text-xs">{room.error}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onDecline}>
              Select Different Rooms
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {hasFailedRooms ? (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            ) : isPriceIncrease ? (
              <TrendingUp className="h-5 w-5 text-amber-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-green-500" />
            )}
            <AlertDialogTitle>
              {hasFailedRooms
                ? "Some Rooms Unavailable"
                : isPriceIncrease
                ? "Price Increase"
                : "Price Decreased"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="text-left space-y-4">
              {/* Summary */}
              <p className="text-muted-foreground">
                {hasFailedRooms
                  ? `${successful_rooms} of ${total_rooms} rooms are available.`
                  : hasPriceChanges
                  ? `The price has ${isPriceIncrease ? "increased" : "decreased"} for ${roomsWithPriceChange.length} room(s).`
                  : "Room availability has been confirmed."}
              </p>

              {/* Failed Rooms */}
              {hasFailedRooms && (
                <div className="bg-destructive/10 rounded-lg p-3 space-y-2">
                  <div className="text-sm font-medium text-destructive flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Unavailable Rooms
                  </div>
                  {failed.map((room) => (
                    <div key={room.roomIndex} className="flex items-start gap-2 text-sm pl-5">
                      <div>
                        <span className="font-medium">{getRoomName(room.roomIndex)}</span>
                        <p className="text-muted-foreground text-xs">{room.error}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Changes */}
              {hasPriceChanges && (
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-1">
                    {isPriceIncrease ? (
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                    Price Changes
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {roomsWithPriceChange.map((room) => {
                      const diff = (room.new_price || 0) - (room.original_price || 0);
                      const isIncrease = diff > 0;
                      return (
                        <div key={room.roomIndex} className="flex items-center justify-between text-sm">
                          <span>{getRoomName(room.roomIndex)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground line-through">
                              {currency} {room.original_price?.toFixed(2)}
                            </span>
                            <span className={isIncrease ? "text-amber-600 font-medium" : "text-green-600 font-medium"}>
                              {currency} {room.new_price?.toFixed(2)}
                            </span>
                            <Badge variant={isIncrease ? "destructive" : "default"} className="text-xs">
                              {isIncrease ? "+" : ""}{diff.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Successfully Prebooked Rooms */}
              {rooms.filter((r) => !r.price_changed).length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmed at Original Price
                  </div>
                  <div className="text-sm text-muted-foreground pl-5">
                    {rooms
                      .filter((r) => !r.price_changed)
                      .map((r) => getRoomName(r.roomIndex))
                      .join(", ")}
                  </div>
                </div>
              )}

              <Separator />

              {/* Total Impact */}
              {hasPriceChanges && (
                <div className="flex items-center justify-between font-medium">
                  <span>Total Price Difference</span>
                  <span className={isPriceIncrease ? "text-amber-600" : "text-green-600"}>
                    {isPriceIncrease ? "+" : ""}{currency} {totalPriceDifference.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onDecline} className="sm:order-1">
            Cancel Booking
          </AlertDialogCancel>
          
          {hasFailedRooms && onContinueWithAvailable && successful_rooms > 0 && (
            <AlertDialogAction
              onClick={onContinueWithAvailable}
              className="bg-amber-600 hover:bg-amber-700 sm:order-2"
            >
              Continue with {successful_rooms} Room{successful_rooms > 1 ? "s" : ""}
            </AlertDialogAction>
          )}
          
          {!hasFailedRooms && (
            <AlertDialogAction onClick={onAccept} className="sm:order-3">
              {hasPriceChanges ? "Accept Updated Price" : "Continue"}
            </AlertDialogAction>
          )}
          
          {hasFailedRooms && !onContinueWithAvailable && successful_rooms > 0 && (
            <AlertDialogAction onClick={onAccept} className="sm:order-3">
              Continue with Available Rooms
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}