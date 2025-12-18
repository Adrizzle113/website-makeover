import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PaymentOption {
  id: string;
  title: string;
  description: string;
  currencies: string[];
  disabled?: boolean;
}

const paymentOptions: PaymentOption[] = [
  {
    id: "deposit",
    title: "Book now, pay later",
    description:
      "After booking, you can create an invoice and pay via bank transfer, bank card, or payment link directly in your account.",
    currencies: ["USD", "EUR", "GBP", "AED"],
  },
  {
    id: "now",
    title: "Pay now by bank card (NET)",
    description:
      "The cost of the booking will be charged to the bank card you provided during the reservation.",
    currencies: ["USD", "EUR", "GBP"],
  },
  {
    id: "gross",
    title: "Pay now by client's card (GROSS)",
    description:
      "Used for payment by the client's bank card. The amount will be withdrawn from the specified card, then you'll get the commission.",
    currencies: ["USD", "EUR", "GBP", "AED"],
  },
  {
    id: "facility",
    title: "Pay to the accommodation facility",
    description:
      "This payment method is only available for rates with the corresponding payment conditions.",
    currencies: [],
    disabled: true,
  },
];

export function PaymentMethodSection() {
  const [selectedPayment, setSelectedPayment] = useState("deposit");

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 lg:p-8">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
          Payment Method
        </h2>

        <div className="space-y-4">
          {paymentOptions.map((option) => {
            const isSelected = selectedPayment === option.id;
            const displayCurrencies = option.currencies.slice(0, 3);
            const remainingCount = option.currencies.length - 3;

            return (
              <div
                key={option.id}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  option.disabled
                    ? "border-border bg-muted/50 opacity-60 cursor-not-allowed"
                    : isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => !option.disabled && setSelectedPayment(option.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center flex-shrink-0",
                      option.disabled
                        ? "border-muted-foreground"
                        : isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}
                  >
                    {isSelected && !option.disabled && (
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={cn(
                        "font-medium mb-1",
                        option.disabled ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {option.title}
                    </h3>
                    {displayCurrencies.length > 0 && (
                      <div className="flex gap-2 mb-2 flex-wrap items-center">
                        {displayCurrencies.map((currency) => (
                          <Badge
                            key={currency}
                            variant="secondary"
                            className="text-xs"
                          >
                            {currency}
                          </Badge>
                        ))}
                        {remainingCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{remainingCount} more
                          </Badge>
                        )}
                      </div>
                    )}
                    <p
                      className={cn(
                        "text-sm",
                        option.disabled ? "text-muted-foreground" : "text-muted-foreground"
                      )}
                    >
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
