import { useState } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserIcon,
  BuildingIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  CalendarIcon,
  DollarSignIcon,
  PlusIcon,
} from "lucide-react";
import type { Client, ClientBooking, ClientInvoice, ClientPayment, ClientNote } from "@/types/clients";

interface ClientDrawerProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data for demo
const mockBookings: ClientBooking[] = [
  {
    id: "BK001",
    etgOrderId: "ETG-2025-001234",
    status: "confirmed",
    hotelName: "Grand Hotel Paris",
    city: "Paris",
    checkIn: "2025-01-15",
    checkOut: "2025-01-18",
    totalAmount: 1250,
    currency: "USD",
    createdAt: "2025-01-05T10:30:00Z",
  },
  {
    id: "BK002",
    etgOrderId: "ETG-2025-001567",
    status: "processing",
    hotelName: "Marriott London",
    city: "London",
    checkIn: "2025-02-10",
    checkOut: "2025-02-14",
    totalAmount: 2100,
    currency: "USD",
    createdAt: "2025-01-10T14:22:00Z",
  },
];

const mockInvoices: ClientInvoice[] = [
  {
    id: "INV-2025-001",
    status: "paid",
    totalDue: 1250,
    currency: "USD",
    dueDate: "2025-01-20",
    createdAt: "2025-01-05T10:35:00Z",
  },
  {
    id: "INV-2025-002",
    status: "unpaid",
    totalDue: 2100,
    currency: "USD",
    dueDate: "2025-02-15",
    createdAt: "2025-01-10T14:30:00Z",
  },
];

const mockPayments: ClientPayment[] = [
  {
    id: "PAY-001",
    type: "payment",
    amount: 1250,
    currency: "USD",
    method: "Card",
    reference: "INV-2025-001",
    status: "completed",
    createdAt: "2025-01-18T09:15:00Z",
  },
];

const mockNotes: ClientNote[] = [
  {
    id: "NOTE-001",
    clientId: "1",
    authorId: "agent-1",
    authorName: "John Doe",
    content: "Prefers hotel rooms on higher floors with city views. VIP treatment requested.",
    createdAt: "2025-01-05T11:00:00Z",
  },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unpaid: "bg-amber-50 text-amber-700 border-amber-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function ClientDrawer({ client, open, onOpenChange }: ClientDrawerProps) {
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState(mockNotes);

  if (!client) return null;

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: ClientNote = {
      id: `NOTE-${Date.now()}`,
      clientId: client.id,
      authorId: "current-user",
      authorName: "Current User",
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
    };
    setNotes([note, ...notes]);
    setNewNote("");
  };

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl font-heading">{client.name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">{client.company || "Individual"}</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                client.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {client.status}
            </Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-2">
          <TabsList className="w-full grid grid-cols-5 h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs">Bookings</TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Contact Information</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{client.country}</span>
                </div>
                {client.company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BuildingIcon className="w-4 h-4" />
                    <span>{client.company}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Assignment */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Assignment</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Agent</span>
                  <span>{client.assignedAgentName || "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subagent</span>
                  <span>{client.assignedSubagentName || "None"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Preferences */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Preferences</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Default Residency</span>
                  <span>{client.defaultResidency || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preferred Currency</span>
                  <span>{client.preferredCurrency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span>{client.defaultPaymentMethod || "Not set"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Stats */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total Bookings</p>
                  <p className="text-lg font-semibold">{client.totalBookings}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total Spend</p>
                  <p className="text-lg font-semibold">{formatCurrency(client.totalSpend)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Avg Booking</p>
                  <p className="text-lg font-semibold">{formatCurrency(client.avgBookingValue)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className={cn("text-lg font-semibold", client.outstandingBalance > 0 && "text-amber-600")}>
                    {formatCurrency(client.outstandingBalance)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBookings.map((booking) => (
                  <TableRow key={booking.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{booking.hotelName}</p>
                        <p className="text-xs text-muted-foreground">{booking.city}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(booking.checkIn), "MMM d")} - {format(new Date(booking.checkOut), "MMM d")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize text-xs", statusColors[booking.status])}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(booking.totalAmount, booking.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize text-xs", statusColors[invoice.status])}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.totalDue, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {format(new Date(payment.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="capitalize">{payment.type}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize text-xs", statusColors[payment.status])}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {payment.type === "refund" ? "-" : ""}
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="notes" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Add an internal note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} size="sm" disabled={!newNote.trim()}>
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Note
              </Button>
            </div>
            <Separator />
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{note.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(note.createdAt), "MMM d, yyyy 'at' HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{note.content}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
