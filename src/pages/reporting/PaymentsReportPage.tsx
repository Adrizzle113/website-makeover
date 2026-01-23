import { useState } from "react";
import { format } from "date-fns";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, CreditCardIcon, BuildingIcon, LinkIcon } from "lucide-react";
import { ReportingLayout, ReportingFilterToolbar, StatusBadge } from "@/components/reporting";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportingFilters } from "@/types/reporting";
import { usePayments } from "@/hooks/usePayments";
import { cn } from "@/lib/utils";

const methodIcons = {
  card: CreditCardIcon,
  bank_transfer: BuildingIcon,
  payment_link: LinkIcon,
};

function SummaryCardSkeleton() {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-7 w-32" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="mt-6 border rounded-lg bg-card overflow-hidden">
      <div className="p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 border rounded-lg bg-card overflow-hidden">
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No payment transactions found for the selected filters</p>
      </div>
    </div>
  );
}

export function PaymentsReportPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});
  const { payments, totals, isLoading } = usePayments(filters);

  const typeConfig = {
    payment: { icon: ArrowDownIcon, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    refund: { icon: ArrowUpIcon, color: "text-red-600", bg: "bg-red-500/10" },
    adjustment: { icon: MinusIcon, color: "text-blue-600", bg: "bg-blue-500/10" },
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
        {isLoading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-semibold font-mono text-emerald-600">
                  {formatCurrency(totals.totalPayments, totals.currency)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Refunds</p>
                <p className="text-2xl font-semibold font-mono text-red-600">
                  {formatCurrency(totals.totalRefunds, totals.currency)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Adjustments</p>
                <p className="text-2xl font-semibold font-mono text-blue-600">
                  {formatCurrency(totals.totalAdjustments, totals.currency)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Net Total</p>
                <p className="text-2xl font-semibold font-mono">
                  {formatCurrency(totals.netTotal, totals.currency)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Ledger Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : payments.length === 0 ? (
        <EmptyState />
      ) : (
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
              {payments.map((payment) => {
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
                        {payment.amount > 0 ? "+" : "-"}{formatCurrency(payment.amount, payment.currency)}
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
      )}
    </ReportingLayout>
  );
}
