import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  SearchIcon, 
  FilterIcon, 
  CalendarIcon, 
  MapPinIcon,
  UsersIcon,
  ChevronRightIcon,
  XIcon
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trip, TripStatus } from "@/types/trips";

// Mock data for demonstration
const mockTrips: Trip[] = [
  {
    id: "og_12345",
    name: "Maldives Honeymoon Package",
    clientName: "John & Sarah Smith",
    clientEmail: "john.smith@email.com",
    dateRange: { checkIn: "2025-01-15", checkOut: "2025-01-22" },
    destinations: ["Malé", "Baa Atoll"],
    bookingsCount: 2,
    status: "active",
    createdAt: "2024-12-10T10:30:00Z",
    updatedAt: "2024-12-10T10:30:00Z",
    totalAmount: 4500,
    currency: "USD"
  },
  {
    id: "og_12346",
    name: "European Adventure",
    clientName: "Williams Family",
    clientEmail: "williams@email.com",
    dateRange: { checkIn: "2025-02-01", checkOut: "2025-02-14" },
    destinations: ["Paris", "Rome", "Barcelona"],
    bookingsCount: 4,
    status: "active",
    createdAt: "2024-12-08T14:20:00Z",
    updatedAt: "2024-12-09T09:15:00Z",
    totalAmount: 8200,
    currency: "USD"
  },
  {
    id: "og_12347",
    name: "Tokyo Business Trip",
    clientName: "Corporate Solutions Inc.",
    clientEmail: "travel@corpsolutions.com",
    dateRange: { checkIn: "2024-12-20", checkOut: "2024-12-24" },
    destinations: ["Tokyo"],
    bookingsCount: 3,
    status: "completed",
    createdAt: "2024-11-28T08:00:00Z",
    updatedAt: "2024-12-24T12:00:00Z",
    totalAmount: 3200,
    currency: "USD"
  },
  {
    id: "og_12348",
    name: "Caribbean Getaway",
    clientName: "Michael Brown",
    clientEmail: "m.brown@email.com",
    dateRange: { checkIn: "2025-03-10", checkOut: "2025-03-17" },
    destinations: ["Cancún", "Playa del Carmen"],
    bookingsCount: 1,
    status: "cancelled",
    createdAt: "2024-12-05T16:45:00Z",
    updatedAt: "2024-12-12T11:30:00Z",
    totalAmount: 2100,
    currency: "USD"
  },
];

const statusColors: Record<TripStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  mixed: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export default function TripsListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredTrips = mockTrips.filter((trip) => {
    const matchesSearch = 
      trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destinations.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDateRange = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-heading-lg text-foreground mb-2">Trips</h1>
            <p className="text-muted-foreground">
              Manage all your client trips and itineraries
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by trip name, client, destination, or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <FilterIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </div>
            </div>

            {/* Extended Filters */}
            {showFilters && (
              <Card className="animate-fade-in">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Client Name
                      </label>
                      <Input placeholder="Filter by client..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Hotel
                      </label>
                      <Input placeholder="Filter by hotel..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Date From
                      </label>
                      <Input type="date" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                        Date To
                      </label>
                      <Input type="date" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Trips List */}
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <Card 
                key={trip.id}
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/20"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Trip Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-heading text-lg text-foreground truncate">
                              {trip.name}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={`capitalize ${statusColors[trip.status]}`}
                            >
                              {trip.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Order Group: {trip.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UsersIcon className="w-4 h-4" />
                          <span>{trip.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{trip.destinations.join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {formatDateRange(trip.dateRange.checkIn, trip.dateRange.checkOut)}
                            <span className="text-muted-foreground/60 ml-1">
                              ({calculateNights(trip.dateRange.checkIn, trip.dateRange.checkOut)} nights)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-0.5">
                          {trip.bookingsCount} booking{trip.bookingsCount !== 1 ? "s" : ""}
                        </p>
                        <p className="font-heading text-lg text-foreground">
                          {trip.currency} {trip.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      
                      <ChevronRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredTrips.length === 0 && (
              <div className="text-center py-16">
                <CalendarIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-heading text-lg text-foreground mb-2">No trips found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filters"
                    : "Your trips will appear here after bookings are confirmed"
                  }
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
