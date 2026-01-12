import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeftIcon,
  CalendarIcon, 
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  CreditCardIcon,
  ClockIcon,
  FileTextIcon,
  DownloadIcon,
  ExternalLinkIcon,
  StarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  HotelIcon,
  RefreshCwIcon,
  SendIcon,
  XCircleIcon,
  DollarSignIcon,
  PlusIcon,
  MessageSquareIcon,
  BedDoubleIcon,
  UtensilsIcon,
  CopyIcon,
  PrinterIcon,
  InfoIcon,
  SparklesIcon,
  ShieldCheckIcon,
  Loader2Icon,
  ReceiptIcon,
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Order, OrderStatus, OrderTimelineEvent, OrderEventType, OrderEventSource } from "@/types/trips";
import { toast } from "sonner";
import { bookingApi } from "@/services/bookingApi";
import { CancellationModal } from "@/components/booking/CancellationModal";

// Mock data
const mockOrder: Order & {
  confirmationNumber?: string;
  supplierReference?: string;
  mealPlan?: string;
  specialRequests?: string[];
  roomDetails?: {
    bedType: string;
    view: string;
    size: string;
    amenities: string[];
  };
  priceBreakdown?: {
    roomRate: number;
    taxes: number;
    fees: number;
    discount?: number;
  };
} = {
  id: "ord_001",
  tripId: "og_12345",
  hotelName: "Soneva Fushi Resort",
  hotelAddress: "Kunfunadhoo Island, Baa Atoll, Maldives",
  hotelStars: 5,
  city: "Baa Atoll",
  country: "Maldives",
  checkIn: "2025-01-15",
  checkOut: "2025-01-19",
  nights: 4,
  roomType: "Beach Villa with Pool",
  roomCount: 1,
  occupancy: { adults: 2, children: 0 },
  leadGuest: {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "+1 555-0123"
  },
  paymentType: "now",
  status: "confirmed",
  cancellationPolicy: "Free cancellation until January 10, 2025 at 23:59 UTC. After this date, cancellation will incur a fee of 100% of the booking total.",
  cancellationDeadline: "2025-01-10T23:59:00Z",
  totalAmount: 2800,
  currency: "USD",
  createdAt: "2024-12-10T10:30:00Z",
  confirmedAt: "2024-12-10T10:32:00Z",
  confirmationNumber: "SNV-2025-78432",
  supplierReference: "ETG-ORD-98234",
  mealPlan: "Breakfast Included",
  specialRequests: [
    "Late check-out requested (2 PM)",
    "Honeymoon celebration - anniversary cake",
    "Non-smoking room preferred"
  ],
  roomDetails: {
    bedType: "King Size Bed",
    view: "Ocean View",
    size: "120 sqm",
    amenities: ["Private Pool", "Outdoor Shower", "Mini Bar", "Espresso Machine", "Butler Service"]
  },
  priceBreakdown: {
    roomRate: 2400,
    taxes: 288,
    fees: 112,
    discount: 0
  },
  documents: [
    {
      id: "doc_001",
      orderId: "ord_001",
      tripId: "og_12345",
      type: "voucher",
      name: "Booking Voucher",
      url: "/documents/doc_001",
      generatedAt: "2024-12-10T10:32:00Z",
      fileSize: 245000
    },
    {
      id: "doc_002",
      orderId: "ord_001",
      tripId: "og_12345",
      type: "confirmation",
      name: "Booking Confirmation",
      url: "/documents/doc_002",
      generatedAt: "2024-12-10T10:32:00Z",
      fileSize: 189000
    },
    {
      id: "doc_003",
      orderId: "ord_001",
      tripId: "og_12345",
      type: "invoice",
      name: "Invoice",
      url: "/documents/doc_003",
      generatedAt: "2024-12-10T10:32:00Z",
      fileSize: 156000
    }
  ]
};

