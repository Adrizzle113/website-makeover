import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const monthlyData = [
  { name: "Jan", revenue: 24500, bookings: 145, commission: 4900 },
  { name: "Feb", revenue: 28000, bookings: 168, commission: 5600 },
  { name: "Mar", revenue: 32500, bookings: 195, commission: 6500 },
  { name: "Apr", revenue: 29800, bookings: 178, commission: 5960 },
  { name: "May", revenue: 35200, bookings: 211, commission: 7040 },
  { name: "Jun", revenue: 41000, bookings: 246, commission: 8200 },
  { name: "Jul", revenue: 45600, bookings: 274, commission: 9120 },
  { name: "Aug", revenue: 48900, bookings: 293, commission: 9780 },
  { name: "Sep", revenue: 42300, bookings: 254, commission: 8460 },
  { name: "Oct", revenue: 38700, bookings: 232, commission: 7740 },
  { name: "Nov", revenue: 44200, bookings: 265, commission: 8840 },
  { name: "Dec", revenue: 52000, bookings: 312, commission: 10400 },
];

const weeklyData = [
  { name: "Mon", revenue: 8200, bookings: 42, commission: 1640 },
  { name: "Tue", revenue: 9500, bookings: 48, commission: 1900 },
  { name: "Wed", revenue: 7800, bookings: 39, commission: 1560 },
  { name: "Thu", revenue: 10200, bookings: 51, commission: 2040 },
  { name: "Fri", revenue: 12500, bookings: 63, commission: 2500 },
  { name: "Sat", revenue: 14800, bookings: 74, commission: 2960 },
  { name: "Sun", revenue: 11200, bookings: 56, commission: 2240 },
];

type ChartView = "revenue" | "bookings";
type TimeRange = "weekly" | "monthly";

export function RevenueChart() {
  const [chartView, setChartView] = useState<ChartView>("revenue");
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");

  const data = timeRange === "monthly" ? monthlyData : weeklyData;
  const dataKey = chartView === "revenue" ? "revenue" : "bookings";
  const formatter = chartView === "revenue" 
    ? (value: number) => `$${value.toLocaleString()}`
    : (value: number) => value.toString();

  return (
    <Card className="border-none shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="font-heading text-lg text-foreground">
            Performance Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={chartView} onValueChange={(v) => setChartView(v as ChartView)}>
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="bookings">Bookings</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[110px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="monthly">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "revenue" ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  formatter={(value: number) => [value.toString(), 'Bookings']}
                />
                <Bar 
                  dataKey="bookings" 
                  fill="hsl(var(--accent))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-heading text-foreground">
              ${timeRange === "monthly" ? "462K" : "74.2K"}
            </p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading text-foreground">
              {timeRange === "monthly" ? "2,773" : "373"}
            </p>
            <p className="text-xs text-muted-foreground">Total Bookings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-heading text-emerald-600">
              ${timeRange === "monthly" ? "92.5K" : "14.8K"}
            </p>
            <p className="text-xs text-muted-foreground">Commission Earned</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
