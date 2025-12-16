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
  ClockIcon,
  PlaneIcon,
  BedDoubleIcon,
  BarChart3Icon,
  FileTextIcon,
  GlobeIcon,
  StarIcon,
} from "lucide-react";

const stats = [
  {
    label: "Total Bookings",
    value: "1,888",
    change: "+12.5%",
    icon: Building2Icon,
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Revenue",
    value: "$45,678",
    change: "+8.2%",
    icon: CreditCardIcon,
    color: "bg-accent/20 text-accent",
  },
  {
    label: "Active Clients",
    value: "892",
    change: "+5.1%",
    icon: UsersIcon,
    color: "bg-[hsl(43,74%,66%)]/20 text-[hsl(43,74%,66%)]",
  },
  {
    label: "Commission",
    value: "$12,345",
    change: "+15.3%",
    icon: TrendingUpIcon,
    color: "bg-green-100 text-green-600",
  },
];

const recentBookings = [
  {
    id: "BK-2847",
    destination: "Paris, France",
    guest: "Sarah Mitchell",
    dates: "Dec 20-25",
    status: "confirmed",
    amount: "$1,245",
  },
  {
    id: "BK-2846",
    destination: "Tokyo, Japan",
    guest: "John Anderson",
    dates: "Dec 22-30",
    status: "pending",
    amount: "$2,890",
  },
  {
    id: "BK-2845",
    destination: "Bali, Indonesia",
    guest: "Emma Wilson",
    dates: "Jan 5-12",
    status: "confirmed",
    amount: "$1,670",
  },
  {
    id: "BK-2844",
    destination: "Dubai, UAE",
    guest: "Michael Chen",
    dates: "Jan 8-15",
    status: "confirmed",
    amount: "$3,200",
  },
];

