import { useState } from "react";
import { format } from "date-fns";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, CreditCardIcon, BuildingIcon, LinkIcon } from "lucide-react";
import { ReportingLayout, ReportingFilterToolbar, StatusBadge } from "@/components/reporting";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportingFilters, PaymentLedgerEntry } from "@/types/reporting";
import { cn } from "@/lib/utils";

// Mock data
const mockPayments: PaymentLedgerEntry[] = [
  {
    id: "PAY-001",
    date: "2025-01-18T14:30:00Z",
    type: "payment",
    amount: 8500,
    currency: "USD",
    method: "card",
    reference: "INV-2025-001",
    referenceType: "invoice",
    status: "completed",
    description: "Payment for invoice INV-2025-001",
  },
  {
    id: "PAY-002",
    date: "2025-01-17T10:15:00Z",
    type: "payment",
    amount: 4200,
    currency: "EUR",
    method: "bank_transfer",
    reference: "INV-2025-002",
    referenceType: "invoice",
    status: "completed",
    description: "Bank transfer received",
  },
  {
    id: "PAY-003",
    date: "2025-01-16T09:00:00Z",
    type: "refund",
    amount: -1850,
    currency: "USD",
    method: "card",
    reference: "BK-2025-003",
    referenceType: "booking",
    status: "completed",
    description: "Refund for cancelled booking BK-2025-003",
  },
  {
    id: "PAY-004",
    date: "2025-01-15T16:45:00Z",
    type: "payment",
    amount: 3100,
    currency: "USD",
    method: "payment_link",
    reference: "INV-2025-003",
    referenceType: "invoice",
    status: "pending",
    description: "Payment link clicked - awaiting confirmation",
  },
  {
    id: "PAY-005",
    date: "2025-01-14T11:20:00Z",
    type: "adjustment",
    amount: -150,
    currency: "USD",
    method: "bank_transfer",
    reference: "INV-2025-001",
    referenceType: "invoice",
    status: "completed",
    description: "Loyalty discount applied",
  },
  {
    id: "PAY-006",
    date: "2025-01-13T08:30:00Z",
    type: "payment",
    amount: 12800,
    currency: "USD",
    method: "card",
    reference: "INV-2025-005",
    referenceType: "invoice",
    status: "failed",
    description: "Payment failed - insufficient funds",
  },
  {
    id: "PAY-007",
    date: "2025-01-12T15:00:00Z",
    type: "payment",
    amount: 6400,
    currency: "USD",
    method: "bank_transfer",
    reference: "INV-2025-005",
    referenceType: "invoice",
    status: "completed",
    description: "Partial payment for INV-2025-005",
  },
];

// Calculate running totals
const calculateTotals = () => {
  let totalPayments = 0;
  let totalRefunds = 0;
  let totalAdjustments = 0;
  
  mockPayments.filter(p => p.status === "completed").forEach(p => {
    if (p.type === "payment") totalPayments += p.amount;
    else if (p.type === "refund") totalRefunds += Math.abs(p.amount);
    else if (p.type === "adjustment") totalAdjustments += p.amount;
  });
  
  return { totalPayments, totalRefunds, totalAdjustments, netTotal: totalPayments - totalRefunds + totalAdjustments };
};

const totals = calculateTotals();

const methodIcons = {
  card: CreditCardIcon,
  bank_transfer: BuildingIcon,
  payment_link: LinkIcon,
};

export function PaymentsReportPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});

  const typeConfig = {
    payment: { icon: ArrowDownIcon, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    refund: { icon: ArrowUpIcon, color: "text-red-600", bg: "bg-red-500/10" },
    adjustment: { icon: MinusIcon, color: "text-blue-600", bg: "bg-blue-500/10" },
  };

  return (
    <ReportingLayout title="Payments" description="Payment ledger and transaction history">
      <ReportingFilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
        userRole="admin"
        showPaymentFilters={false}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Payments</p>
            <p className="text-2xl font-semibold font-mono text-emerald-600">
              USD {totals.totalPayments.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Refunds</p>
            <p className="text-2xl font-semibold font-mono text-red-600">
              USD {totals.totalRefunds.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Adjustments</p>
            <p className="text-2xl font-semibold font-mono text-blue-600">
              USD {totals.totalAdjustments.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Net Total</p>
            <p className="text-2xl font-semibold font-mono">
              USD {totals.netTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <div className="mt-6 border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold">Method</TableHead>
              <TableHead className="font-semibold">Reference</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPayments.map((payment) => {
              const config = typeConfig[payment.type];
              const TypeIcon = config.icon;
              const MethodIcon = methodIcons[payment.method];
              
              return (
                <TableRow key={payment.id}>
                  <TableCell className="text-sm">
                    {format(new Date(payment.date), "MMM d, yyyy")}
                    <span className="text-muted-foreground ml-1">
                      {format(new Date(payment.date), "HH:mm")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1 rounded", config.bg)}>
                        <TypeIcon className={cn("w-3.5 h-3.5", config.color)} />
                      </div>
                      <span className="capitalize text-sm">{payment.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-mono font-medium",
                      payment.type === "payment" && "text-emerald-600",
                      payment.type === "refund" && "text-red-600",
                      payment.type === "adjustment" && "text-blue-600"
                    )}>
                      {payment.amount > 0 ? "+" : ""}{payment.currency} {payment.amount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MethodIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{payment.method.replace("_", " ")}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{payment.reference}</span>
                    <span className="text-xs text-muted-foreground ml-1">({payment.referenceType})</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                    {payment.description}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </ReportingLayout>
  );
}
