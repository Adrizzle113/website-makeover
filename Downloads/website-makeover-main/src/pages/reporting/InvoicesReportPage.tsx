import { useState } from "react";
import { format } from "date-fns";
import { EyeIcon, DownloadIcon, SendIcon, CheckCircleIcon, MoreHorizontalIcon } from "lucide-react";
import { ReportingLayout, ReportingFilterToolbar, StatusBadge } from "@/components/reporting";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ReportingFilters, ReportingInvoice, SavedView } from "@/types/reporting";
import { toast } from "@/hooks/use-toast";

// Mock data
const mockInvoices: ReportingInvoice[] = [
  {
    id: "INV-2025-001",
    groupName: "Acme Travel Corp",
    clientName: "John Smith",
    bookingsCount: 5,
    bookingIds: ["BK-001", "BK-002", "BK-003", "BK-004", "BK-005"],
    totalDue: 8500,
    currency: "USD",
    dueDate: "2025-02-15",
    status: "unpaid",
    paymentLinkStatus: "active",
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "INV-2025-002",
    groupName: "Global Adventures",
    clientName: "Emma Wilson",
    bookingsCount: 3,
    bookingIds: ["BK-006", "BK-007", "BK-008"],
    totalDue: 4200,
    currency: "EUR",
    dueDate: "2025-02-01",
    status: "paid",
    createdAt: "2025-01-10T14:30:00Z",
    paidAt: "2025-01-28T09:15:00Z",
  },
  {
    id: "INV-2025-003",
    groupName: "Sunshine Holidays",
    clientName: "David Brown",
    bookingsCount: 2,
    bookingIds: ["BK-009", "BK-010"],
    totalDue: 3100,
    currency: "USD",
    dueDate: "2025-01-20",
    status: "overdue",
    paymentLinkStatus: "expired",
    createdAt: "2025-01-05T08:00:00Z",
  },
  {
    id: "INV-2025-004",
    groupName: "Acme Travel Corp",
    clientName: "Sophie Taylor",
    bookingsCount: 1,
    bookingIds: ["BK-011"],
    totalDue: 1600,
    currency: "USD",
    dueDate: "2025-02-28",
    status: "sent",
    paymentLinkStatus: "active",
    createdAt: "2025-01-18T11:20:00Z",
  },
  {
    id: "INV-2025-005",
    groupName: "Global Adventures",
    clientName: "James Anderson",
    bookingsCount: 4,
    bookingIds: ["BK-012", "BK-013", "BK-014", "BK-015"],
    totalDue: 12800,
    currency: "USD",
    dueDate: "2025-03-01",
    status: "partial",
    createdAt: "2025-01-20T16:45:00Z",
  },
  {
    id: "INV-2025-006",
    groupName: "Sunshine Holidays",
    clientName: "Maria Garcia",
    bookingsCount: 2,
    bookingIds: ["BK-016", "BK-017"],
    totalDue: 2400,
    currency: "EUR",
    dueDate: "2025-02-20",
    status: "draft",
    createdAt: "2025-01-22T09:30:00Z",
  },
];

const mockSavedViews: SavedView[] = [
  { id: "1", name: "All Invoices", filters: {}, createdAt: "2025-01-01", isDefault: true },
  { id: "2", name: "Unpaid Invoices", filters: {}, createdAt: "2025-01-01" },
  { id: "3", name: "Overdue", filters: {}, createdAt: "2025-01-01" },
];

export function InvoicesReportPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});
  const [selectedInvoice, setSelectedInvoice] = useState<ReportingInvoice | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleExport = (format: "csv" | "excel") => {
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: "Your download will start shortly.",
    });
  };

  const handleMarkAsPaid = (invoice: ReportingInvoice) => {
    toast({
      title: "Invoice marked as paid",
      description: `Invoice ${invoice.id} has been marked as paid.`,
    });
  };

  const handleSendReminder = (invoice: ReportingInvoice) => {
    toast({
      title: "Reminder sent",
      description: `Payment reminder sent for invoice ${invoice.id}.`,
    });
  };

  return (
    <ReportingLayout title="Invoices" description="Manage invoices and payments">
      <ReportingFilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
        savedViews={mockSavedViews}
        onExport={handleExport}
        userRole="admin"
        showPaymentFilters={false}
      />

      <div className="mt-6 border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Invoice ID</TableHead>
              <TableHead className="font-semibold">Group / Client</TableHead>
              <TableHead className="font-semibold text-right">Bookings</TableHead>
              <TableHead className="font-semibold text-right">Total Due</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Payment Link</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedInvoice(invoice);
                  setDrawerOpen(true);
                }}
              >
                <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{invoice.groupName}</p>
                    <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">{invoice.bookingsCount}</TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {invoice.currency} {invoice.totalDue.toLocaleString()}
                </TableCell>
                <TableCell>{format(new Date(invoice.dueDate), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status} />
                </TableCell>
                <TableCell>
                  {invoice.paymentLinkStatus && (
                    <StatusBadge status={invoice.paymentLinkStatus} />
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontalIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoice(invoice);
                        setDrawerOpen(true);
                      }}>
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {invoice.status !== "paid" && (
                        <>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsPaid(invoice);
                          }}>
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleSendReminder(invoice);
                          }}>
                            <SendIcon className="w-4 h-4 mr-2" />
                            Send Reminder
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedInvoice && (
            <>
              <SheetHeader className="space-y-1 pb-4">
                <SheetTitle className="text-lg font-semibold">Invoice Details</SheetTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedInvoice.status} />
                  <span className="text-sm text-muted-foreground">{selectedInvoice.id}</span>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Group</p>
                    <p className="font-medium">{selectedInvoice.groupName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Client</p>
                    <p className="font-medium">{selectedInvoice.clientName}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Due</p>
                    <p className="text-2xl font-semibold font-mono">
                      {selectedInvoice.currency} {selectedInvoice.totalDue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Due Date</p>
                    <p className="font-medium">{format(new Date(selectedInvoice.dueDate), "MMM d, yyyy")}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Linked Bookings</p>
                  <div className="space-y-1">
                    {selectedInvoice.bookingIds.map((id) => (
                      <div key={id} className="text-sm font-mono bg-muted/50 px-3 py-1.5 rounded">
                        {id}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2">
                    <DownloadIcon className="w-4 h-4" />
                    Download PDF
                  </Button>
                  {selectedInvoice.status !== "paid" && (
                    <Button className="flex-1 gap-2" onClick={() => handleMarkAsPaid(selectedInvoice)}>
                      <CheckCircleIcon className="w-4 h-4" />
                      Mark Paid
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </ReportingLayout>
  );
}