const popularDestinations = [
  { name: "Paris", country: "France", bookings: 245, image: "🗼" },
  { name: "Tokyo", country: "Japan", bookings: 189, image: "🏯" },
  { name: "Bali", country: "Indonesia", bookings: 156, image: "🏝️" },
  { name: "Dubai", country: "UAE", bookings: 134, image: "🌴" },
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <GlobeIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading text-xl text-foreground">TravelHub</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/")}
              >
                Search Hotels
              </Button>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Bookings
              </Button>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Reports
              </Button>
            </nav>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <p className="heading-spaced text-accent mb-2">{getGreeting()}</p>
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
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUpIcon className="w-4 h-4 mr-1" />
                  <span>{stat.change} from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-2 border-none shadow-[var(--shadow-card)]">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg text-foreground mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center gap-3 border-border hover:bg-secondary hover:border-primary transition-all"
                  onClick={() => navigate("/")}
                >
                  <div className="p-3 rounded-xl bg-primary/10">
                    <SearchIcon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Search Hotels</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center gap-3 border-border hover:bg-secondary hover:border-primary transition-all"
                >
                  <div className="p-3 rounded-xl bg-accent/20">
                    <CalendarIcon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-sm font-medium">New Booking</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center gap-3 border-border hover:bg-secondary hover:border-primary transition-all"
                >
                  <div className="p-3 rounded-xl bg-[hsl(43,74%,66%)]/20">
                    <FileTextIcon className="w-5 h-5 text-[hsl(43,74%,66%)]" />
                  </div>
                  <span className="text-sm font-medium">View Reports</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center gap-3 border-border hover:bg-secondary hover:border-primary transition-all"
                >
                  <div className="p-3 rounded-xl bg-green-100">
                    <UsersIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">Manage Clients</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Popular Destinations */}
          <Card className="border-none shadow-[var(--shadow-card)]">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg text-foreground mb-4">Popular Destinations</h3>
              <div className="space-y-4">
                {popularDestinations.map((dest, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">
                      {dest.image}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{dest.name}</p>
                      <p className="text-xs text-muted-foreground">{dest.country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{dest.bookings}</p>
                      <p className="text-xs text-muted-foreground">bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Bookings */}
          <Card className="border-none shadow-[var(--shadow-card)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading text-lg text-foreground">Recent Bookings</h3>
                <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80">
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BedDoubleIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {booking.destination}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
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

          {/* World Map Card */}
          <Card className="border-none shadow-[var(--shadow-card)] overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg text-foreground">Global Reach</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinIcon className="w-4 h-4" />
                  <span>190+ Countries</span>
                </div>
              </div>
              <div className="relative h-64 bg-gradient-to-br from-primary/5 to-accent/10 rounded-xl overflow-hidden">
                {/* Animated Map Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    {/* Simplified world map dots */}
                    <svg viewBox="0 0 400 200" className="w-full h-full opacity-30">
                      <g fill="hsl(var(--primary))">
                        {/* North America */}
                        <circle cx="80" cy="60" r="3" className="animate-pulse" />
                        <circle cx="100" cy="70" r="2" />
                        <circle cx="70" cy="80" r="2" />
                        {/* South America */}
                        <circle cx="120" cy="140" r="3" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
                        <circle cx="115" cy="120" r="2" />
                        {/* Europe */}
                        <circle cx="200" cy="50" r="3" className="animate-pulse" style={{ animationDelay: "1s" }} />
                        <circle cx="190" cy="60" r="2" />
                        <circle cx="210" cy="55" r="2" />
                        {/* Africa */}
                        <circle cx="200" cy="100" r="3" />
                        <circle cx="210" cy="120" r="2" />
                        {/* Asia */}
                        <circle cx="280" cy="60" r="3" className="animate-pulse" style={{ animationDelay: "1.5s" }} />
                        <circle cx="300" cy="70" r="2" />
                        <circle cx="320" cy="80" r="3" className="animate-pulse" style={{ animationDelay: "2s" }} />
                        {/* Australia */}
                        <circle cx="340" cy="140" r="3" />
                      </g>
                      {/* Connection lines */}
                      <g stroke="hsl(var(--accent))" strokeWidth="0.5" opacity="0.3">
                        <line x1="80" y1="60" x2="200" y2="50" />
                        <line x1="200" y1="50" x2="280" y2="60" />
                        <line x1="200" y1="50" x2="120" y2="140" />
                        <line x1="280" y1="60" x2="340" y2="140" />
                      </g>
                    </svg>
                    {/* Floating stats */}
                    <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                      <p className="text-xs text-muted-foreground">Hotels Available</p>
                      <p className="text-lg font-heading text-foreground">2.7M+</p>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                      <p className="text-xs text-muted-foreground">Active Destinations</p>
                      <p className="text-lg font-heading text-foreground">15K+</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-[var(--shadow-card)] bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                <PlaneIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg text-foreground mb-2">Global Inventory</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Access to millions of hotels worldwide with real-time availability and exclusive B2B rates.
              </p>
              <div className="flex items-center gap-2 text-sm text-accent">
                <StarIcon className="w-4 h-4" />
                <span>Premium Partner Status</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[var(--shadow-card)] bg-gradient-to-br from-accent/10 to-transparent">
            <CardContent className="p-6">
              <div className="p-3 rounded-xl bg-accent/20 w-fit mb-4">
                <ClockIcon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-heading text-lg text-foreground mb-2">Instant Confirmation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get immediate booking confirmations and real-time updates for all your reservations.
              </p>
              <div className="flex items-center gap-2 text-sm text-accent">
                <StarIcon className="w-4 h-4" />
                <span>24/7 Support Available</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[var(--shadow-card)] bg-gradient-to-br from-[hsl(43,74%,66%)]/10 to-transparent">
            <CardContent className="p-6">
              <div className="p-3 rounded-xl bg-[hsl(43,74%,66%)]/20 w-fit mb-4">
                <BarChart3Icon className="w-6 h-6 text-[hsl(43,74%,66%)]" />
              </div>
              <h3 className="font-heading text-lg text-foreground mb-2">Smart Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track performance, revenue, and commission with detailed analytics and reports.
              </p>
              <div className="flex items-center gap-2 text-sm text-accent">
                <StarIcon className="w-4 h-4" />
                <span>Export Reports Anytime</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
