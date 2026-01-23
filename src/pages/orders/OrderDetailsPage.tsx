import { useState, useEffect, useCallback } from "react";
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
  ChevronDownIcon,
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Order, OrderStatus, OrderTimelineEvent, OrderEventType, OrderEventSource } from "@/types/trips";
import { toast } from "sonner";
import { bookingApi } from "@/services/bookingApi";
import { CancellationModal } from "@/components/booking/CancellationModal";
import { Skeleton } from "@/components/ui/skeleton";
import { saveBookingToDatabase, isUserAuthenticated, getBookingByOrderId } from "@/lib/bookingStorage";
import { openCustomVoucher, VoucherData } from "@/components/booking/CustomVoucher";
import { supabase } from "@/integrations/supabase/client";

// Extended Order type with additional details
interface ExtendedOrder extends Order {
  partnerOrderId?: string; // Our internal booking ID (for voucher download)
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
  // Additional voucher data extracted from API
  voucherData?: {
    includedFees?: Array<{
      name: string;
      amount: string;
      currency?: string;
    }>;
    notIncludedFees?: Array<{
      name: string;
      amount: string;
      currency?: string;
    }>;
    deposits?: string[];
    depositInfo?: string;
    cancellationPolicyText?: string;
    freeCancellationBefore?: string;
    checkInTime?: string;
    checkOutTime?: string;
    bedding?: string;
    hasBreakfast?: boolean;
    noChildMeal?: boolean;
    adultsCount?: number;
    childrenCount?: number;
    latitude?: number;
    longitude?: number;
  };
}

