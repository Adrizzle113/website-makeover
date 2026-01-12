import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  FileText,
  Download,
  Eye,
  MoreHorizontal,
  Trash2,
  Filter,
  Grid,
  List,
  Calendar,
  Building2,
  User,
  SortAsc,
  SortDesc,
  FolderOpen,
  Receipt,
  FileCheck,
  Mail,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { bookingApi } from "@/services/bookingApi";

// Document types
type DocumentType = "voucher" | "invoice" | "confirmation" | "receipt" | "correspondence";
type DocumentStatus = "generated" | "sent" | "viewed" | "expired";

interface Document {
  id: string;
  type: DocumentType;
  name: string;
  orderId: string;
  hotelName: string;
  guestName: string;
  generatedAt: string;
  expiresAt?: string;
  status: DocumentStatus;
  fileSize: number;
  sentTo?: string;
}

// Storage key for saved order IDs
const SAVED_ORDERS_KEY = "documents_order_ids";

// Helper to get saved order IDs
function getSavedOrderIds(): string[] {
  try {
    const saved = localStorage.getItem(SAVED_ORDERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Helper to save order IDs
function saveOrderIds(orderIds: string[]) {
  localStorage.setItem(SAVED_ORDERS_KEY, JSON.stringify(orderIds));
}

const documentTypeConfig: Record<DocumentType, { label: string; icon: typeof FileText; color: string }> = {
  voucher: { label: "Voucher", icon: FileCheck, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  invoice: { label: "Invoice", icon: Receipt, color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  confirmation: { label: "Confirmation", icon: FileText, color: "bg-green-500/10 text-green-600 border-green-200" },
  receipt: { label: "Receipt", icon: Receipt, color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  correspondence: { label: "Correspondence", icon: Mail, color: "bg-slate-500/10 text-slate-600 border-slate-200" },
};

const statusConfig: Record<DocumentStatus, { label: string; color: string }> = {
  generated: { label: "Generated", color: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", color: "bg-blue-500/10 text-blue-600" },
  viewed: { label: "Viewed", color: "bg-green-500/10 text-green-600" },
  expired: { label: "Expired", color: "bg-destructive/10 text-destructive" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortField, setSortField] = useState<"generatedAt" | "name" | "type">("generatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // API state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [savedOrderIds, setSavedOrderIds] = useState<string[]>([]);
  const [fetchingOrderId, setFetchingOrderId] = useState<string | null>(null);

  // Load saved order IDs on mount
  useEffect(() => {
    const saved = getSavedOrderIds();
    setSavedOrderIds(saved);
    
    // Auto-fetch documents for saved orders
    if (saved.length > 0) {
      fetchAllDocuments(saved);
    }
  }, []);

  // Fetch documents for a single order
  const fetchDocumentsForOrder = async (orderId: string): Promise<Document[]> => {
    try {
      const response = await bookingApi.getDocuments(orderId);
      const docs: Document[] = [];
      
      if (response.data?.documents) {
        for (const doc of response.data.documents) {
          docs.push({
            id: `${doc.type}-${orderId}`,
            type: doc.type as DocumentType || "voucher",
            name: doc.name || `${doc.type} - ${orderId}`,
            orderId: orderId,
            hotelName: "Hotel",
            guestName: "Guest",
            generatedAt: doc.created_at || new Date().toISOString(),
            status: "generated",
            fileSize: 100000,
          });
        }
      }
      
      // If no documents from API, create placeholder documents
      if (docs.length === 0) {
        docs.push({
          id: `voucher-${orderId}`,
          type: "voucher",
          name: `Booking Voucher - ${orderId}`,
          orderId: orderId,
          hotelName: "Hotel",
          guestName: "Guest",
          generatedAt: new Date().toISOString(),
          status: "generated",
          fileSize: 245000,
        });
        docs.push({
          id: `invoice-${orderId}`,
          type: "invoice",
          name: `Invoice - ${orderId}`,
          orderId: orderId,
          hotelName: "Hotel",
          guestName: "Guest",
          generatedAt: new Date().toISOString(),
          status: "generated",
          fileSize: 128000,
        });
      }
      
      return docs;
    } catch (err) {
      console.error(`Error fetching documents for order ${orderId}:`, err);
      // Return placeholder documents on error
      return [
        {
          id: `voucher-${orderId}`,
          type: "voucher",
          name: `Booking Voucher - ${orderId}`,
          orderId: orderId,
          hotelName: "Hotel",
          guestName: "Guest",
          generatedAt: new Date().toISOString(),
          status: "generated",
          fileSize: 245000,
        },
        {
          id: `invoice-${orderId}`,
          type: "invoice",
          name: `Invoice - ${orderId}`,
          orderId: orderId,
          hotelName: "Hotel",
          guestName: "Guest",
          generatedAt: new Date().toISOString(),
          status: "generated",
          fileSize: 128000,
        },
      ];
    }
  };

  // Fetch documents for all saved orders
  const fetchAllDocuments = async (orderIds: string[]) => {
    setIsLoading(true);
    try {
      const allDocs: Document[] = [];
      for (const orderId of orderIds) {
        const docs = await fetchDocumentsForOrder(orderId);
        allDocs.push(...docs);
      }
      setDocuments(allDocs);
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast.error("Failed to load some documents");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new order ID
  const handleAddOrderId = async () => {
    const orderId = orderIdInput.trim();
    if (!orderId) {
      toast.error("Please enter an order ID");
      return;
    }

    if (savedOrderIds.includes(orderId)) {
      toast.info("This order is already added");
      return;
    }

    setFetchingOrderId(orderId);
    try {
      const docs = await fetchDocumentsForOrder(orderId);
      
      // Save the order ID
      const newOrderIds = [...savedOrderIds, orderId];
      setSavedOrderIds(newOrderIds);
      saveOrderIds(newOrderIds);
      
      // Add documents
      setDocuments(prev => [...prev, ...docs]);
      setOrderIdInput("");
      toast.success(`Added documents for order ${orderId}`);
    } catch (err) {
      toast.error("Failed to fetch documents for this order");
    } finally {
      setFetchingOrderId(null);
    }
  };

  // Remove an order and its documents
  const handleRemoveOrder = (orderId: string) => {
    const newOrderIds = savedOrderIds.filter(id => id !== orderId);
    setSavedOrderIds(newOrderIds);
    saveOrderIds(newOrderIds);
    setDocuments(prev => prev.filter(doc => doc.orderId !== orderId));
    toast.success(`Removed order ${orderId}`);
  };

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let docs = [...documents];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.orderId.toLowerCase().includes(query) ||
          doc.hotelName.toLowerCase().includes(query) ||
          doc.guestName.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      docs = docs.filter((doc) => doc.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      docs = docs.filter((doc) => doc.status === statusFilter);
    }

    // Sort
    docs.sort((a, b) => {
      let comparison = 0;
      if (sortField === "generatedAt") {
        comparison = new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
      } else if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "type") {
        comparison = a.type.localeCompare(b.type);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return docs;
  }, [searchQuery, typeFilter, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(paginatedDocuments.map((d) => d.id)));
    } else {
      setSelectedDocuments(new Set());
    }
  };

  const handleSelectDocument = (docId: string, checked: boolean) => {
    const newSelected = new Set(selectedDocuments);
    if (checked) {
      newSelected.add(docId);
    } else {
      newSelected.delete(docId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleBulkDownload = async () => {
    setBulkDownloading(true);
    const selectedDocs = documents.filter(d => selectedDocuments.has(d.id));
    let successCount = 0;
    let errorCount = 0;

    for (const doc of selectedDocs) {
      try {
        await downloadDocument(doc, false);
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }

    setBulkDownloading(false);
    setSelectedDocuments(new Set());
    
    if (errorCount === 0) {
      toast.success(`Downloaded ${successCount} documents`);
    } else {
      toast.warning(`Downloaded ${successCount} documents, ${errorCount} failed`);
    }
  };

  const handleBulkDelete = () => {
    // Note: Document deletion is not supported by the API
    toast.info("Document deletion is not available");
  };

  const downloadDocument = async (doc: Document, showToast = true): Promise<void> => {
    try {
      let response;
      const orderId = doc.orderId;
      
      if (doc.type === "voucher") {
        response = await bookingApi.downloadVoucher(orderId);
      } else if (doc.type === "invoice") {
        response = await bookingApi.downloadInvoice(orderId);
      } else {
        // For confirmation and other types, try voucher as fallback
        response = await bookingApi.downloadVoucher(orderId);
      }

      if (response.data?.url) {
        const fileName = `${doc.type}-${orderId}.pdf`;
        bookingApi.triggerDownload(response.data.url, fileName);
        if (showToast) {
          toast.success(`Downloaded ${doc.name}`);
        }
      } else {
        throw new Error("No download URL received");
      }
    } catch (err) {
      console.error("Download error:", err);
      if (showToast) {
        toast.error(`Failed to download ${doc.name}`);
      }
      throw err;
    }
  };

  const handleDownload = async (doc: Document) => {
    setDownloadingDocId(doc.id);
    try {
      await downloadDocument(doc);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handlePreview = (doc: Document) => {
    navigate(`/documents/${doc.id}`);
  };

  const handleDelete = (doc: Document) => {
    toast.info("Document deletion is not available");
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = sortDirection === "asc" ? SortAsc : SortDesc;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
                <p className="text-muted-foreground">
                  Manage vouchers, invoices, and booking documents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAllDocuments(savedOrderIds)}
                disabled={isLoading || savedOrderIds.length === 0}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Add Order ID */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Input
                    placeholder="Enter Order ID to add documents..."
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddOrderId()}
                  />
                </div>
                <Button 
                  onClick={handleAddOrderId}
                  disabled={!!fetchingOrderId}
                >
                  {fetchingOrderId ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FolderOpen className="h-4 w-4 mr-2" />
                  )}
                  Add Order
                </Button>
              </div>
              {savedOrderIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {savedOrderIds.map((orderId) => (
                    <Badge 
                      key={orderId} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {orderId}
                      <button 
                        onClick={() => handleRemoveOrder(orderId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(documentTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedDocuments.size > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedDocuments.size} document(s) selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleBulkDownload}
                      disabled={bulkDownloading}
                    >
                      {bulkDownloading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium">Loading documents...</h3>
                <p className="text-muted-foreground mt-1">
                  Fetching your booking documents
                </p>
              </CardContent>
            </Card>
          )}

          {/* Documents List/Grid */}
          {!isLoading && viewMode === "list" ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          paginatedDocuments.length > 0 &&
                          paginatedDocuments.every((d) => selectedDocuments.has(d.id))
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort("type")}
                    >
                      <div className="flex items-center gap-2">
                        Type
                        {sortField === "type" && <SortIcon className="h-4 w-4" />}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        Document
                        {sortField === "name" && <SortIcon className="h-4 w-4" />}
                      </div>
                    </TableHead>
                    <TableHead>Order / Guest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort("generatedAt")}
                    >
                      <div className="flex items-center gap-2">
                        Generated
                        {sortField === "generatedAt" && <SortIcon className="h-4 w-4" />}
                      </div>
                    </TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDocuments.map((doc) => {
                    const typeConfig = documentTypeConfig[doc.type];
                    const TypeIcon = typeConfig.icon;
                    const status = statusConfig[doc.status];

                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedDocuments.has(doc.id)}
                            onCheckedChange={(checked) =>
                              handleSelectDocument(doc.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={typeConfig.color}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handlePreview(doc)}
                            className="font-medium text-primary hover:underline text-left"
                          >
                            {doc.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <FolderOpen className="h-3 w-3 text-muted-foreground" />
                              {doc.orderId}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              {doc.guestName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(doc.generatedAt), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePreview(doc)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownload(doc)}
                                disabled={downloadingDocId === doc.id}
                              >
                                {downloadingDocId === doc.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4 mr-2" />
                                )}
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(doc)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : !isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedDocuments.map((doc) => {
                const typeConfig = documentTypeConfig[doc.type];
                const TypeIcon = typeConfig.icon;
                const status = statusConfig[doc.status];

                return (
                  <Card
                    key={doc.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedDocuments.has(doc.id) ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-muted">
                          <TypeIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <Checkbox
                          checked={selectedDocuments.has(doc.id)}
                          onCheckedChange={(checked) =>
                            handleSelectDocument(doc.id, checked as boolean)
                          }
                        />
                      </div>
                      <div>
                        <button
                          onClick={() => handlePreview(doc)}
                          className="font-medium text-sm hover:text-primary line-clamp-2 text-left"
                        >
                          {doc.name}
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">{doc.orderId}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                          {typeConfig.label}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(doc.generatedAt), "MMM d, yyyy")}</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>
                      <div className="flex items-center gap-1 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handlePreview(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingDocId === doc.id}
                        >
                          {downloadingDocId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-muted-foreground"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredDocuments.length)} of{" "}
                {filteredDocuments.length} documents
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
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

          {/* Empty State */}
          {!isLoading && filteredDocuments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No documents found</h3>
                <p className="text-muted-foreground mt-1">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
