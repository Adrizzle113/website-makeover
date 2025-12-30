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
import { AlertTriangle } from "lucide-react";

interface PriceChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalPrice: number;
  newPrice: number;
  currency: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function PriceChangeModal({
  open,
  onOpenChange,
  originalPrice,
  newPrice,
  currency,
  onAccept,
  onDecline,
}: PriceChangeModalProps) {
  const priceDifference = newPrice - originalPrice;
  const isIncrease = priceDifference > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              Price Has Changed
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                The price has changed from{" "}
                <span className="font-semibold text-foreground line-through">
                  {currency} {originalPrice.toFixed(2)}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {currency} {newPrice.toFixed(2)}
                </span>{" "}
                due to updated availability.
              </p>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Price difference
                  </span>
                  <span
                    className={`font-bold ${
                      isIncrease ? "text-destructive" : "text-green-600"
                    }`}
                  >
                    {isIncrease ? "+" : "-"}{currency} {Math.abs(priceDifference).toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Please review the updated price and confirm to continue with your booking.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onDecline} className="mt-0">
            Cancel Booking
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onAccept}
            className="bg-primary hover:bg-primary/90"
          >
            Accept Updated Price
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
