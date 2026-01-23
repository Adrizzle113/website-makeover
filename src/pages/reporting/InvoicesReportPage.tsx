import { useState } from "react";
import { format } from "date-fns";
import { EyeIcon, DownloadIcon, SendIcon, CheckCircleIcon, MoreHorizontalIcon } from "lucide-react";
import { ReportingLayout, ReportingFilterToolbar, StatusBadge } from "@/components/reporting";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ReportingFilters, ReportingInvoice, SavedView } from "@/types/reporting";
import { useInvoices } from "@/hooks/useInvoices";
import { toast } from "@/hooks/use-toast";

const mockSavedViews: SavedView[] = [
  { id: "1", name: "All Invoices", filters: {}, createdAt: "2025-01-01", isDefault: true },
  { id: "2", name: "Unpaid Invoices", filters: {}, createdAt: "2025-01-01" },
  { id: "3", name: "Overdue", filters: {}, createdAt: "2025-01-01" },
];

function TableSkeleton() {
  return (
    <div className="mt-6 border rounded-lg bg-card overflow-hidden">
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="mt-6">
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">No invoices found for the selected filters</p>
      </CardContent>
    </Card>
  );
}

export function InvoicesReportPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});
  const [selectedInvoice, setSelectedInvoice] = useState<ReportingInvoice | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const { invoices, isLoading } = useInvoices(filters);

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

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

      {isLoading ? (
        <TableSkeleton />
      ) : invoices.length === 0 ? (
        <EmptyState />
      ) : (
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
              {invoices.map((invoice) => (
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
                    {formatCurrency(invoice.totalDue, invoice.currency)}
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
      )}

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
                      {formatCurrency(selectedInvoice.totalDue, selectedInvoice.currency)}
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
