import { useState } from "react";
import { TrendingUpIcon, TrendingDownIcon, DollarSignIcon, PercentIcon, AlertTriangleIcon } from "lucide-react";
import { ReportingLayout, ReportingFilterToolbar, StatusBadge } from "@/components/reporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportingFilters, RevenueMetrics, RevenueByCity, RevenueByAgent, TopHotel } from "@/types/reporting";
import { cn } from "@/lib/utils";

// Mock data
const mockMetrics: RevenueMetrics = {
  grossSales: 125840,
  supplierCost: 100672,
  margin: 25168,
  marginPercent: 20,
  cancellationLosses: 3200,
  currency: "USD",
};

const mockRevenueByCity: RevenueByCity[] = [
  { city: "Tokyo", country: "Japan", bookingsCount: 45, revenue: 32500, margin: 6500, currency: "USD" },
  { city: "Paris", country: "France", bookingsCount: 38, revenue: 28200, margin: 5640, currency: "USD" },
  { city: "New York", country: "USA", bookingsCount: 52, revenue: 41000, margin: 8200, currency: "USD" },
  { city: "Dubai", country: "UAE", bookingsCount: 25, revenue: 18500, margin: 3700, currency: "USD" },
  { city: "Singapore", country: "Singapore", bookingsCount: 18, revenue: 12400, margin: 2480, currency: "USD" },
];

const mockRevenueByAgent: RevenueByAgent[] = [
  { agentId: "a1", agentName: "Sarah Johnson", bookingsCount: 68, revenue: 52000, margin: 10400, currency: "USD" },
  { agentId: "a2", agentName: "Michael Chen", bookingsCount: 54, revenue: 43200, margin: 8640, currency: "USD" },
  { agentId: "a3", agentName: "John Smith", bookingsCount: 42, revenue: 30640, margin: 6128, currency: "USD" },
];

const mockTopHotels: TopHotel[] = [
  { hotelName: "Grand Hyatt Tokyo", city: "Tokyo", bookingsCount: 28, revenue: 18500, margin: 4625, marginPercent: 25, currency: "USD" },
  { hotelName: "The Ritz Paris", city: "Paris", bookingsCount: 22, revenue: 24200, margin: 4840, marginPercent: 20, currency: "USD" },
  { hotelName: "Four Seasons NYC", city: "New York", bookingsCount: 35, revenue: 28000, margin: 5600, marginPercent: 20, currency: "USD" },
  { hotelName: "Burj Al Arab", city: "Dubai", bookingsCount: 12, revenue: 42000, margin: 8400, marginPercent: 20, currency: "USD" },
  { hotelName: "Marina Bay Sands", city: "Singapore", bookingsCount: 18, revenue: 15300, margin: 3060, marginPercent: 20, currency: "USD" },
];

const mockHighCancellationHotels = [
  { hotelName: "Budget Inn Downtown", city: "New York", bookingsCount: 15, cancellations: 8, cancellationRate: 53.3, lostRevenue: 4800, currency: "USD" },
  { hotelName: "City Center Hostel", city: "London", bookingsCount: 22, cancellations: 9, cancellationRate: 40.9, lostRevenue: 2700, currency: "USD" },
  { hotelName: "Quick Stay Express", city: "Tokyo", bookingsCount: 18, cancellations: 6, cancellationRate: 33.3, lostRevenue: 1800, currency: "USD" },
];

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning";
}

function MetricCard({ title, value, subtitle, trend, icon, variant = "default" }: MetricCardProps) {
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

export function RevenueReportPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});

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
          value={`${mockMetrics.currency} ${mockMetrics.grossSales.toLocaleString()}`}
          subtitle="Total client revenue"
          trend={12.5}
          icon={<DollarSignIcon className="w-5 h-5 text-muted-foreground" />}
        />
        <MetricCard
          title="Supplier Cost"
          value={`${mockMetrics.currency} ${mockMetrics.supplierCost.toLocaleString()}`}
          subtitle="ETG total"
          icon={<DollarSignIcon className="w-5 h-5 text-muted-foreground" />}
        />
        <MetricCard
          title="Margin"
          value={`${mockMetrics.currency} ${mockMetrics.margin.toLocaleString()}`}
          subtitle={`${mockMetrics.marginPercent}% of gross`}
          trend={8.2}
          icon={<TrendingUpIcon className="w-5 h-5 text-emerald-600" />}
          variant="success"
        />
        <MetricCard
          title="Cancellation Losses"
          value={`${mockMetrics.currency} ${mockMetrics.cancellationLosses.toLocaleString()}`}
          subtitle="Lost revenue"
          trend={-15.3}
          icon={<AlertTriangleIcon className="w-5 h-5 text-amber-600" />}
          variant="warning"
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
                  {mockRevenueByCity.map((row) => (
                    <TableRow key={row.city}>
                      <TableCell className="font-medium">{row.city}</TableCell>
                      <TableCell className="text-muted-foreground">{row.country}</TableCell>
                      <TableCell className="text-right">{row.bookingsCount}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.currency} {row.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">
                        {row.currency} {row.margin.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent" className="mt-4">
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
                  {mockRevenueByAgent.map((row) => (
                    <TableRow key={row.agentId}>
                      <TableCell className="font-medium">{row.agentName}</TableCell>
                      <TableCell className="text-right">{row.bookingsCount}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.currency} {row.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">
                        {row.currency} {row.margin.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels" className="mt-4">
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
                  {mockTopHotels.map((row) => (
                    <TableRow key={row.hotelName}>
                      <TableCell className="font-medium">{row.hotelName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.city}</TableCell>
                      <TableCell className="text-right">{row.bookingsCount}</TableCell>
                      <TableCell className="text-right font-mono">
                        {row.currency} {row.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">
                        {row.currency} {row.margin.toLocaleString()}
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
        </TabsContent>

        <TabsContent value="cancellations" className="mt-4">
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
                  {mockHighCancellationHotels.map((row) => (
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
                        {row.currency} {row.lostRevenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ReportingLayout>
  );
}
