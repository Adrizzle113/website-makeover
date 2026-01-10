import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TaxItem } from "@/types/booking";

interface TaxSummaryProps {
  taxes: TaxItem[];
  currency?: string;
}

/**
 * Displays non-included taxes that must be paid at the property
 * Per RateHawk Best Practices Section 3.5:
 * "Non-included taxes must be displayed to the end-user separately"
 */
export function TaxSummary({ taxes, currency = "USD" }: TaxSummaryProps) {
  // Filter to only show taxes NOT included by supplier
  const nonIncludedTaxes = taxes.filter(tax => !tax.included_by_supplier);
  
  if (nonIncludedTaxes.length === 0) {
    return null;
  }

  // Group taxes by currency
  const taxesByCurrency = nonIncludedTaxes.reduce((acc, tax) => {
    const curr = tax.currency_code || currency;
    if (!acc[curr]) acc[curr] = [];
    acc[curr].push(tax);
    return acc;
  }, {} as Record<string, TaxItem[]>);

  // Calculate totals per currency
  const totals = Object.entries(taxesByCurrency).map(([curr, items]) => ({
    currency: curr,
    total: items.reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0),
    items,
  }));

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 dark:bg-amber-950/30 dark:border-amber-800">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Payable at Property
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-amber-600 dark:text-amber-400 cursor-help text-xs">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">
                    These taxes and fees are not included in the booking price and must be paid 
                    directly at the hotel during check-in or check-out.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="mt-2 space-y-1">
            {totals.map(({ currency: curr, items, total }) => (
              <div key={curr}>
                {items.map((tax, idx) => (
                  <div key={`${tax.name}-${idx}`} className="flex justify-between text-xs text-amber-700 dark:text-amber-400">
                    <span className="capitalize">{tax.name.replace(/_/g, " ")}</span>
                    <span>{curr} {parseFloat(tax.amount).toFixed(2)}</span>
                  </div>
                ))}
                {items.length > 1 && (
                  <div className="flex justify-between text-sm font-medium text-amber-800 dark:text-amber-300 pt-1 mt-1 border-t border-amber-200 dark:border-amber-700">
                    <span>Total at property</span>
                    <span>{curr} {total.toFixed(2)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
