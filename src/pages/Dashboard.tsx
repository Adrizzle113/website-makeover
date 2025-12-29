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
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  AppSidebar, 
  RevenueChart, 
  AlertsPanel, 
  BookingsPipeline,
  TopPerformers,
} from "@/components/dashboard";

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
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
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-accent-foreground font-medium text-sm">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : "A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-8 overflow-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-heading text-foreground mb-2">
                Welcome back, {userEmail ? userEmail.split("@")[0] : "Agent"}
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your travel business today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="border-none shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-heading text-foreground">{stat.value}</h3>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className={`mt-4 flex items-center text-sm ${
                      stat.trend === "up" ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {stat.trend === "up" ? (
                        <TrendingUpIcon className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDownIcon className="w-4 h-4 mr-1" />
                      )}
                      <span>{stat.change} from last month</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts & Alerts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <RevenueChart />
              </div>
              <div>
                <AlertsPanel />
              </div>
            </div>

            {/* Bookings Pipeline */}
            <div className="mb-8">
              <BookingsPipeline />
            </div>

            {/* Quick Actions & Recent Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Quick Actions */}
              <Card className="border-none shadow-[var(--shadow-card)]">
                <CardContent className="p-6">
                  <h3 className="font-heading text-lg text-foreground mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:bg-secondary hover:border-primary transition-all"
                      onClick={() => navigate("/")}
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <SearchIcon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-xs font-medium">Search Hotels</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:bg-secondary hover:border-primary transition-all"
                      onClick={() => navigate("/my-bookings")}
                    >
                      <div className="p-2 rounded-lg bg-accent/20">
                        <CalendarIcon className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-xs font-medium">My Bookings</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:bg-secondary hover:border-primary transition-all"
                      onClick={() => navigate("/reporting/bookings")}
                    >
                      <div className="p-2 rounded-lg bg-[hsl(43,74%,66%)]/20">
                        <FileTextIcon className="w-4 h-4 text-[hsl(43,74%,66%)]" />
                      </div>
                      <span className="text-xs font-medium">View Reports</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 border-border hover:bg-secondary hover:border-primary transition-all"
                      onClick={() => navigate("/clients")}
                    >
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <UsersIcon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium">Manage Clients</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card className="lg:col-span-2 border-none shadow-[var(--shadow-card)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-heading text-lg text-foreground">Recent Bookings</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-accent hover:text-accent/80"
                      onClick={() => navigate("/reporting/bookings")}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                        onClick={() => navigate(`/orders/${booking.id}`)}
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <BedDoubleIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {booking.hotel}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                booking.status === "confirmed"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              {booking.destination}
                            </span>
                            <span>•</span>
                            <span>{booking.guest}</span>
                            <span>•</span>
                            <span>{booking.dates}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{booking.amount}</p>
                          <p className="text-xs text-muted-foreground">{booking.id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <TopPerformers />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
