import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  UserCheck,
  UserX,
  Hotel,
  ArrowUpRight,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin";
import { RevenueChart, AlertsPanel, TopPerformers } from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";

type DateRange = "7d" | "30d" | "90d" | "12m";

const dateRangeLabels: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};

const stats = [
  {
    title: "Total Agents",
    value: "156",
    change: "+12",
    changeLabel: "this month",
    icon: Users,
    trend: "up",
  },
  {
    title: "Active Bookings",
    value: "2,847",
    change: "+18.2%",
    changeLabel: "vs last period",
    icon: Calendar,
    trend: "up",
  },
  {
    title: "Platform Revenue",
    value: "$1.2M",
    change: "+24.5%",
    changeLabel: "vs last period",
    icon: DollarSign,
    trend: "up",
  },
  {
    title: "Pending Approvals",
    value: "8",
    change: "3 new",
    changeLabel: "today",
    icon: Clock,
    trend: "neutral",
  },
];

const recentAgents = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@travelco.com",
    status: "pending",
    createdAt: "2 hours ago",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "m.chen@voyages.com",
    status: "approved",
    createdAt: "1 day ago",
  },
  {
    id: "3",
    name: "Emma Williams",
    email: "emma@luxurytravel.com",
    status: "pending",
    createdAt: "2 days ago",
  },
  {
    id: "4",
    name: "James Rodriguez",
    email: "j.rodriguez@gototravel.com",
    status: "approved",
    createdAt: "3 days ago",
  },
];

const topAgents = [
  { name: "Elite Travel Agency", bookings: 142, revenue: "$245,000" },
  { name: "Luxury Voyages Inc", bookings: 98, revenue: "$189,000" },
  { name: "Global Destinations", bookings: 87, revenue: "$156,000" },
  { name: "Premium Holidays", bookings: 72, revenue: "$134,000" },
  { name: "First Class Travel", bookings: 65, revenue: "$118,000" },
];

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <div className="flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div>
                <h1 className="text-lg font-semibold">{getGreeting()}, Admin</h1>
                <p className="text-sm text-muted-foreground">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={dateRange}
                  onValueChange={(value: DateRange) => setDateRange(value)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dateRangeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 space-y-6 p-6">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        <span
                          className={
                            stat.trend === "up"
                              ? "text-green-600"
                              : stat.trend === "down"
                              ? "text-red-600"
                              : "text-muted-foreground"
                          }
                        >
                          {stat.change}
                        </span>{" "}
                        {stat.changeLabel}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <RevenueChart />
                </div>
                <AlertsPanel />
              </div>

              {/* Quick Actions & Recent Agents */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <Button variant="outline" className="justify-start gap-2">
                      <UserCheck className="h-4 w-4" />
                      Approve Agents
                      <Badge variant="secondary" className="ml-auto">
                        8
                      </Badge>
                    </Button>
                    <Button variant="outline" className="justify-start gap-2">
                      <Hotel className="h-4 w-4" />
                      View All Bookings
                    </Button>
                    <Button variant="outline" className="justify-start gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Platform Reports
                    </Button>
                    <Button variant="outline" className="justify-start gap-2">
                      <Users className="h-4 w-4" />
                      Manage Agents
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Agent Registrations */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Recent Agent Registrations</CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentAgents.map((agent) => (
                        <div
                          key={agent.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                              {agent.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {agent.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                agent.status === "approved"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {agent.status}
                            </Badge>
                            {agent.status === "pending" && (
                              <Button size="sm" variant="outline">
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performing Agents */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Top Performing Agents</CardTitle>
                  <Select defaultValue="revenue">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">By Revenue</SelectItem>
                      <SelectItem value="bookings">By Bookings</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topAgents.map((agent, index) => (
                      <div
                        key={agent.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {index + 1}
                          </span>
                          <span className="font-medium">{agent.name}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-muted-foreground">
                            {agent.bookings} bookings
                          </span>
                          <span className="font-medium">{agent.revenue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
