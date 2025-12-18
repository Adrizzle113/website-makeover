import { useState } from "react";
import { format } from "date-fns";
import { AlertTriangleIcon, CheckCircleIcon, ClockIcon, MessageSquareIcon, MoreHorizontalIcon } from "lucide-react";
import { ReportingLayout, ReportingFilterToolbar, StatusBadge } from "@/components/reporting";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ReportingFilters, ReconciliationItem } from "@/types/reporting";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Mock data
const mockItems: ReconciliationItem[] = [
  {
    id: "REC-001",
    type: "price_mismatch",
    bookingId: "BK-2025-001",
    expected: 1850,
    actual: 1820,
    difference: -30,
    currency: "USD",
    severity: "low",
    status: "open",
    description: "Client total doesn't match supplier + margin calculation",
    createdAt: "2025-01-18T10:00:00Z",
  },
  {
    id: "REC-002",
    type: "cancellation_mismatch",
    bookingId: "BK-2025-003",
    invoiceId: "INV-2025-001",
    expected: 2100,
    actual: 1800,
    difference: -300,
    currency: "USD",
    severity: "medium",
    status: "in_progress",
    notes: "Checking with supplier for correct refund amount",
    description: "Refund amount doesn't match cancellation policy",
    createdAt: "2025-01-17T14:30:00Z",
  },
  {
    id: "REC-003",
    type: "fx_mismatch",
    bookingId: "BK-2025-002",
    expected: 4200,
    actual: 4150,
    difference: -50,
    currency: "EUR",
    severity: "low",
    status: "resolved",
    notes: "FX rate fluctuation - adjusted in next invoice",
    description: "Currency conversion rate differs from booking time",
    createdAt: "2025-01-16T09:15:00Z",
    resolvedAt: "2025-01-17T11:00:00Z",
  },
  {
    id: "REC-004",
    type: "duplicate_status",
    bookingId: "BK-2025-008",
    expected: 1,
    actual: 2,
    difference: 1,
    currency: "USD",
    severity: "high",
    status: "open",
    description: "Booking appears confirmed twice in ETG system",
    createdAt: "2025-01-15T16:45:00Z",
  },
  {
    id: "REC-005",
    type: "price_mismatch",
    bookingId: "BK-2025-010",
    expected: 3400,
    actual: 3200,
    difference: -200,
    currency: "USD",
    severity: "medium",
    status: "open",
    description: "Markup calculation error detected",
    createdAt: "2025-01-14T08:30:00Z",
  },
];

const typeLabels = {
  price_mismatch: "Price Mismatch",
  cancellation_mismatch: "Cancellation/Refund",
  fx_mismatch: "FX Mismatch",
  duplicate_status: "Duplicate/Unknown",
};

export function ReconciliationReportPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [note, setNote] = useState("");

  const openItems = mockItems.filter(i => i.status === "open").length;
  const inProgressItems = mockItems.filter(i => i.status === "in_progress").length;
  const resolvedItems = mockItems.filter(i => i.status === "resolved").length;

  const handleMarkResolved = (item: ReconciliationItem) => {
    toast({
      title: "Marked as resolved",
      description: `Issue ${item.id} has been marked as resolved.`,
    });
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    toast({
      title: "Note added",
      description: "Your internal note has been saved.",
    });
    setNote("");
  };

  const filterByType = (type: string) => {
    if (type === "all") return mockItems;
    return mockItems.filter(i => i.type === type);
  };

  return (
    <ReportingLayout title="Reconciliation" description="Identify and resolve discrepancies">
      <ReportingFilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
        userRole="admin"
        showPaymentFilters={false}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Issues</p>
              <p className="text-2xl font-semibold">{openItems}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-semibold">{inProgressItems}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-semibold">{resolvedItems}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs by Type */}
      <Tabs defaultValue="all" className="mt-8">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">All Issues</TabsTrigger>
          <TabsTrigger value="price_mismatch">Price</TabsTrigger>
          <TabsTrigger value="cancellation_mismatch">Cancellation</TabsTrigger>
          <TabsTrigger value="fx_mismatch">FX</TabsTrigger>
          <TabsTrigger value="duplicate_status">Duplicate</TabsTrigger>
        </TabsList>

        {["all", "price_mismatch", "cancellation_mismatch", "fx_mismatch", "duplicate_status"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="mt-4">
            <div className="border rounded-lg bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold text-right">Expected</TableHead>
                    <TableHead className="font-semibold text-right">Actual</TableHead>
                    <TableHead className="font-semibold text-right">Difference</TableHead>
                    <TableHead className="font-semibold">Severity</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterByType(tabValue).map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedItem(item);
                        setDrawerOpen(true);
                      }}
                    >
                      <TableCell className="font-mono text-sm">{item.id}</TableCell>
                      <TableCell className="text-sm">{typeLabels[item.type]}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{item.bookingId}</span>
                        {item.invoiceId && (
                          <span className="text-xs text-muted-foreground ml-1">/ {item.invoiceId}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.currency} {item.expected.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.currency} {item.actual.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-mono",
                          item.difference < 0 ? "text-red-600" : "text-emerald-600"
                        )}>
                          {item.difference > 0 ? "+" : ""}{item.currency} {item.difference.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.severity} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
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
                              setSelectedItem(item);
                              setDrawerOpen(true);
                            }}>
                              View Details
                            </DropdownMenuItem>
                            {item.status !== "resolved" && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleMarkResolved(item);
                              }}>
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                Mark Resolved
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filterByType(tabValue).length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  No issues found in this category.
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader className="space-y-1 pb-4">
                <SheetTitle className="text-lg font-semibold">Issue Details</SheetTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedItem.severity} />
                  <StatusBadge status={selectedItem.status} />
                </div>
              </SheetHeader>

              <div className="space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                  <p className="font-medium">{typeLabels[selectedItem.type]}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm">{selectedItem.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expected</p>
                    <p className="font-mono font-medium">{selectedItem.currency} {selectedItem.expected.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Actual</p>
                    <p className="font-mono font-medium">{selectedItem.currency} {selectedItem.actual.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Difference</p>
                    <p className={cn(
                      "font-mono font-medium",
                      selectedItem.difference < 0 ? "text-red-600" : "text-emerald-600"
                    )}>
                      {selectedItem.currency} {selectedItem.difference.toLocaleString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">References</p>
                  <div className="space-y-1">
                    <p className="text-sm">Booking: <span className="font-mono">{selectedItem.bookingId}</span></p>
                    {selectedItem.invoiceId && (
                      <p className="text-sm">Invoice: <span className="font-mono">{selectedItem.invoiceId}</span></p>
                    )}
                  </div>
                </div>

                {selectedItem.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{selectedItem.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Add Note */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Add Internal Note</p>
                  <Textarea
                    placeholder="Add a note about this issue..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button size="sm" className="mt-2 gap-2" onClick={handleAddNote}>
                    <MessageSquareIcon className="w-4 h-4" />
                    Add Note
                  </Button>
                </div>

                <Separator />

                {/* Actions */}
                {selectedItem.status !== "resolved" && (
                  <div className="flex gap-3">
                    <Button className="flex-1 gap-2" onClick={() => handleMarkResolved(selectedItem)}>
                      <CheckCircleIcon className="w-4 h-4" />
                      Mark Resolved
                    </Button>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Created: {format(new Date(selectedItem.createdAt), "MMM d, yyyy 'at' HH:mm")}
                  {selectedItem.resolvedAt && (
                    <span className="ml-2">
                      • Resolved: {format(new Date(selectedItem.resolvedAt), "MMM d, yyyy 'at' HH:mm")}
                    </span>
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
