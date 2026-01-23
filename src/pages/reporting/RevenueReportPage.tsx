import { useState } from "react";
import { TrendingUpIcon, TrendingDownIcon, DollarSignIcon, AlertTriangleIcon } from "lucide-react";
import { ReportingLayout, ReportingFilterToolbar, StatusBadge } from "@/components/reporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportingFilters } from "@/types/reporting";
import { useRevenueMetrics } from "@/hooks/useRevenueMetrics";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning";
  isLoading?: boolean;
}

function MetricCard({ title, value, subtitle, trend, icon, variant = "default", isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn(
              "text-2xl font-semibold font-mono",
              variant === "success" && "text-emerald-600",
              variant === "warning" && "text-amber-600"
            )}>
              {value}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            variant === "default" && "bg-muted",
            variant === "success" && "bg-emerald-500/10",
            variant === "warning" && "bg-amber-500/10"
          )}>
            {icon}
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1 text-sm">
            {trend >= 0 ? (
              <TrendingUpIcon className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDownIcon className="w-4 h-4 text-red-500" />
            )}
            <span className={trend >= 0 ? "text-emerald-600" : "text-red-600"}>
              {Math.abs(trend)}%
            </span>
            <span className="text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

export function RevenueReportPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});
  const { 
    metrics, 
    revenueByCity, 
    revenueByAgent, 
    topHotels, 
    highCancellationHotels, 
    isLoading 
  } = useRevenueMetrics(filters);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <ReportingLayout title="Revenue" description="Financial overview and revenue analytics">
      <ReportingFilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
        userRole="admin"
        showPaymentFilters={false}
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <MetricCard
          title="Gross Sales"
          value={formatCurrency(metrics.grossSales, metrics.currency)}
          subtitle="Total client revenue"
          icon={<DollarSignIcon className="w-5 h-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <MetricCard
          title="Supplier Cost"
          value={formatCurrency(metrics.supplierCost, metrics.currency)}
          subtitle="ETG total"
          icon={<DollarSignIcon className="w-5 h-5 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <MetricCard
          title="Margin"
          value={formatCurrency(metrics.margin, metrics.currency)}
          subtitle={`${metrics.marginPercent}% of gross`}
          icon={<TrendingUpIcon className="w-5 h-5 text-emerald-600" />}
          variant="success"
          isLoading={isLoading}
        />
        <MetricCard
          title="Cancellation Losses"
          value={formatCurrency(metrics.cancellationLosses, metrics.currency)}
          subtitle="Lost revenue"
          icon={<AlertTriangleIcon className="w-5 h-5 text-amber-600" />}
          variant="warning"
          isLoading={isLoading}
        />
      </div>

      {/* Revenue Breakdown Tables */}
      <Tabs defaultValue="city" className="mt-8">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="city">By City</TabsTrigger>
          <TabsTrigger value="agent">By Agent</TabsTrigger>
          <TabsTrigger value="hotels">Top Hotels</TabsTrigger>
          <TabsTrigger value="cancellations">High Cancellations</TabsTrigger>
        </TabsList>

        <TabsContent value="city" className="mt-4">
          {isLoading ? (
            <TableSkeleton />
          ) : revenueByCity.length === 0 ? (
            <EmptyState message="No city data available for the selected period" />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Revenue by City</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">City</TableHead>
                      <TableHead className="font-semibold">Country</TableHead>
                      <TableHead className="font-semibold text-right">Bookings</TableHead>
                      <TableHead className="font-semibold text-right">Revenue</TableHead>
                      <TableHead className="font-semibold text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByCity.map((row) => (
                      <TableRow key={`${row.city}-${row.country}`}>
                        <TableCell className="font-medium">{row.city}</TableCell>
                        <TableCell className="text-muted-foreground">{row.country}</TableCell>
                        <TableCell className="text-right">{row.bookingsCount}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.revenue, row.currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-600">
                          {formatCurrency(row.margin, row.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="agent" className="mt-4">
          {isLoading ? (
            <TableSkeleton />
          ) : revenueByAgent.length === 0 ? (
            <EmptyState message="No agent data available for the selected period" />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Revenue by Agent</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Agent</TableHead>
                      <TableHead className="font-semibold text-right">Bookings</TableHead>
                      <TableHead className="font-semibold text-right">Revenue</TableHead>
                      <TableHead className="font-semibold text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByAgent.map((row) => (
                      <TableRow key={row.agentId}>
                        <TableCell className="font-medium">{row.agentName}</TableCell>
                        <TableCell className="text-right">{row.bookingsCount}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.revenue, row.currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-600">
                          {formatCurrency(row.margin, row.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hotels" className="mt-4">
          {isLoading ? (
            <TableSkeleton />
          ) : topHotels.length === 0 ? (
            <EmptyState message="No hotel data available for the selected period" />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Top Hotels by Margin</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Hotel</TableHead>
                      <TableHead className="font-semibold">City</TableHead>
                      <TableHead className="font-semibold text-right">Bookings</TableHead>
                      <TableHead className="font-semibold text-right">Revenue</TableHead>
                      <TableHead className="font-semibold text-right">Margin</TableHead>
                      <TableHead className="font-semibold text-right">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topHotels.map((row) => (
                      <TableRow key={row.hotelName}>
                        <TableCell className="font-medium">{row.hotelName}</TableCell>
                        <TableCell className="text-muted-foreground">{row.city}</TableCell>
                        <TableCell className="text-right">{row.bookingsCount}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(row.revenue, row.currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-600">
                          {formatCurrency(row.margin, row.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <StatusBadge status="confirmed" label={`${row.marginPercent}%`} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cancellations" className="mt-4">
          {isLoading ? (
            <TableSkeleton />
          ) : highCancellationHotels.length === 0 ? (
            <EmptyState message="No cancellation data available for the selected period" />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">High Cancellation Properties</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Hotel</TableHead>
                      <TableHead className="font-semibold">City</TableHead>
                      <TableHead className="font-semibold text-right">Bookings</TableHead>
                      <TableHead className="font-semibold text-right">Cancellations</TableHead>
                      <TableHead className="font-semibold text-right">Rate</TableHead>
                      <TableHead className="font-semibold text-right">Lost Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {highCancellationHotels.map((row) => (
                      <TableRow key={row.hotelName}>
                        <TableCell className="font-medium">{row.hotelName}</TableCell>
                        <TableCell className="text-muted-foreground">{row.city}</TableCell>
                        <TableCell className="text-right">{row.bookingsCount}</TableCell>
                        <TableCell className="text-right">{row.cancellations}</TableCell>
                        <TableCell className="text-right">
                          <StatusBadge 
                            status={row.cancellationRate > 40 ? "high" : "medium"} 
                            label={`${row.cancellationRate.toFixed(1)}%`} 
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          {formatCurrency(row.lostRevenue, row.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </ReportingLayout>
  );
}
