import { Shield, Lock, Check, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentTrustBadgesProps {
  className?: string;
  variant?: "horizontal" | "vertical";
}

const trustItems = [
  {
    icon: Shield,
    label: "Secure Payment",
    description: "256-bit SSL encryption",
  },
  {
    icon: Lock,
    label: "Data Protected",
    description: "Your info is safe",
  },
  {
    icon: BadgeCheck,
    label: "PCI Compliant",
    description: "Industry standard",
  },
  {
    icon: Check,
    label: "Verified Booking",
    description: "Guaranteed confirmation",
  },
];

export function PaymentTrustBadges({ className, variant = "horizontal" }: PaymentTrustBadgesProps) {
  if (variant === "vertical") {
    return (
      <div className={cn("space-y-4", className)}>
        <p className="heading-spaced text-muted-foreground mb-4">Your Security</p>
        <div className="grid grid-cols-2 gap-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-muted/30 transition-all duration-300 hover:bg-muted/50 hover:shadow-soft"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-body-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-6", className)}>
      {trustItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-2 text-muted-foreground group transition-all duration-300"
          >
            <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-body-sm font-medium">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
