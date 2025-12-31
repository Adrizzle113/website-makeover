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
      <div className={cn("space-y-3", className)}>
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Icon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          );
        })}
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
            className="flex items-center gap-2 text-muted-foreground group transition-all duration-200"
          >
            <div className="p-1.5 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
              <Icon className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
