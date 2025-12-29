import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
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
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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

// Mock data
const mockDocuments: Document[] = [
  {
    id: "doc-001",
    type: "voucher",
    name: "Booking Voucher - Grand Hotel",
    orderId: "ORD-2024-001",
    hotelName: "Grand Hotel Vienna",
    guestName: "John Smith",
    generatedAt: "2024-01-15T10:30:00Z",
    status: "sent",
    fileSize: 245000,
    sentTo: "john.smith@email.com",
  },
  {
    id: "doc-002",
    type: "invoice",
    name: "Invoice #INV-2024-0156",
    orderId: "ORD-2024-001",
    hotelName: "Grand Hotel Vienna",
    guestName: "John Smith",
    generatedAt: "2024-01-15T10:31:00Z",
    status: "viewed",
    fileSize: 128000,
  },
  {
    id: "doc-003",
    type: "confirmation",
    name: "Booking Confirmation",
    orderId: "ORD-2024-002",
    hotelName: "Marriott Downtown",
    guestName: "Emma Johnson",
    generatedAt: "2024-01-14T14:20:00Z",
    status: "generated",
    fileSize: 312000,
  },
  {
    id: "doc-004",
    type: "receipt",
    name: "Payment Receipt",
    orderId: "ORD-2024-002",
    hotelName: "Marriott Downtown",
    guestName: "Emma Johnson",
    generatedAt: "2024-01-14T14:25:00Z",
    status: "sent",
    fileSize: 89000,
    sentTo: "emma.j@company.com",
  },
  {
    id: "doc-005",
    type: "voucher",
    name: "Booking Voucher - Hilton",
    orderId: "ORD-2024-003",
    hotelName: "Hilton Garden Inn",
    guestName: "Michael Brown",
    generatedAt: "2024-01-13T09:15:00Z",
    expiresAt: "2024-02-13T09:15:00Z",
    status: "expired",
    fileSize: 267000,
  },
  {
    id: "doc-006",
    type: "correspondence",
    name: "Special Request Confirmation",
    orderId: "ORD-2024-003",
    hotelName: "Hilton Garden Inn",
    guestName: "Michael Brown",
    generatedAt: "2024-01-13T09:20:00Z",
    status: "sent",
    fileSize: 45000,
    sentTo: "michael.b@email.com",
  },
  {
    id: "doc-007",
    type: "invoice",
    name: "Invoice #INV-2024-0157",
    orderId: "ORD-2024-004",
    hotelName: "Sheraton Plaza",
    guestName: "Sarah Davis",
    generatedAt: "2024-01-12T16:45:00Z",
    status: "generated",
    fileSize: 156000,
  },
  {
    id: "doc-008",
    type: "confirmation",
    name: "Booking Confirmation",
    orderId: "ORD-2024-005",
    hotelName: "Radisson Blue",
    guestName: "David Wilson",
    generatedAt: "2024-01-11T11:00:00Z",
    status: "viewed",
    fileSize: 298000,
  },
];

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

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let docs = [...mockDocuments];

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

  const handleBulkDownload = () => {
    toast.success(`Downloading ${selectedDocuments.size} documents...`);
    setSelectedDocuments(new Set());
  };

  const handleBulkDelete = () => {
    toast.success(`Deleted ${selectedDocuments.size} documents`);
    setSelectedDocuments(new Set());
  };

  const handleDownload = (doc: Document) => {
    toast.success(`Downloading ${doc.name}...`);
  };

  const handlePreview = (doc: Document) => {
    navigate(`/documents/${doc.id}`);
  };

  const handleDelete = (doc: Document) => {
    toast.success(`Deleted ${doc.name}`);
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
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
              <p className="text-muted-foreground">
                Manage vouchers, invoices, and booking documents
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                    <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents List/Grid */}
          {viewMode === "list" ? (
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
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="h-4 w-4 mr-2" />
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
          ) : (
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
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-destructive hover:text-destructive"
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
          )}

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
          {filteredDocuments.length === 0 && (
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