const statusColors: Record<OrderStatus, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const paymentTypeLabels: Record<string, string> = {
  now: "Paid in Full",
  now_net: "Paid in Full (Net)",
  now_gross: "Paid in Full (Gross)",
  deposit: "Deposit Paid",
  hotel: "Pay at Hotel",
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

// Map API order status to our OrderStatus type
function mapApiStatus(apiStatus: string): OrderStatus {
  switch (apiStatus) {
    case "confirmed":
      return "confirmed";
    case "cancelled":
      return "cancelled";
    case "failed":
      return "cancelled";
    case "processing":
    case "prebooked":
    case "idle":
      return "pending";
    default:
      return "pending";
  }
}

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ExtendedOrder | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hotelImage, setHotelImage] = useState<string | null>(null);

  // Fetch order data from API
  const fetchOrderData = useCallback(async () => {
    if (!orderId) {
      setError("No order ID provided");
      setIsLoading(false);
      return;
    }

    try {
      // Fetch order info and status in parallel
      // Use direct WorldOTA call for order info (works with ETG order_id)
      // Status call may fail for ETG order_id (expects partner_order_id), so we catch it
      const [orderInfoResponse, orderStatusResponse] = await Promise.all([
        bookingApi.getOrderInfoDirect(orderId),
        bookingApi.getOrderStatus(orderId).catch(() => ({ status: "error" as const, data: null }))
      ]);

      if (orderInfoResponse.status !== "ok" || !orderInfoResponse.data) {
        throw new Error(orderInfoResponse.error?.message || "Failed to fetch order details");
      }

      const apiData = orderInfoResponse.data;
      const statusData = orderStatusResponse.data;

      // Calculate nights
      const checkInDate = new Date(apiData.dates.check_in);
      const checkOutDate = new Date(apiData.dates.check_out);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

      // Build order object from API response
      const orderData: ExtendedOrder = {
        id: apiData.order_id,
        partnerOrderId: apiData.partner_order_id, // Store partner_order_id for voucher download
        tripId: apiData.order_group_id || apiData.order_id,
        hotelName: apiData.hotel.name,
        hotelAddress: apiData.hotel.address,
        hotelStars: apiData.hotel.star_rating || 4,
        city: apiData.hotel.city,
        country: apiData.hotel.country,
        checkIn: apiData.dates.check_in,
        checkOut: apiData.dates.check_out,
        nights: nights,
        roomType: apiData.room.name,
        roomCount: 1,
        occupancy: { 
          adults: apiData.room.guests?.filter(g => !g.is_child).length || 2, 
          children: apiData.room.guests?.filter(g => g.is_child).length || 0 
        },
        leadGuest: {
          firstName: apiData.lead_guest.first_name,
          lastName: apiData.lead_guest.last_name,
          email: apiData.lead_guest.email || "",
          phone: apiData.lead_guest.phone
        },
        paymentType: apiData.payment.type === "hotel" ? "pay_at_hotel" : 
          (apiData.payment.type === "now_net" || apiData.payment.type === "now_gross") ? "now" : 
          apiData.payment.type as "now" | "deposit" | "pay_at_hotel",
        status: mapApiStatus(apiData.status),
        cancellationPolicy: apiData.cancellation_policy || "Please check with the hotel for cancellation terms.",
        cancellationDeadline: statusData?.cancellation_info?.free_cancellation_before,
        totalAmount: parseFloat(apiData.price.amount),
        currency: apiData.price.currency_code,
        createdAt: apiData.created_at,
        confirmedAt: apiData.status === "confirmed" ? apiData.updated_at : undefined,
        confirmationNumber: statusData?.confirmation_number || apiData.confirmation_number,
        supplierReference: statusData?.supplier_confirmation,
        mealPlan: apiData.room.meal_plan,
        documents: [],
        // Store voucher-specific data from API
        voucherData: {
          includedFees: apiData.taxes_included?.map((f: any) => ({
            name: f.name,
            amount: String(f.amount),
            currency: f.currency,
          })),
          notIncludedFees: apiData.taxes_not_included?.map((f: any) => ({
            name: f.name,
            amount: String(f.amount),
            currency: f.currency,
          })),
          deposits: apiData.deposits,
          depositInfo: apiData.deposit_info,
          cancellationPolicyText: apiData.cancellation_policy_text,
          freeCancellationBefore: apiData.free_cancellation_before,
          checkInTime: apiData.hotel?.check_in_time,
          checkOutTime: apiData.hotel?.check_out_time,
          bedding: apiData.room?.bedding_name,
          hasBreakfast: apiData.room?.has_breakfast,
          noChildMeal: apiData.room?.no_child_meal,
          adultsCount: apiData.guest_counts?.adults,
          childrenCount: apiData.guest_counts?.children,
          latitude: apiData.hotel?.latitude,
          longitude: apiData.hotel?.longitude,
        },
      };

      setOrder(orderData);

      // Build timeline from order data
      const timelineEvents: OrderTimelineEvent[] = [];

      // Add booking created event
      timelineEvents.push({
        id: `evt_created_${orderData.id}`,
        orderId: orderData.id,
        type: "booked",
        source: "SYSTEM",
        message: "Booking created",
        timestamp: orderData.createdAt
      });

      // Add confirmed event if confirmed
      if (orderData.status === "confirmed" && orderData.confirmedAt) {
        timelineEvents.push({
          id: `evt_confirmed_${orderData.id}`,
          orderId: orderData.id,
          type: "confirmed",
          source: "SUPPLIER",
          message: `Booking confirmed. Confirmation #: ${orderData.confirmationNumber || "N/A"}`,
          timestamp: orderData.confirmedAt
        });
      }

      // Add cancelled event if cancelled
      if (orderData.status === "cancelled") {
        timelineEvents.push({
          id: `evt_cancelled_${orderData.id}`,
          orderId: orderData.id,
          type: "cancelled",
          source: "SYSTEM",
          message: "Booking cancelled",
          timestamp: apiData.updated_at
        });
      }

      // Sort timeline by timestamp descending (newest first)
      timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setTimeline(timelineEvents);
      setError(null);

      // Fetch hotel image from user_bookings
      let fetchedHotelImage: string | null = null;
      try {
        const { data: bookingData } = await supabase
          .from('user_bookings')
          .select('hotel_image')
          .eq('order_id', orderId)
          .maybeSingle();
        
        if (bookingData?.hotel_image) {
          fetchedHotelImage = bookingData.hotel_image;
          setHotelImage(fetchedHotelImage);
        }
      } catch (imgErr) {
        console.log('Could not fetch hotel image:', imgErr);
      }

      // Fetch hotel info for deposits and policies
      const hotelHid = apiData._raw?.hotel_data?.hid;
      let hotelDeposits: string[] = [];
      let hotelPhone: string | undefined;
      let hotelCheckInTime: string | undefined;
      let hotelCheckOutTime: string | undefined;
      
      if (hotelHid) {
        try {
          console.log(`📚 Fetching hotel info for hid: ${hotelHid}`);
          const hotelInfoResponse = await supabase.functions.invoke("worldota-hotel-info", {
            body: { hid: hotelHid, language: "en" }
          });
          
          if (hotelInfoResponse.data?.success) {
            const hotelData = hotelInfoResponse.data.hotel;
            hotelDeposits = hotelData.deposits || [];
            hotelPhone = hotelData.phone;
            hotelCheckInTime = hotelData.check_in_time;
            hotelCheckOutTime = hotelData.check_out_time;
            console.log(`✅ Hotel info fetched: ${hotelDeposits.length} deposits found`);
          }
        } catch (hotelErr) {
          console.log('Could not fetch hotel info:', hotelErr);
        }
      }

      // Update order with hotel info data
      orderData.voucherData = {
        ...orderData.voucherData,
        deposits: hotelDeposits.length > 0 ? hotelDeposits : orderData.voucherData?.deposits,
        checkInTime: hotelCheckInTime || orderData.voucherData?.checkInTime,
        checkOutTime: hotelCheckOutTime || orderData.voucherData?.checkOutTime,
      };

      setOrder(orderData);

      // ✅ Fallback: Check if booking is in database, if not save it
      if (orderData.status === "confirmed" || orderData.status === "completed") {
        (async () => {
          const isAuth = await isUserAuthenticated();
          if (!isAuth) return;
          
          const existing = await getBookingByOrderId(orderId);
          if (!existing) {
            console.log("📦 Booking not in database, saving now...");
            try {
              const result = await saveBookingToDatabase(orderId);
              if (result.success) {
                console.log("✅ Booking saved to database from OrderDetailsPage");
              }
            } catch (err) {
              console.warn("Could not save booking:", err);
            }
          }
        })();
      }

    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError(err instanceof Error ? err.message : "Failed to load order details");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  // Initial load
  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrderData();
    toast.success("Order data refreshed");
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !order) return;
    
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
    if (!order?.cancellationDeadline) return null;
    const now = new Date();
    const deadline = new Date(order.cancellationDeadline);
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysUntilCancellation = order ? getDaysUntilCancellation() : null;

  const handleDownloadDocument = async (docType: "voucher" | "invoice" | "single_act", docName: string) => {
    if (!order) return;
    setIsDownloading(docType);
    try {
      let downloadUrl: string | undefined;
      let fileName: string;
      
      switch (docType) {
        case "voucher": {
          // Use partnerOrderId for voucher download (WorldOTA API requires it)
          const voucherId = order.partnerOrderId || order.id;
          const response = await bookingApi.downloadVoucher(voucherId);
          downloadUrl = response.voucher_url || response.data?.url;
          fileName = `voucher-${response.partner_order_id || order.id}.pdf`;
          break;
        }
        case "invoice": {
          const response = await bookingApi.downloadInvoice(order.id);
          downloadUrl = response.invoice_url || response.data?.url;
          fileName = response.invoice_number ? `invoice-${response.invoice_number}.pdf` : `invoice-${order.id}.pdf`;
          break;
        }
        case "single_act": {
          const response = await bookingApi.downloadSingleAct(order.id);
          downloadUrl = response.act_url || response.data?.url;
          fileName = response.act_number ? `act-${response.act_number}.pdf` : `act-${order.id}.pdf`;
          break;
        }
      }
      
      if (downloadUrl) {
        bookingApi.triggerDownload(downloadUrl, fileName);
        toast.success(`${docName} downloaded successfully`);
      } else {
        toast.error("Failed to download document - no URL returned");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download document");
    } finally {
      setIsDownloading(null);
    }
  };

  // Handler for custom branded voucher
  const handleDownloadCustomVoucher = () => {
    if (!order) return;

    // Extract guests from room data or lead guest
    const guests: Array<{ first_name: string; last_name: string; is_child?: boolean; age?: number }> = [];
    if (order.leadGuest) {
      guests.push({
        first_name: order.leadGuest.firstName,
        last_name: order.leadGuest.lastName,
        is_child: false,
      });
    }

    const voucherData: VoucherData = {
      orderId: order.id,
      partnerOrderId: order.partnerOrderId,
      confirmationNumber: order.confirmationNumber || order.partnerOrderId || order.id,
      createdAt: order.createdAt,
      hotelName: order.hotelName || "Hotel",
      hotelAddress: order.hotelAddress,
      hotelCity: order.city,
      hotelCountry: order.country,
      hotelPhone: undefined,
      hotelImage: hotelImage || undefined,
      checkIn: order.checkIn,
      checkOut: order.checkOut,
      checkInTime: order.voucherData?.checkInTime,
      checkOutTime: order.voucherData?.checkOutTime,
      roomType: order.roomType,
      mealPlan: order.mealPlan,
      guests,
      // Guest counts
      adultsCount: order.voucherData?.adultsCount || order.occupancy?.adults,
      childrenCount: order.voucherData?.childrenCount || order.occupancy?.children,
      // Bedding
      bedding: order.voucherData?.bedding,
      // Fees separated
      includedFees: order.voucherData?.includedFees,
      notIncludedFees: order.voucherData?.notIncludedFees,
      // Deposits
      deposits: order.voucherData?.deposits,
      depositInfo: order.voucherData?.depositInfo,
      // Meal details
      hasBreakfast: order.voucherData?.hasBreakfast,
      noChildMeal: order.voucherData?.noChildMeal,
      // Cancellation
      cancellationPolicy: order.voucherData?.cancellationPolicyText || order.cancellationPolicy,
      freeCancellationBefore: order.voucherData?.freeCancellationBefore,
      // Other
      specialRequests: order.specialRequests?.join(', '),
      latitude: order.voucherData?.latitude,
      longitude: order.voucherData?.longitude,
    };

    openCustomVoucher(voucherData);
    toast.success("Branded voucher opened in new window");
  };

  const handleCancellationComplete = (result: { success: boolean; refundAmount?: number; message?: string }) => {
    if (result.success && order) {
      // Update order status locally
      setOrder(prev => prev ? { ...prev, status: "cancelled" as OrderStatus } : prev);
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

  // Loading state
  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-6 lg:p-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Trip
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i}>
                          <Skeleton className="h-4 w-16 mb-2" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-5 w-24" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-6 lg:p-8">
            <Link 
              to="/my-bookings"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Bookings
            </Link>
            <Card className="max-w-lg mx-auto">
              <CardContent className="p-8 text-center">
                <AlertCircleIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="font-heading text-lg text-foreground mb-2">
                  {error || "Order not found"}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  We couldn't load the order details. The order may not exist or there was a connection issue.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate("/my-bookings")}>
                    View All Bookings
                  </Button>
                  <Button onClick={handleRefresh}>
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          {/* Back Link & Refresh */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              to={order.tripId ? `/trips/${order.tripId}` : "/my-bookings"}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {order.tripId ? "Back to Trip" : "Back to Bookings"}
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

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
                  {/* Voucher Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between gap-2"
                        disabled={isDownloading === "voucher"}
                      >
                        <span className="flex items-center gap-2">
                          {isDownloading === "voucher" ? (
                            <Loader2Icon className="w-4 h-4 animate-spin" />
                          ) : (
                            <DownloadIcon className="w-4 h-4" />
                          )}
                          Download Voucher
                        </span>
                        <ChevronDownIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem 
                        onClick={() => handleDownloadDocument("voucher", "Voucher")}
                        className="gap-2"
                      >
                        <FileTextIcon className="w-4 h-4" />
                        Official Supplier Voucher
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDownloadCustomVoucher}
                        className="gap-2"
                      >
                        <SparklesIcon className="w-4 h-4" />
                        Branded Custom Voucher
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