const mockTimeline: OrderTimelineEvent[] = [
  {
    id: "evt_006",
    orderId: "ord_001",
    type: "documents_resent",
    source: "AGENT",
    actorName: "John Doe",
    message: "Agent resent confirmation to guest",
    timestamp: "2025-01-06T09:12:00Z"
  },
  {
    id: "evt_005",
    orderId: "ord_001",
    type: "synced",
    source: "SYSTEM",
    message: "Order synced with supplier",
    timestamp: "2025-01-05T16:00:00Z"
  },
  {
    id: "evt_004",
    orderId: "ord_001",
    type: "documents_issued",
    source: "SYSTEM",
    message: "Booking voucher generated",
    timestamp: "2025-01-05T14:35:00Z"
  },
  {
    id: "evt_003",
    orderId: "ord_001",
    type: "confirmed",
    source: "SUPPLIER",
    message: "Supplier confirmed the booking",
    timestamp: "2025-01-05T14:32:00Z"
  },
  {
    id: "evt_002",
    orderId: "ord_001",
    type: "paid",
    source: "SYSTEM",
    message: "USD 2,800 charged successfully",
    timestamp: "2025-01-05T14:31:00Z"
  },
  {
    id: "evt_001",
    orderId: "ord_001",
    type: "booked",
    source: "SYSTEM",
    message: "Booking created by agent",
    timestamp: "2025-01-05T14:30:00Z"
  }
];

const statusColors: Record<OrderStatus, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const paymentTypeLabels: Record<string, string> = {
  now: "Paid in Full",
  deposit: "Deposit Paid",
  pay_at_hotel: "Pay at Hotel"
};

const eventConfig: Record<OrderEventType, { icon: React.ElementType; label: string; color: string }> = {
  booked: { icon: PlusIcon, label: "Booked", color: "text-blue-500 bg-blue-500/10" },
  payment_authorized: { icon: CreditCardIcon, label: "Payment Authorized", color: "text-amber-500 bg-amber-500/10" },
  paid: { icon: DollarSignIcon, label: "Paid in Full", color: "text-emerald-500 bg-emerald-500/10" },
  confirmed: { icon: CheckCircleIcon, label: "Confirmed", color: "text-emerald-500 bg-emerald-500/10" },
  documents_issued: { icon: FileTextIcon, label: "Documents Issued", color: "text-blue-500 bg-blue-500/10" },
  documents_resent: { icon: SendIcon, label: "Documents Resent", color: "text-purple-500 bg-purple-500/10" },
  cancellation_requested: { icon: AlertCircleIcon, label: "Cancellation Requested", color: "text-amber-500 bg-amber-500/10" },
  cancelled: { icon: XCircleIcon, label: "Cancelled", color: "text-red-500 bg-red-500/10" },
  refunded: { icon: DollarSignIcon, label: "Refunded", color: "text-emerald-500 bg-emerald-500/10" },
  synced: { icon: RefreshCwIcon, label: "Order Synced", color: "text-muted-foreground bg-muted" },
  agent_note: { icon: MessageSquareIcon, label: "Agent Note", color: "text-primary bg-primary/10" },
};

