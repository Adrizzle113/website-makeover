import { ChevronDown, Check, AlertCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TaxItem } from "@/types/booking";
import { useState } from "react";

interface TaxBreakdownProps {
  taxes: TaxItem[];
  currency?: string;
}

/**
 * Displays a collapsible breakdown of all taxes (included and non-included)
 * Per RateHawk Best Practices: Shows full tax transparency to users
 */
export function TaxBreakdown({ taxes, currency = "USD" }: TaxBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!taxes || taxes.length === 0) {
    return null;
  }

  // Separate taxes by inclusion status
  const includedTaxes = taxes.filter(tax => tax.included_by_supplier);
  const nonIncludedTaxes = taxes.filter(tax => !tax.included_by_supplier);

  // Calculate totals
  const includedTotal = includedTaxes.reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  const nonIncludedTotal = nonIncludedTaxes.reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);

  // Group by currency for non-included
  const nonIncludedByCurrency = nonIncludedTaxes.reduce((acc, tax) => {
    const curr = tax.currency_code || currency;
    if (!acc[curr]) acc[curr] = [];
    acc[curr].push(tax);
    return acc;
  }, {} as Record<string, TaxItem[]>);

  const formatAmount = (amount: string | number, curr: string = currency) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${curr} ${num.toFixed(2)}`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors">
        <span className="font-medium text-foreground">Taxes & Fees</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {taxes.length} item{taxes.length > 1 ? 's' : ''}
          </span>
          <ChevronDown 
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pt-2 space-y-3">
        {/* Included Taxes */}
        {includedTaxes.length > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                Included in Price
              </span>
            </div>
            <div className="space-y-1 pl-6">
              {includedTaxes.map((tax, idx) => (
                <div 
                  key={`included-${tax.name}-${idx}`} 
                  className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400"
                >
                  <span className="capitalize">{tax.name.replace(/_/g, " ")}</span>
                  <span>{formatAmount(tax.amount, tax.currency_code || currency)}</span>
                </div>
              ))}
              {includedTaxes.length > 1 && (
                <div className="flex justify-between text-sm font-medium text-emerald-800 dark:text-emerald-300 pt-1 mt-1 border-t border-emerald-200 dark:border-emerald-700">
                  <span>Total included</span>
                  <span>{formatAmount(includedTotal)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Non-Included Taxes (Payable at Property) */}
        {nonIncludedTaxes.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Payable at Property
              </span>
            </div>
            <div className="space-y-1 pl-6">
              {Object.entries(nonIncludedByCurrency).map(([curr, items]) => (
                <div key={curr}>
                  {items.map((tax, idx) => (
                    <div 
                      key={`non-included-${tax.name}-${idx}`} 
                      className="flex justify-between text-xs text-amber-700 dark:text-amber-400"
                    >
                      <span className="capitalize">{tax.name.replace(/_/g, " ")}</span>
                      <span>{formatAmount(tax.amount, curr)}</span>
                    </div>
                  ))}
                </div>
              ))}
              {nonIncludedTaxes.length > 1 && (
                <div className="flex justify-between text-sm font-medium text-amber-800 dark:text-amber-300 pt-1 mt-1 border-t border-amber-200 dark:border-amber-700">
                  <span>Total at property</span>
                  <span>{formatAmount(nonIncludedTotal)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 pl-6">
              These fees are not included in the booking price
            </p>
          </div>
        )}

        {/* Summary if both types exist */}
        {includedTaxes.length > 0 && nonIncludedTaxes.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total taxes & fees</span>
              <span>{formatAmount(includedTotal + nonIncludedTotal)}</span>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
