import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2Icon,
  CreditCardIcon,
  TrendingUpIcon,
  UsersIcon,
  SearchIcon,
  CalendarIcon,
  MapPinIcon,
  BedDoubleIcon,
  FileTextIcon,
  TrendingDownIcon,
  Download,
  ChevronDown,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  AppSidebar, 
  RevenueChart, 
  AlertsPanel, 
  BookingsPipeline,
  TopPerformers,
} from "@/components/dashboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

type DateRange = "today" | "7days" | "30days" | "90days" | "year";

const dateRangeLabels: Record<DateRange, string> = {
  today: "Today",
  "7days": "Last 7 Days",
  "30days": "Last 30 Days",
  "90days": "Last 90 Days",
  year: "This Year",
};

const stats = [
  {
    label: "Total Bookings",
    value: "1,888",
    change: "+12.5%",
    trend: "up",
    icon: Building2Icon,
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Revenue",
    value: "$462,500",
    change: "+18.2%",
    trend: "up",
    icon: CreditCardIcon,
    color: "bg-accent/20 text-accent",
  },
  {
    label: "Active Clients",
    value: "892",
    change: "+5.1%",
    trend: "up",
    icon: UsersIcon,
    color: "bg-[hsl(43,74%,66%)]/20 text-[hsl(43,74%,66%)]",
  },
  {
    label: "Commission",
    value: "$92,500",
    change: "+22.3%",
    trend: "up",
    icon: TrendingUpIcon,
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30",
  },
];

const recentBookings = [
  {
    id: "BK-2849",
    destination: "Paris, France",
    hotel: "The Ritz Paris",
    guest: "Sarah Mitchell",
    dates: "Jan 15-20",
    status: "confirmed",
    amount: "$4,245",
  },
  {
    id: "BK-2848",
    destination: "Tokyo, Japan",
    hotel: "Grand Hyatt Tokyo",
    guest: "John Anderson",
    dates: "Jan 18-25",
    status: "pending",
    amount: "$3,890",
  },
  {
    id: "BK-2847",
    destination: "Bali, Indonesia",
    hotel: "Four Seasons Resort",
    guest: "Emma Wilson",
    dates: "Feb 5-12",
    status: "confirmed",
    amount: "$5,670",
  },
  {
    id: "BK-2846",
    destination: "Dubai, UAE",
    hotel: "Burj Al Arab",
    guest: "Michael Chen",
    dates: "Feb 10-15",
    status: "confirmed",
    amount: "$8,200",
  },
];