const sourceLabels: Record<OrderEventSource, string> = {
  SYSTEM: "System",
  SUPPLIER: "Supplier",
  AGENT: "Agent"
};

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(mockOrder);
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>(mockTimeline);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const newEvent: OrderTimelineEvent = {
      id: `evt_${Date.now()}`,
      orderId: order.id,
      type: "agent_note",
      source: "AGENT",
      actorName: "Current Agent", // Would come from auth context
      message: newNote.trim(),
      timestamp: new Date().toISOString()
    };
    
    setTimeline([newEvent, ...timeline]);
    setNewNote("");
    setIsAddingNote(false);
    toast.success("Note added to timeline");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
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

  const formatTimelineDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getDaysUntilCancellation = () => {
    if (!order.cancellationDeadline) return null;
    const now = new Date();
    const deadline = new Date(order.cancellationDeadline);
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysUntilCancellation = getDaysUntilCancellation();

  const handleDownloadDocument = async (docType: "voucher" | "invoice" | "single_act", docName: string) => {
    setIsDownloading(docType);
    try {
      let response;
      switch (docType) {
        case "voucher":
          response = await bookingApi.downloadVoucher(order.id);
          break;
        case "invoice":
          response = await bookingApi.downloadInvoice(order.id);
          break;
        case "single_act":
          response = await bookingApi.downloadSingleAct(order.id);
          break;
      }
      
      if (response.status === "ok" && response.data.url) {
        bookingApi.triggerDownload(response.data.url, response.data.file_name);
        toast.success(`${docName} downloaded successfully`);
      } else {
        toast.error(response.error?.message || "Failed to download document");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download document");
    } finally {
      setIsDownloading(null);
    }
  };

  const handleCancellationComplete = (result: { success: boolean; refundAmount?: number; message?: string }) => {
    if (result.success) {
      // Update order status locally
      setOrder(prev => ({ ...prev, status: "cancelled" as OrderStatus }));
      // Add cancellation event to timeline
      const cancelEvent: OrderTimelineEvent = {
        id: `evt_${Date.now()}`,
        orderId: order.id,
        type: "cancelled",
        source: "AGENT",
        actorName: "Current Agent",
        message: result.refundAmount 
          ? `Booking cancelled. Refund: ${order.currency} ${result.refundAmount.toLocaleString()}`
          : "Booking cancelled",
        timestamp: new Date().toISOString()
      };
      setTimeline([cancelEvent, ...timeline]);
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: count }, (_, i) => (
      <StarIcon key={i} className="w-4 h-4 fill-sidebar-gold text-sidebar-gold" />
    ));
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "confirmed":
        return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
      case "cancelled":
        return <AlertCircleIcon className="w-4 h-4 text-red-500" />;
      case "document_generated":
        return <FileTextIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          {/* Back Link */}
          <Link 
            to={`/trips/${order.tripId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Trip
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${statusColors[order.status]}`}
                        >
                          {order.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Order #{order.id}
                        </span>
                      </div>
                      <h1 className="font-heading text-heading-md text-foreground mb-2">
                        {order.hotelName}
                      </h1>
                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(order.hotelStars)}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{order.hotelAddress}</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                      <HotelIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Confirmation Numbers */}
                  {(order.confirmationNumber || order.supplierReference) && (
                    <div className="flex flex-wrap gap-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg mb-4">
                      {order.confirmationNumber && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Confirmation #:</span>
                          <code className="text-sm font-mono font-medium text-foreground bg-background px-2 py-0.5 rounded">
                            {order.confirmationNumber}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(order.confirmationNumber!, "Confirmation number")}
                          >
                            <CopyIcon className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      {order.supplierReference && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Supplier Ref:</span>
                          <code className="text-sm font-mono font-medium text-foreground bg-background px-2 py-0.5 rounded">
                            {order.supplierReference}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(order.supplierReference!, "Supplier reference")}
                          >
                            <CopyIcon className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Check-in</p>
                      <p className="font-medium text-foreground">{formatDate(order.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Check-out</p>
                      <p className="font-medium text-foreground">{formatDate(order.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Duration</p>
                      <p className="font-medium text-foreground">{order.nights} night{order.nights !== 1 ? "s" : ""}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Room</p>
                      <p className="font-medium text-foreground">{order.roomType}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Guest */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserIcon className="w-5 h-5" />
                    Lead Guest Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {order.leadGuest.firstName} {order.leadGuest.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">Lead Guest</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MailIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{order.leadGuest.email}</span>
                    </div>
                    {order.leadGuest.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                        <span>{order.leadGuest.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-1">Occupancy</p>
                    <p className="text-sm">
                      {order.occupancy.adults} adult{order.occupancy.adults !== 1 ? "s" : ""}
                      {order.occupancy.children > 0 && `, ${order.occupancy.children} child${order.occupancy.children !== 1 ? "ren" : ""}`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Room Details */}
              {order.roomDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BedDoubleIcon className="w-5 h-5" />
                      Room Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Room Type</p>
                        <p className="font-medium text-foreground">{order.roomType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Bed Type</p>
                        <p className="font-medium text-foreground">{order.roomDetails.bedType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">View</p>
                        <p className="font-medium text-foreground">{order.roomDetails.view}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Room Size</p>
                        <p className="font-medium text-foreground">{order.roomDetails.size}</p>
                      </div>
                      {order.mealPlan && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            <UtensilsIcon className="w-3 h-3" />
                            Meal Plan
                          </p>
                          <p className="font-medium text-foreground">{order.mealPlan}</p>
                        </div>
                      )}
                    </div>
                    
                    {order.roomDetails.amenities.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Room Amenities</p>
                        <div className="flex flex-wrap gap-2">
                          {order.roomDetails.amenities.map((amenity, index) => (
                            <Badge key={index} variant="secondary" className="font-normal">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Special Requests */}
              {order.specialRequests && order.specialRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <SparklesIcon className="w-5 h-5" />
                      Special Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {order.specialRequests.map((request, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-foreground">{request}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Payment & Cancellation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCardIcon className="w-5 h-5" />
                    Payment & Cancellation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price Breakdown */}
                  {order.priceBreakdown && (
                    <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Room Rate ({order.nights} nights)</span>
                        <span className="text-foreground">{order.currency} {order.priceBreakdown.roomRate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxes</span>
                        <span className="text-foreground">{order.currency} {order.priceBreakdown.taxes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fees</span>
                        <span className="text-foreground">{order.currency} {order.priceBreakdown.fees.toLocaleString()}</span>
                      </div>
                      {order.priceBreakdown.discount && order.priceBreakdown.discount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>Discount</span>
                          <span>-{order.currency} {order.priceBreakdown.discount.toLocaleString()}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span className="text-foreground">Total</span>
                        <span className="font-heading text-lg text-foreground">{order.currency} {order.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                      <div>
                        <p className="font-medium text-foreground">{paymentTypeLabels[order.paymentType]}</p>
                        <p className="text-xs text-muted-foreground">Payment processed successfully</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cancellation Policy with countdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Cancellation Policy</p>
                      {daysUntilCancellation !== null && daysUntilCancellation > 0 && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                          {daysUntilCancellation} days left for free cancellation
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{order.cancellationPolicy}</p>
                    {daysUntilCancellation !== null && daysUntilCancellation > 0 && daysUntilCancellation <= 30 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Time remaining</span>
                          <span>{daysUntilCancellation} of 30 days</span>
                        </div>
                        <Progress value={(daysUntilCancellation / 30) * 100} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClockIcon className="w-5 h-5" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Note Section */}
                  {isAddingNote ? (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                      <Textarea
                        placeholder="Add an internal note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setIsAddingNote(false);
                            setNewNote("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                        >
                          Add Note
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setIsAddingNote(true)}
                    >
                      <MessageSquareIcon className="w-4 h-4" />
                      Add internal note
                    </Button>
                  )}

                  {/* Timeline Events */}
                  <div className="space-y-1">
                    {timeline.map((event, index) => {
                      const config = eventConfig[event.type];
                      const Icon = config.icon;
                      const { date, time } = formatTimelineDate(event.timestamp);
                      
                      return (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${config.color.split(' ')[1]}`}>
                              <Icon className={`w-4 h-4 ${config.color.split(' ')[0]}`} />
                            </div>
                            {index < timeline.length - 1 && (
                              <div className="w-px flex-1 bg-border min-h-[24px]" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-foreground text-sm">
                                  {config.label}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {event.message}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className={`font-medium ${
                                event.source === "SUPPLIER" ? "text-emerald-600" :
                                event.source === "AGENT" ? "text-purple-600" :
                                "text-muted-foreground"
                              }`}>
                                {event.actorName ? `${sourceLabels[event.source]}: ${event.actorName}` : sourceLabels[event.source]}
                              </span>
                              <span className="mx-1.5">•</span>
                              {date} – {time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileTextIcon className="w-5 h-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <FileTextIcon className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.fileSize)} • PDF
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={doc.url}>
                            <ExternalLinkIcon className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <DownloadIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full mt-2" asChild>
                    <Link to={`/orders/${order.id}/documents`}>
                      View All Documents
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => handleDownloadDocument("voucher", "Voucher")}
                    disabled={isDownloading === "voucher"}
                  >
                    {isDownloading === "voucher" ? (
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                    ) : (
                      <DownloadIcon className="w-4 h-4" />
                    )}
                    Download Voucher
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => handleDownloadDocument("invoice", "Invoice")}
                    disabled={isDownloading === "invoice"}
                  >
                    {isDownloading === "invoice" ? (
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                    ) : (
                      <ReceiptIcon className="w-4 h-4" />
                    )}
                    Download Invoice
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <MailIcon className="w-4 h-4" />
                    Email to Guest
                  </Button>
                  {order.status !== "cancelled" && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                      onClick={() => setShowCancellationModal(true)}
                    >
                      <AlertCircleIcon className="w-4 h-4" />
                      Request Cancellation
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Trip Reference */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Part of Trip</p>
                  <Link 
                    to={`/trips/${order.tripId}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{order.tripId}</span>
                    </div>
                    <ExternalLinkIcon className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Cancellation Modal */}
      <CancellationModal
        open={showCancellationModal}
        onOpenChange={setShowCancellationModal}
        orderId={order.id}
        hotelName={order.hotelName}
        checkIn={order.checkIn}
        checkOut={order.checkOut}
        totalAmount={order.totalAmount}
        currency={order.currency}
        cancellationPolicy={order.cancellationPolicy}
        cancellationDeadline={order.cancellationDeadline}
        onCancellationComplete={handleCancellationComplete}
      />
    </SidebarProvider>
  );
}
