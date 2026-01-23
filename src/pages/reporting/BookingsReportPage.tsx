import { useState, useEffect, useMemo } from "react";
import { format as formatDate } from "date-fns";
import { 
  EyeIcon, 
  DownloadIcon, 
  XCircleIcon, 
  MoreHorizontalIcon,
  Columns3Icon,
  CheckIcon,
  FileDownIcon,
  Trash2Icon,
  Loader2Icon
} from "lucide-react";
import { ReportingLayout, ReportingFilterToolbar, BookingDrawer, StatusBadge } from "@/components/reporting";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { ReportingFilters, ReportingBooking, SavedView } from "@/types/reporting";
import { toast } from "@/hooks/use-toast";
import { useReportingBookings } from "@/hooks/useReportingBookings";

// Column definition type
interface ColumnDef {
  id: string;
  label: string;
  accessor: (booking: ReportingBooking) => string | number;
  align?: "left" | "right";
  className?: string;
  render?: (booking: ReportingBooking) => React.ReactNode;
}

// All available columns
const allColumns: ColumnDef[] = [
  { id: "bookingId", label: "Booking ID", accessor: (b) => b.id, className: "font-mono text-sm" },
  { id: "etgOrderId", label: "ETG Order", accessor: (b) => b.etgOrderId, className: "font-mono text-sm text-muted-foreground" },
  { id: "status", label: "Status", accessor: (b) => b.status, render: (b) => <StatusBadge status={b.status} /> },
  { id: "guest", label: "Guest", accessor: (b) => b.leadGuest },
  { id: "hotel", label: "Hotel", accessor: (b) => b.hotel, className: "max-w-[200px] truncate" },
  { id: "city", label: "City", accessor: (b) => b.city },
  { id: "country", label: "Country", accessor: (b) => b.country },
  { id: "checkIn", label: "Check-in", accessor: (b) => b.checkIn, render: (b) => formatDate(new Date(b.checkIn), "MMM d, yyyy") },
  { id: "checkOut", label: "Check-out", accessor: (b) => b.checkOut, render: (b) => formatDate(new Date(b.checkOut), "MMM d, yyyy") },
  { id: "nights", label: "Nights", accessor: (b) => b.nights, align: "right" },
  { id: "clientTotal", label: "Client Total", accessor: (b) => b.clientTotal, align: "right", render: (b) => <span className="font-mono">{b.currency} {b.clientTotal.toLocaleString()}</span> },
  { id: "supplierTotal", label: "Supplier", accessor: (b) => b.supplierTotal, align: "right", render: (b) => <span className="font-mono text-muted-foreground">{b.currency} {b.supplierTotal.toLocaleString()}</span> },
  { id: "margin", label: "Margin", accessor: (b) => b.margin, align: "right", render: (b) => (
    <>
      <span className="font-mono text-emerald-600">{b.currency} {b.margin.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground ml-1">({b.marginPercent}%)</span>
    </>
  )},
  { id: "payment", label: "Payment", accessor: (b) => b.paymentStatus, render: (b) => <StatusBadge status={b.paymentStatus} /> },
  { id: "agent", label: "Agent", accessor: (b) => b.agentName || "" },
  { id: "group", label: "Group", accessor: (b) => b.groupName || "" },
  { id: "roomType", label: "Room Type", accessor: (b) => b.roomType },
  { id: "createdAt", label: "Created", accessor: (b) => b.createdAt, render: (b) => formatDate(new Date(b.createdAt), "MMM d, yyyy HH:mm") },
];

// Default visible columns
const defaultVisibleColumns = ["bookingId", "etgOrderId", "status", "guest", "hotel", "city", "checkIn", "checkOut", "clientTotal", "supplierTotal", "margin", "payment"];

// LocalStorage key for column visibility
const COLUMN_VISIBILITY_KEY = "bookings-report-columns";
const ITEMS_PER_PAGE_KEY = "bookings-report-items-per-page";

// Saved views (could be persisted to database in the future)
const mockSavedViews: SavedView[] = [
  { id: "1", name: "This Month", filters: {}, createdAt: "2025-01-01", isDefault: true },
  { id: "2", name: "Unpaid Bookings", filters: { paymentStatus: ["not_collected"] as any }, createdAt: "2025-01-01" },
  { id: "3", name: "Cancellations", filters: { status: ["cancelled"] }, createdAt: "2025-01-01" },
];

export function BookingsReportPage() {
  const [filters, setFilters] = useState<ReportingFilters>({});
  const [selectedBooking, setSelectedBooking] = useState<ReportingBooking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Fetch real bookings from database
  const { bookings: filteredBookings, isLoading, error, refetch } = useReportingBookings(filters);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem(ITEMS_PER_PAGE_KEY);
    return saved ? parseInt(saved, 10) : 10;
  });
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    return saved ? JSON.parse(saved) : defaultVisibleColumns;
  });

  // Persist column visibility
  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Persist items per page
  useEffect(() => {
    localStorage.setItem(ITEMS_PER_PAGE_KEY, itemsPerPage.toString());
  }, [itemsPerPage]);

  // Pagination calculations
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Get visible column definitions
  const visibleColumnDefs = allColumns.filter((col) => visibleColumns.includes(col.id));

  // Selection handlers
  const isAllSelected = paginatedBookings.length > 0 && paginatedBookings.every((b) => selectedIds.has(b.id));
  const isSomeSelected = paginatedBookings.some((b) => selectedIds.has(b.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(selectedIds);
      paginatedBookings.forEach((b) => newSelected.add(b.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      paginatedBookings.forEach((b) => newSelected.delete(b.id));
      setSelectedIds(newSelected);
    }
  };

  const handleSelectOne = (bookingId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(bookingId);
    } else {
      newSelected.delete(bookingId);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Column visibility toggle
  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibleColumns);
  };

  // Export functionality
  const generateCSV = (bookings: ReportingBooking[]) => {
    const headers = visibleColumnDefs.map((col) => col.label);
    const rows = bookings.map((booking) =>
      visibleColumnDefs.map((col) => {
        const value = col.accessor(booking);
        // Escape commas and quotes
        const strValue = String(value);
        if (strValue.includes(",") || strValue.includes('"')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      })
    );

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    return csv;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = (exportFormat: "csv" | "excel") => {
    const timestamp = formatDate(new Date(), "yyyy-MM-dd_HH-mm");
    const filename = `bookings_export_${timestamp}.csv`;
    const csv = generateCSV(filteredBookings);
    downloadFile(csv, filename, "text/csv;charset=utf-8;");
    toast({
      title: "Export Complete",
      description: `Exported ${filteredBookings.length} bookings to ${filename}`,
    });
  };

  const handleBulkExport = () => {
    const selectedBookings = filteredBookings.filter((b) => selectedIds.has(b.id));
    const timestamp = formatDate(new Date(), "yyyy-MM-dd_HH-mm");
    const filename = `bookings_selected_${timestamp}.csv`;
    const csv = generateCSV(selectedBookings);
    downloadFile(csv, filename, "text/csv;charset=utf-8;");
    toast({
      title: "Export Complete",
      description: `Exported ${selectedBookings.length} selected bookings`,
    });
    clearSelection();
  };

  const handleBulkDownloadConfirmations = () => {
    const count = selectedIds.size;
    toast({
      title: "Downloading Confirmations",
      description: `Preparing ${count} confirmation documents...`,
    });
    // In real implementation, this would trigger PDF generation for each booking
    clearSelection();
  };

  const handleBulkCancel = () => {
    const cancellableIds = Array.from(selectedIds).filter((id) => {
      const booking = filteredBookings.find((b) => b.id === id);
      return booking && booking.status !== "cancelled";
    });
    
    if (cancellableIds.length === 0) {
      toast({
        title: "No Cancellable Bookings",
        description: "All selected bookings are already cancelled.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Cancellation Requested",
      description: `${cancellableIds.length} bookings will be cancelled. This action requires confirmation.`,
      variant: "destructive",
    });
    clearSelection();
  };

  const handleRowClick = (booking: ReportingBooking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <ReportingLayout title="Bookings" description="View and manage all hotel bookings">
      <ReportingFilterToolbar
        filters={filters}
        onFiltersChange={setFilters}
        savedViews={mockSavedViews}
        onExport={handleExport}
        userRole="admin"
      />

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="mt-4 flex items-center gap-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} booking{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <FileDownIcon className="w-4 h-4 mr-2" />
            Export Selected
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkDownloadConfirmations}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download Confirmations
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkCancel}>
            <XCircleIcon className="w-4 h-4 mr-2" />
            Cancel Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {/* Column Visibility & Table Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{endIndex} of {totalItems} bookings
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon className="w-4 h-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allColumns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={visibleColumns.includes(col.id)}
                  onCheckedChange={() => toggleColumn(col.id)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetColumns}>
                Reset to Default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-2 border rounded-lg bg-card p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2Icon className="w-5 h-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading bookings...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="mt-2 border border-destructive/20 rounded-lg bg-destructive/5 p-8">
          <div className="text-center">
            <p className="text-destructive font-medium">Failed to load bookings</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="mt-2 border rounded-lg bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className={isSomeSelected && !isAllSelected ? "opacity-50" : ""}
                  />
                </TableHead>
                {visibleColumnDefs.map((col) => (
                  <TableHead 
                    key={col.id} 
                    className={`font-semibold ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.label}
                  </TableHead>
                ))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  className={`cursor-pointer ${selectedIds.has(booking.id) ? "bg-primary/5" : ""}`}
                  onClick={() => handleRowClick(booking)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(booking.id)}
                      onCheckedChange={(checked) => handleSelectOne(booking.id, !!checked)}
                      aria-label={`Select ${booking.id}`}
                    />
                  </TableCell>
                  {visibleColumnDefs.map((col) => (
                    <TableCell 
                      key={col.id} 
                      className={`${col.className || ""} ${col.align === "right" ? "text-right" : ""}`}
                    >
                      {col.render ? col.render(booking) : col.accessor(booking)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontalIcon className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(booking); }}>
                          <EyeIcon className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Download Confirmation
                        </DropdownMenuItem>
                        {booking.status !== "cancelled" && (
                          <DropdownMenuItem 
                            onClick={(e) => e.stopPropagation()}
                            className="text-destructive"
                          >
                            <XCircleIcon className="w-4 h-4 mr-2" />
                            Cancel Booking
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredBookings.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No bookings found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value, 10));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {getPageNumbers().map((page, idx) =>
                page === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <BookingDrawer
        booking={selectedBooking}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </ReportingLayout>
  );
}
