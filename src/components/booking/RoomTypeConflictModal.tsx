import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface RoomTypeConflictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoomName: string;
  newRoomName: string;
  onReplaceSelection: () => void;
  onCancel: () => void;
}

/**
 * Modal shown when a user tries to add a different room type in a multiroom booking.
 * ETG API constraint: "ETG supports up to 9 rooms at one rate, but does not support 
 * different room types at one rate."
 */
export function RoomTypeConflictModal({
  open,
  onOpenChange,
  currentRoomName,
  newRoomName,
  onReplaceSelection,
  onCancel,
}: RoomTypeConflictModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center text-xl">
            Different Room Type Selected
          </DialogTitle>
          <DialogDescription className="text-center">
            Multi-room bookings require the same room type for all rooms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current selection */}
          <div className="rounded-lg border border-muted bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">Currently selected:</p>
            <p className="text-sm font-medium">{currentRoomName}</p>
          </div>

          {/* New selection attempt */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground mb-1">You're trying to add:</p>
            <p className="text-sm font-medium text-primary">{newRoomName}</p>
          </div>

          {/* Explanation */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Why this limitation?</strong> Hotel booking systems require 
              all rooms in a single reservation to be the same type. To book different 
              room types, you'll need to make separate bookings.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onReplaceSelection}
            className="w-full gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Replace with {newRoomName}
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full gap-2"
          >
            <X className="h-4 w-4" />
            Keep Current Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
