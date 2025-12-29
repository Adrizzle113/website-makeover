import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeftIcon,
  DownloadIcon,
  PrinterIcon,
  ExternalLinkIcon,
  FileTextIcon,
  CalendarIcon,
  InfoIcon
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PDFViewer } from "@/components/documents";
import { OrderDocument, DocumentType } from "@/types/trips";

// Mock document data
const mockDocument: OrderDocument & { 
  content?: string;
  metadata: {
    orderId: string;
    tripId: string;
    hotelName: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
  }
} = {
  id: "doc_001",
  orderId: "ord_001",
  tripId: "og_12345",
  type: "voucher",
  name: "Booking Voucher - Soneva Fushi Resort",
  url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
  generatedAt: "2024-12-10T10:32:00Z",
  fileSize: 245000,
  metadata: {
    orderId: "ord_001",
    tripId: "og_12345",
    hotelName: "Soneva Fushi Resort",
    guestName: "John Smith",
    checkIn: "2025-01-15",
    checkOut: "2025-01-19"
  }
};

const documentTypeLabels: Record<DocumentType, string> = {
  voucher: "Booking Voucher",
  confirmation: "Booking Confirmation",
  invoice: "Invoice",
  receipt: "Payment Receipt"
};

const documentTypeColors: Record<DocumentType, string> = {
  voucher: "bg-red-500/10 text-red-600 border-red-500/20",
  confirmation: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  invoice: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  receipt: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
};

export default function DocumentsViewerPage() {
  const { documentId } = useParams();
  const [document] = useState(mockDocument);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          {/* Back Link */}
          <Link 
            to={`/orders/${document.orderId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Order
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* PDF Viewer */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <FileTextIcon className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h1 className="font-medium text-foreground">{document.name}</h1>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(document.fileSize)} • PDF
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <PrinterIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Print</span>
                    </Button>
                    <Button size="sm" className="gap-2">
                      <DownloadIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </div>
                </div>

                {/* PDF Viewer */}
                <div className="min-h-[700px] relative">
                  <PDFViewer 
                    url={document.url}
                    onLoadSuccess={(numPages) => console.log(`Loaded ${numPages} pages`)}
                    onLoadError={(error) => console.error("PDF load error:", error)}
                  />
                </div>
              </Card>
            </div>

            {/* Document Info Sidebar */}
            <div className="space-y-6">
              {/* Document Metadata */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Document Type
                    </p>
                    <Badge 
                      variant="outline" 
                      className={documentTypeColors[document.type]}
                    >
                      {documentTypeLabels[document.type]}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Generated
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(document.generatedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Document ID
                    </p>
                    <p className="text-sm font-mono text-foreground">
                      {document.id}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Related Info */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                    Related To
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hotel</p>
                      <p className="text-sm font-medium text-foreground">
                        {document.metadata.hotelName}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Guest</p>
                      <p className="text-sm font-medium text-foreground">
                        {document.metadata.guestName}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Stay Dates</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatDate(document.metadata.checkIn)} - {formatDate(document.metadata.checkOut)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Quick Links
                  </p>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 h-auto py-2"
                    asChild
                  >
                    <Link to={`/orders/${document.orderId}`}>
                      <CalendarIcon className="w-4 h-4" />
                      <span>View Order</span>
                      <ExternalLinkIcon className="w-3 h-3 ml-auto" />
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 h-auto py-2"
                    asChild
                  >
                    <Link to={`/trips/${document.tripId}`}>
                      <InfoIcon className="w-4 h-4" />
                      <span>View Trip</span>
                      <ExternalLinkIcon className="w-3 h-3 ml-auto" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
