import { CreditCard, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PaymentTypeCode = "now" | "deposit" | "hotel" | string;

interface PaymentTypeBadgeProps {
  paymentType: PaymentTypeCode;
  className?: string;
  showLabel?: boolean;
}

const paymentConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  now: {
    label: "Pay Now",
    icon: <CreditCard className="w-3 h-3" />,
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  now_net: {
    label: "Pay Now (NET)",
    icon: <CreditCard className="w-3 h-3" />,
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  now_gross: {
    label: "Client Card (GROSS)",
    icon: <CreditCard className="w-3 h-3" />,
    className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  },
  deposit: {
    label: "Deposit",
    icon: <CreditCard className="w-3 h-3" />,
    className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  hotel: {
    label: "Pay at Property",
    icon: <Building className="w-3 h-3" />,
    className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
  },
};

export const getPaymentTypeLabel = (type: string): string => {
  const lowerType = type?.toLowerCase() || "hotel";
  return paymentConfig[lowerType]?.label || paymentConfig.hotel.label;
};

export const normalizePaymentType = (type: string): PaymentTypeCode => {
  if (!type) return "deposit";
  const lowerType = type.toLowerCase();
  if (lowerType === "hotel" || lowerType === "pay at property") return "hotel";
  if (lowerType === "now_net") return "now_net";
  if (lowerType === "now_gross") return "now_gross";
  if (lowerType === "now" || lowerType.includes("pay now") || lowerType.includes("card")) return "now";
  if (lowerType === "deposit" || lowerType.includes("deposit")) return "deposit";
  return "deposit";
};

export function PaymentTypeBadge({ paymentType, className, showLabel = true }: PaymentTypeBadgeProps) {
  const normalizedType = normalizePaymentType(paymentType);
  const config = paymentConfig[normalizedType] || paymentConfig.hotel;

  return (
    <Badge 
      variant="outline" 
      className={cn("flex items-center gap-1", config.className, className)}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}
