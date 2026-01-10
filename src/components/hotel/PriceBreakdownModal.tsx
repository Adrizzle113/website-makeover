import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useBookingStore } from "@/stores/bookingStore";
import { differenceInDays } from "date-fns";
import { TaxSummary } from "@/components/booking/TaxSummary";
import type { TaxItem } from "@/types/booking";

interface PriceBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: string;
}

export function PriceBreakdownModal({
  open,
  onOpenChange,
  currency = "USD",
}: PriceBreakdownModalProps) {
  const { selectedRooms, selectedUpsells, searchParams } = useBookingStore();

  // Calculate number of nights
  const nights = searchParams?.checkIn && searchParams?.checkOut
    ? Math.max(1, differenceInDays(new Date(searchParams.checkOut), new Date(searchParams.checkIn)))
    : 1;

  const formatCurrency = (amount: number) => {
    return currency === "USD" ? `$${amount.toLocaleString()}` : `${currency} ${amount.toLocaleString()}`;
  };

  // Calculate totals
  const roomSubtotal = selectedRooms.reduce((sum, room) => sum + room.totalPrice, 0);
  const upsellsTotal = selectedUpsells.reduce((sum, upsell) => sum + upsell.price, 0);
  
  // Aggregate taxes from all selected rooms
  const allTaxes: TaxItem[] = selectedRooms.flatMap(room => room.taxes || []);
  
  // Separate included vs non-included taxes
  const includedTaxes = allTaxes.filter(t => t.included_by_supplier);
  const nonIncludedTaxes = allTaxes.filter(t => !t.included_by_supplier);
  
  // Calculate tax totals
  const taxesIncluded = includedTaxes.reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  const taxesAtHotel = nonIncludedTaxes.reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  
  const grandTotal = roomSubtotal + upsellsTotal;
  const payNow = grandTotal;
  const payAtHotel = taxesAtHotel;

  // Group upsells by type
  const earlyCheckins = selectedUpsells.filter(u => u.type === "early_checkin");
  const lateCheckouts = selectedUpsells.filter(u => u.type === "late_checkout");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Price Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Room Rates */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Room Rates ({nights} night{nights > 1 ? "s" : ""})</h4>
            <div className="space-y-2">
              {selectedRooms.map((room) => {
                const perNightPrice = Math.round(room.pricePerRoom / nights);
                return (
                  <div key={room.roomId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {room.roomName} × {room.quantity} room{room.quantity > 1 ? "s" : ""}
                      </span>
                      <span className="font-medium">{formatCurrency(room.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground pl-2">
                      <span>{formatCurrency(perNightPrice)} per night × {nights} night{nights > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upsells */}
          {(earlyCheckins.length > 0 || lateCheckouts.length > 0) && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Add-ons</h4>
                <div className="space-y-2">
                  {earlyCheckins.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Early Check-in ({earlyCheckins[0].newTime}) × {earlyCheckins.length}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(earlyCheckins.reduce((sum, u) => sum + u.price, 0))}
                      </span>
                    </div>
                  )}
                  {lateCheckouts.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Late Checkout ({lateCheckouts[0].newTime}) × {lateCheckouts.length}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(lateCheckouts.reduce((sum, u) => sum + u.price, 0))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Subtotal */}
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(roomSubtotal + upsellsTotal)}</span>
          </div>

          {/* Taxes - Show real tax data if available */}
          {(taxesIncluded > 0 || includedTaxes.length > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes & fees (included)</span>
                <span className="font-medium">{formatCurrency(taxesIncluded)}</span>
              </div>
              {/* Itemized included taxes */}
              {includedTaxes.length > 0 && (
                <div className="pl-3 space-y-1">
                  {includedTaxes.map((tax, idx) => (
                    <div key={`incl-${tax.name}-${idx}`} className="flex justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{tax.name.replace(/_/g, " ")}</span>
                      <span>{tax.currency_code} {parseFloat(tax.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Non-included Taxes - Use TaxSummary component */}
          {nonIncludedTaxes.length > 0 && (
            <TaxSummary taxes={nonIncludedTaxes} currency={currency} />
          )}

          {/* Grand Total */}
          <Separator />
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Total to pay now</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(payNow)}</span>
            </div>
            {payAtHotel > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total at property</span>
                <span className="font-medium">{formatCurrency(payAtHotel)}</span>
              </div>
            )}
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground">
            * Early check-in and late checkout are subject to availability and will be 
            confirmed by the hotel. If unavailable, you will receive a full refund for 
            these add-ons.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
