import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangleIcon,
  CalendarIcon,
  DollarSignIcon,
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { bookingApi } from "@/services/bookingApi";
import { toast } from "sonner";
import type { CancellationPenalty } from "@/types/etgBooking";

interface CancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  cancellationPolicy?: string;
  cancellationDeadline?: string;
  penalties?: CancellationPenalty[];
  onCancellationComplete?: (result: {
    success: boolean;
    refundAmount?: number;
    message?: string;
  }) => void;
}

type CancellationState = "confirm" | "processing" | "success" | "error";

export function CancellationModal({
  open,
  onOpenChange,
  orderId,
  hotelName,
  checkIn,
  checkOut,
  totalAmount,
  currency,
  cancellationPolicy,
  cancellationDeadline,
  penalties = [],
  onCancellationComplete,
}: CancellationModalProps) {
  const [state, setState] = useState<CancellationState>("confirm");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<{
    refundAmount?: number;
    cancellationFee?: number;
    message?: string;
  } | null>(null);

  const isFreeCancellation = () => {
    if (!cancellationDeadline) return false;
    const deadline = new Date(cancellationDeadline);
    return new Date() < deadline;
  };

  const getCurrentPenalty = (): CancellationPenalty | null => {
    if (!penalties.length) return null;
    const now = new Date();
    return penalties.find((p) => {
      const from = new Date(p.from_date);
      const to = p.to_date ? new Date(p.to_date) : new Date("2099-12-31");
      return now >= from && now <= to;
    }) || null;
  };

  const getEstimatedRefund = () => {
    if (isFreeCancellation()) {
      return { refund: totalAmount, fee: 0 };
    }
    const penalty = getCurrentPenalty();
    if (penalty) {
      const fee = penalty.percent 
        ? (totalAmount * penalty.percent) / 100 
        : penalty.amount;
      return { refund: Math.max(0, totalAmount - fee), fee };
    }
    // Default: no refund if past deadline and no penalty info
    return { refund: 0, fee: totalAmount };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCancel = async () => {
    setState("processing");

    try {
      const response = await bookingApi.cancelBooking(orderId, reason || undefined);

      if (response.status === "ok" && response.data.status !== "cancellation_failed") {
        setState("success");
        setResult({
          refundAmount: response.data.refund_amount,
          cancellationFee: response.data.cancellation_fee,
          message: response.data.message,
        });
        toast.success("Booking cancelled successfully");
        onCancellationComplete?.({
          success: true,
          refundAmount: response.data.refund_amount,
          message: response.data.message,
        });
      } else {
        setState("error");
        setResult({
          message: response.error?.message || response.data.message || "Cancellation failed",
        });
        toast.error(response.error?.message || "Failed to cancel booking");
        onCancellationComplete?.({
          success: false,
          message: response.error?.message,
        });
      }
    } catch (error) {
      setState("error");
      const message = error instanceof Error ? error.message : "Failed to cancel booking";
      setResult({ message });
      toast.error(message);
      onCancellationComplete?.({
        success: false,
        message,
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setState("confirm");
      setReason("");
      setResult(null);
    }, 200);
  };

  const { refund, fee } = getEstimatedRefund();
  const freeCancellation = isFreeCancellation();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {state === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangleIcon className="w-5 h-5 text-destructive" />
                Cancel Booking
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this reservation?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Booking Summary */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium text-foreground">{hotelName}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(checkIn)} — {formatDate(checkOut)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSignIcon className="w-4 h-4" />
                  <span>Total: {currency} {totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Cancellation Status */}
              <div className={`p-3 rounded-lg border ${
                freeCancellation 
                  ? "bg-emerald-500/10 border-emerald-500/20" 
                  : "bg-amber-500/10 border-amber-500/20"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={
                    freeCancellation 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }>
                    {freeCancellation ? "Free Cancellation" : "Penalty Applies"}
                  </Badge>
                </div>
                {cancellationDeadline && freeCancellation && (
                  <p className="text-xs text-muted-foreground">
                    Free until {formatDate(cancellationDeadline)}
                  </p>
                )}
              </div>

              {/* Refund Estimate */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Estimated Refund</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Booking Total</span>
                    <span>{currency} {totalAmount.toLocaleString()}</span>
                  </div>
                  {fee > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Cancellation Fee</span>
                      <span>-{currency} {fee.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-medium">
                    <span>Refund Amount</span>
                    <span className="text-emerald-600">{currency} {refund.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              {cancellationPolicy && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Cancellation Policy</p>
                  <p className="text-xs text-muted-foreground">{cancellationPolicy}</p>
                </div>
              )}

              {/* Reason (optional) */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Why are you cancelling this booking?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Keep Booking
              </Button>
              <Button variant="destructive" onClick={handleCancel}>
                Cancel Booking
              </Button>
            </DialogFooter>
          </>
        )}

        {state === "processing" && (
          <div className="py-12 text-center space-y-4">
            <Loader2Icon className="w-12 h-12 animate-spin text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium text-foreground">Processing Cancellation</p>
              <p className="text-sm text-muted-foreground">Please wait...</p>
            </div>
          </div>
        )}

        {state === "success" && (
          <>
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-foreground text-lg">Booking Cancelled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your booking has been successfully cancelled.
                </p>
              </div>
              {result?.refundAmount !== undefined && result.refundAmount > 0 && (
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-sm text-muted-foreground">Refund Amount</p>
                  <p className="font-heading text-xl text-emerald-600">
                    {currency} {result.refundAmount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        )}

        {state === "error" && (
          <>
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircleIcon className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-foreground text-lg">Cancellation Failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {result?.message || "Unable to cancel booking. Please try again."}
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => setState("confirm")}>
                Try Again
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}