export const Dashboard = (): JSX.Element => {
  const [userEmail, setUserEmail] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange>("30days");
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    setUserEmail(email);

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleExportDashboard = async () => {
    setIsExporting(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate CSV with dashboard data
    const csvContent = [
      ["Metric", "Value", "Change", "Period"],
      ["Total Bookings", "1,888", "+12.5%", dateRangeLabels[dateRange]],
      ["Revenue", "$462,500", "+18.2%", dateRangeLabels[dateRange]],
      ["Active Clients", "892", "+5.1%", dateRangeLabels[dateRange]],
      ["Commission", "$92,500", "+22.3%", dateRangeLabels[dateRange]],
      [],
      ["Recent Bookings"],
      ["ID", "Hotel", "Guest", "Dates", "Status", "Amount"],
      ...recentBookings.map(b => [b.id, b.hotel, b.guest, b.dates, b.status, b.amount]),
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Dashboard data exported successfully.",
    });
    
    setIsExporting(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-secondary/30">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{getGreeting()}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-foreground">{userEmail || "Agent"}</p>
                    <p className="text-xs text-muted-foreground">Travel Agent</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-white font-semibold text-sm">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : "A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-8 overflow-auto">
            {/* Welcome Section with Date Range & Export */}
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary uppercase tracking-wider">Dashboard Overview</p>
                <h1 className="text-4xl md:text-5xl font-heading text-foreground">
                  Welcome back, <span className="text-primary">{userEmail ? userEmail.split("@")[0] : "Agent"}</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                  Here's what's happening with your travel business today.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card">
                      <CalendarIcon className="h-4 w-4" />
                      {dateRangeLabels[dateRange]}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="backdrop-blur-xl bg-card/95">
                    {Object.entries(dateRangeLabels).map(([key, label]) => (
                      <DropdownMenuItem 
                        key={key}
                        onClick={() => setDateRange(key as DateRange)}
                        className={dateRange === key ? "bg-primary/10 text-primary" : ""}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="outline" 
                  className="gap-2 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card"
                  onClick={handleExportDashboard}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {stats.map((stat, index) => (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden border-none bg-card/60 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <h3 className="text-3xl font-heading text-foreground tracking-tight">{stat.value}</h3>
                      </div>
                      <div className={`p-3 rounded-2xl ${stat.color} transition-transform group-hover:scale-110`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className={`mt-4 flex items-center text-sm font-medium ${
                      stat.trend === "up" ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {stat.trend === "up" ? (
                        <TrendingUpIcon className="w-4 h-4 mr-1.5" />
                      ) : (
                        <TrendingDownIcon className="w-4 h-4 mr-1.5" />
                      )}
                      <span>{stat.change}</span>
                      <span className="text-muted-foreground font-normal ml-1">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts & Alerts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <div className="lg:col-span-2">
                <RevenueChart />
              </div>
              <div>
                <AlertsPanel />
              </div>
            </div>

            {/* Bookings Pipeline */}
            <div className="mb-10">
              <BookingsPipeline />
            </div>

            {/* Quick Actions & Recent Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {/* Quick Actions */}
              <Card className="border-none bg-card/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-heading text-xl text-foreground mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto py-5 flex flex-col items-center gap-3 border-border/50 bg-background/50 hover:bg-primary/5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group"
                      onClick={() => navigate("/")}
                    >
                      <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <SearchIcon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">Search Hotels</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-5 flex flex-col items-center gap-3 border-border/50 bg-background/50 hover:bg-accent/5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 group"
                      onClick={() => navigate("/dashboard/my-bookings")}
                    >
                      <div className="p-3 rounded-xl bg-accent/20 group-hover:bg-accent/30 transition-colors">
                        <CalendarIcon className="w-5 h-5 text-accent" />
                      </div>
                      <span className="text-sm font-medium">My Bookings</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-5 flex flex-col items-center gap-3 border-border/50 bg-background/50 hover:bg-[hsl(43,74%,66%)]/5 hover:border-[hsl(43,74%,66%)]/30 hover:shadow-lg hover:shadow-[hsl(43,74%,66%)]/10 transition-all duration-300 group"
                      onClick={() => navigate("/reporting/bookings")}
                    >
                      <div className="p-3 rounded-xl bg-[hsl(43,74%,66%)]/20 group-hover:bg-[hsl(43,74%,66%)]/30 transition-colors">
                        <FileTextIcon className="w-5 h-5 text-[hsl(43,74%,66%)]" />
                      </div>
                      <span className="text-sm font-medium">View Reports</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-5 flex flex-col items-center gap-3 border-border/50 bg-background/50 hover:bg-emerald-500/5 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group"
                      onClick={() => navigate("/clients")}
                    >
                      <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                        <UsersIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium">Manage Clients</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card className="lg:col-span-2 border-none bg-card/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-heading text-xl text-foreground">Recent Bookings</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      onClick={() => navigate("/reporting/bookings")}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="group flex items-center gap-4 p-4 rounded-2xl bg-background/50 hover:bg-background border border-transparent hover:border-border/50 transition-all duration-300 cursor-pointer hover:shadow-md"
                        onClick={() => navigate(`/orders/${booking.id}`)}
                      >
                        <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                          <BedDoubleIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {booking.hotel}
                            </p>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                booking.status === "confirmed"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              {booking.destination}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span>{booking.guest}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span>{booking.dates}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{booking.amount}</p>
                          <p className="text-xs text-muted-foreground">{booking.id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <div className="pb-4">
              <TopPerformers />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
