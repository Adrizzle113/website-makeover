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
import { AlertCircle, TrendingUp, TrendingDown, XCircle } from "lucide-react";

interface PriceConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "increase" | "decrease" | "unavailable";
  originalPrice: number;
  newPrice: number;
  currency: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function PriceConfirmationModal({
  open,
  onOpenChange,
  type,
  originalPrice,
  newPrice,
  currency,
  onAccept,
  onDecline,
}: PriceConfirmationModalProps) {
  const priceDiff = Math.abs(newPrice - originalPrice);
  const percentChange = ((priceDiff / originalPrice) * 100).toFixed(1);

  if (type === "unavailable") {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">
                Room No Longer Available
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              We're sorry, but the room you selected is no longer available at this price.
              This can happen when room inventory changes quickly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogAction
              onClick={onDecline}
              className="bg-primary hover:bg-primary/90"
            >
              Return to Hotel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (type === "increase") {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-amber-100">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-xl">
                Price Has Changed
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-base text-muted-foreground">
                  The price for this room has increased since you started your booking.
                </p>
                
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original price:</span>
                    <span className="line-through text-muted-foreground">
                      {currency} {originalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>New price:</span>
                    <span className="text-foreground">
                      {currency} {newPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Increase:</span>
                    <span>
                      +{currency} {priceDiff.toFixed(2)} (+{percentChange}%)
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Would you like to proceed with the new price?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={onDecline}>
              Cancel Booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onAccept}
              className="bg-primary hover:bg-primary/90"
            >
              Accept New Price
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Price decrease - auto-accept with notification
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              Good News! Price Dropped
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-base text-muted-foreground">
                The price for this room has decreased since you started your booking.
              </p>
              
              <div className="bg-green-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original price:</span>
                  <span className="line-through text-muted-foreground">
                    {currency} {originalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>New price:</span>
                  <span className="text-green-600">
                    {currency} {newPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>You save:</span>
                  <span>
                    {currency} {priceDiff.toFixed(2)} ({percentChange}%)
                  </span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onAccept}
            className="bg-green-600 hover:bg-green-700"
          >
            Continue with New Price
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
