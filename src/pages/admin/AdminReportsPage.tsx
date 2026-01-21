import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin";
import { ReportingFilterToolbar } from "@/components/reporting";
import { BookingDrawer } from "@/components/reporting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportingFilters, ReportingBooking, SavedView } from "@/types/reporting";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";

// Mock data for admin reports
const mockBookings: ReportingBooking[] = [
  {
    id: "BK-001",
    etgOrderId: "ETG-12345",
    status: "confirmed",
    leadGuest: "John Smith",
    guestEmail: "john@example.com",
    hotel: "Grand Luxury Resort",
    city: "Dubai",
    country: "UAE",
    checkIn: "2025-02-15",
    checkOut: "2025-02-20",
    nights: 5,
    roomType: "Deluxe Suite",
    clientTotal: 2500,
    supplierTotal: 2100,
    margin: 400,
    marginPercent: 16,
    currency: "USD",
    paymentType: "deposit",
    paymentStatus: "collected",
    agentId: "agent-1",
    agentName: "Elite Travel Agency",
    cancellationPolicy: "Free cancellation until Feb 10",
    createdAt: "2025-01-15",
  },
  {
    id: "BK-002",
    etgOrderId: "ETG-12346",
    status: "processing",
    leadGuest: "Emma Wilson",
    guestEmail: "emma@example.com",
    hotel: "Beachfront Paradise",
    city: "Maldives",
    country: "Maldives",
    checkIn: "2025-03-01",
    checkOut: "2025-03-07",
    nights: 6,
    roomType: "Water Villa",
    clientTotal: 5800,
    supplierTotal: 4900,
    margin: 900,
    marginPercent: 15.5,
    currency: "USD",
    paymentType: "now_gross",
    paymentStatus: "collected",
    agentId: "agent-2",
    agentName: "Luxury Voyages Inc",
    cancellationPolicy: "Non-refundable",
    createdAt: "2025-01-14",
  },
  {
    id: "BK-003",
    etgOrderId: "ETG-12347",
    status: "cancelled",
    leadGuest: "Robert Chen",
    guestEmail: "robert@example.com",
    hotel: "Mountain Retreat",
    city: "Swiss Alps",
    country: "Switzerland",
    checkIn: "2025-02-20",
    checkOut: "2025-02-25",
    nights: 5,
    roomType: "Alpine Suite",
    clientTotal: 3200,
    supplierTotal: 2700,
    margin: 500,
    marginPercent: 15.6,
    currency: "USD",
    paymentType: "hotel",
    paymentStatus: "not_collected",
    agentId: "agent-3",
    agentName: "Global Destinations",
    cancellationPolicy: "Flexible",
    createdAt: "2025-01-13",
  },
];

const mockSavedViews: SavedView[] = [
  { id: "1", name: "All Bookings", filters: {}, createdAt: "2025-01-01" },
  { id: "2", name: "Confirmed Only", filters: { status: ["confirmed"] }, createdAt: "2025-01-01" },
];

const platformStats = [
  { title: "Total Revenue", value: "$1,245,000", change: "+18.2%", icon: DollarSign },
  { title: "Total Margin", value: "$187,500", change: "+22.4%", icon: TrendingUp },
  { title: "Active Agents", value: "156", change: "+12", icon: Users },
  { title: "Total Bookings", value: "2,847", change: "+15.3%", icon: Calendar },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    confirmed: "default",
    processing: "secondary",
    cancelled: "destructive",
    failed: "destructive",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

export default function AdminReportsPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});
  const [selectedBooking, setSelectedBooking] = useState<ReportingBooking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (booking: ReportingBooking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <div className="flex flex-col">
            <header className="sticky top-0 z-10 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div>
                <h1 className="text-lg font-semibold">Platform Reports</h1>
                <p className="text-sm text-muted-foreground">
                  View and analyze booking data across all agents
                </p>
              </div>
            </header>

            <main className="flex-1 space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {platformStats.map((stat) => (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-green-600">{stat.change} vs last period</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Tabs defaultValue="bookings">
                <TabsList>
                  <TabsTrigger value="bookings">Bookings</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="agents">By Agent</TabsTrigger>
                </TabsList>

                <TabsContent value="bookings" className="space-y-4">
                  <ReportingFilterToolbar
                    filters={filters}
                    onFiltersChange={setFilters}
                    savedViews={mockSavedViews}
                    onSaveView={() => {}}
                    onLoadView={() => {}}
                    onExport={() => {}}
                    userRole="admin"
                    showPaymentFilters
                  />

                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking ID</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Lead Guest</TableHead>
                          <TableHead>Hotel</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead className="text-right">Client Total</TableHead>
                          <TableHead className="text-right">Margin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockBookings.map((booking) => (
                          <TableRow
                            key={booking.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleRowClick(booking)}
                          >
                            <TableCell className="font-medium">{booking.id}</TableCell>
                            <TableCell>{booking.agentName}</TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell>{booking.leadGuest}</TableCell>
                            <TableCell>{booking.hotel}</TableCell>
                            <TableCell>{booking.city}</TableCell>
                            <TableCell>{booking.checkIn}</TableCell>
                            <TableCell className="text-right">
                              ${booking.clientTotal.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              ${booking.margin} ({booking.marginPercent}%)
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>

                <TabsContent value="revenue">
                  <Card className="p-6">
                    <p className="text-muted-foreground">
                      Revenue breakdown charts and analytics coming soon.
                    </p>
                  </Card>
                </TabsContent>

                <TabsContent value="agents">
                  <Card className="p-6">
                    <p className="text-muted-foreground">
                      Per-agent performance reports coming soon.
                    </p>
                  </Card>
                </TabsContent>
              </Tabs>
            </main>
          </div>
        </SidebarInset>
      </div>

      <BookingDrawer
        booking={selectedBooking}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </SidebarProvider>
  );
}
