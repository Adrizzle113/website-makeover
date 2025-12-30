import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  CheckCircle,
  Calendar, 
  MapPin,
  Download,
  ArrowRight,
  Star,
  Loader2,
  FileText,
  Mail,
  Share2,
  Clock,
  Users,
  CreditCard,
  Phone,
  Info,
  CalendarPlus,
  Copy,
  Check,
  AlertCircle,
  Sunrise,
  Sunset,
  BadgeCheck,
  Building2,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { bookingApi } from "@/services/bookingApi";
import { createBookingCalendarEvent, downloadICSFile } from "@/lib/calendarUtils";
import { BookingTimeline } from "@/components/booking";
import type { PendingBookingData } from "@/types/etgBooking";

interface ConfirmedBooking {
  id: string;
  confirmationNumber: string;
  status: string;
  hotel: {
    id: string;
    name: string;
    starRating: number;
    address: string;
    city: string;
    country: string;
    phone?: string;
    email?: string;
    checkInTime?: string;
    checkOutTime?: string;
    image?: string;
    currency: string;
  };
  rooms: Array<{
    roomId: string;
    roomName: string;
    mealPlan?: string;
    quantity: number;
  }>;
  guests: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    type: "adult" | "child";
    isLead?: boolean;
  }>;
  upsells?: Array<{
    type: "early_checkin" | "late_checkout";
    name: string;
    price: number;
    time?: string;
  }>;
  dates: {
    checkIn: string;
    checkOut: string;
  };
  pricing: {
    roomTotal: number;
    upsellsTotal: number;
    taxesIncluded: number;
    taxesAtHotel: number;
    totalPaid: number;
    totalAtHotel: number;
    currency: string;
  };
  payment: {
    method: string;
    status: string;
  };
  bookingDate: string;
}

export default function BookingConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ConfirmedBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadBookingData();
  }, [orderId]);

  const loadBookingData = async () => {
    setIsLoading(true);

    // First try to load from sessionStorage (just completed booking)
    const pendingBooking = sessionStorage.getItem("pending_booking");
    if (pendingBooking) {
      try {
        const data: PendingBookingData = JSON.parse(pendingBooking);
        const leadGuest = data.guests.find(g => g.isLead);
        
        // Transform pending booking to confirmed booking format
        const confirmedBooking: ConfirmedBooking = {
          id: orderId || data.bookingId,
          confirmationNumber: data.bookingId || `ETG-${Date.now()}`,
          status: "confirmed",
          hotel: {
            id: data.hotel.id,
            name: data.hotel.name,
            starRating: data.hotel.starRating || 4,
            address: data.hotel.address || "",
            city: data.hotel.city || "",
            country: data.hotel.country || "",
            phone: (data.hotel as any).phone,
            email: (data.hotel as any).email,
            checkInTime: (data.hotel as any).checkInTime || "14:00",
            checkOutTime: (data.hotel as any).checkOutTime || "11:00",
            image: data.hotel.mainImage,
            currency: data.hotel.currency || "USD",
          },
          rooms: data.rooms.map(r => ({
            roomId: r.roomId,
            roomName: r.roomName,
            mealPlan: (r as any).mealPlan,
            quantity: r.quantity,
          })),
          guests: data.guests.map(g => ({
            firstName: g.firstName,
            lastName: g.lastName,
            email: g.email,
            type: g.type as "adult" | "child",
            isLead: g.isLead,
          })),
          upsells: data.upsells?.map((u: any) => ({
            type: u.type as "early_checkin" | "late_checkout",
            name: u.name,
            price: u.price,
            time: u.newTime || u.time,
          })),
          dates: {
            checkIn: typeof data.searchParams.checkIn === 'string' 
              ? data.searchParams.checkIn 
              : data.searchParams.checkIn.toISOString().split("T")[0],
            checkOut: typeof data.searchParams.checkOut === 'string' 
              ? data.searchParams.checkOut 
              : data.searchParams.checkOut.toISOString().split("T")[0],
          },
          pricing: {
            roomTotal: data.totalPrice - ((data as any).upsells?.reduce((sum: number, u: any) => sum + u.price, 0) || 0),
            upsellsTotal: (data as any).upsells?.reduce((sum: number, u: any) => sum + u.price, 0) || 0,
            taxesIncluded: 0,
            taxesAtHotel: 0,
            totalPaid: data.totalPrice,
            totalAtHotel: 0,
            currency: data.hotel.currency || "USD",
          },
          payment: {
            method: "deposit",
            status: "paid",
          },
          bookingDate: new Date().toISOString(),
        };

        setBooking(confirmedBooking);
        setIsLoading(false);
        
        // Clear the pending booking after loading
        // sessionStorage.removeItem("pending_booking");
        return;
      } catch (e) {
        console.error("Failed to parse pending booking:", e);
      }
    }

    // Try to fetch from API
    if (orderId) {
      try {
        const response = await bookingApi.getOrderInfo(orderId);
        if (response.data) {
          // Transform API response to our format
          // This would need to be adapted based on actual API response structure
          console.log("Order info:", response.data);
        }
      } catch (e) {
        console.error("Failed to fetch order info:", e);
      }
    }

    // Fallback to mock data for demo
    setBooking({
      id: orderId || "demo-order",
      confirmationNumber: `ETG-${Date.now().toString().slice(-8)}`,
      status: "confirmed",
      hotel: {
        id: "demo-hotel",
        name: "The Beverly Hills Hotel",
        starRating: 5,
        address: "9641 Sunset Boulevard",
        city: "Beverly Hills",
        country: "United States",
        phone: "+1 310-276-2251",
        email: "reservations@beverlyhillshotel.com",
        checkInTime: "15:00",
        checkOutTime: "12:00",
        currency: "USD",
      },
      rooms: [{
        roomId: "deluxe-king",
        roomName: "Deluxe King Room",
        mealPlan: "Breakfast Included",
        quantity: 1,
      }],
      guests: [{
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        type: "adult",
        isLead: true,
      }],
      dates: {
        checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        checkOut: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      pricing: {
        roomTotal: 1200,
        upsellsTotal: 0,
        taxesIncluded: 180,
        taxesAtHotel: 50,
        totalPaid: 1200,
        totalAtHotel: 50,
        currency: "USD",
      },
      payment: {
        method: "deposit",
        status: "paid",
      },
      bookingDate: new Date().toISOString(),
    });
    
    setIsLoading(false);
  };

  const handleDownloadVoucher = async () => {
    setVoucherLoading(true);
    
    try {
      if (orderId) {
        const response = await bookingApi.getDocuments(orderId);
        // Check if there's a voucher document in the list
        const voucherDoc = response.data?.documents?.find(
          (doc: any) => doc.type === "voucher" || doc.name?.includes("voucher")
        );
        if (voucherDoc?.url) {
          window.open(voucherDoc.url, "_blank");
          toast({
            title: "Voucher Ready",
            description: "Your booking voucher has been opened.",
          });
          setVoucherLoading(false);
          return;
        }
      }
      
      // Generate PDF voucher using print functionality
      const voucherContent = generateVoucherHTML();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(voucherContent);
        printWindow.document.close();
        printWindow.focus();
        // Small delay to ensure content is loaded before print
        setTimeout(() => {
          printWindow.print();
        }, 250);
        toast({
          title: "Voucher Ready",
          description: "Print dialog opened. Save as PDF to download.",
        });
      } else {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to download the voucher.",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Failed to download voucher:", e);
      toast({
        title: "Error",
        description: "Failed to generate voucher. Please try again.",
        variant: "destructive",
      });
    }
    
    setVoucherLoading(false);
  };

  const generateVoucherHTML = (): string => {
    if (!booking) return "";
    
    const checkInDate = format(new Date(booking.dates.checkIn), "EEEE, MMMM d, yyyy");
    const checkOutDate = format(new Date(booking.dates.checkOut), "EEEE, MMMM d, yyyy");
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Booking Voucher - ${booking.confirmationNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #1a365d; }
          .confirmation { background: #f0f7ff; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
          .confirmation-number { font-size: 24px; font-weight: bold; color: #1a365d; letter-spacing: 2px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 14px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          .hotel-name { font-size: 22px; font-weight: bold; color: #1a365d; margin-bottom: 5px; }
          .stars { color: #f59e0b; font-size: 16px; }
          .address { color: #666; margin-top: 5px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .info-box { background: #f9fafb; padding: 15px; border-radius: 6px; }
          .info-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
          .info-value { font-size: 16px; font-weight: 600; color: #1a365d; }
          .info-sub { font-size: 12px; color: #888; margin-top: 2px; }
          .guest-list { background: #f9fafb; padding: 15px; border-radius: 6px; }
          .guest { padding: 8px 0; border-bottom: 1px solid #eee; }
          .guest:last-child { border-bottom: none; }
          .lead-badge { background: #1a365d; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; margin-left: 8px; }
          .upsell { background: #fef3c7; padding: 10px 15px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; }
          .price-summary { background: #1a365d; color: white; padding: 20px; border-radius: 8px; margin-top: 30px; }
          .price-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2); }
          .price-row:last-child { border-bottom: none; font-size: 18px; font-weight: bold; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
          .contact-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 20px; }
          .contact-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">TravelHub</div>
          <p style="color: #666; margin-top: 5px;">Booking Confirmation Voucher</p>
        </div>

        <div class="confirmation">
          <p style="font-size: 12px; color: #666; margin-bottom: 5px;">CONFIRMATION NUMBER</p>
          <p class="confirmation-number">${booking.confirmationNumber}</p>
        </div>

        <div class="section">
          <p class="section-title">Hotel Information</p>
          <p class="hotel-name">${booking.hotel.name}</p>
          <p class="stars">${'★'.repeat(booking.hotel.starRating)}</p>
          <p class="address">${booking.hotel.address}, ${booking.hotel.city}, ${booking.hotel.country}</p>
          ${booking.hotel.phone ? `<div class="contact-grid"><div class="contact-item">📞 ${booking.hotel.phone}</div>${booking.hotel.email ? `<div class="contact-item">✉️ ${booking.hotel.email}</div>` : ''}</div>` : ''}
        </div>

        <div class="section">
          <p class="section-title">Stay Details</p>
          <div class="grid">
            <div class="info-box">
              <p class="info-label">Check-in</p>
              <p class="info-value">${checkInDate}</p>
              <p class="info-sub">From ${hasEarlyCheckIn ? earlyCheckIn?.time : booking.hotel.checkInTime}</p>
            </div>
            <div class="info-box">
              <p class="info-label">Check-out</p>
              <p class="info-value">${checkOutDate}</p>
              <p class="info-sub">Until ${hasLateCheckout ? lateCheckout?.time : booking.hotel.checkOutTime}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <p class="section-title">Room Details</p>
          ${booking.rooms.map(room => `
            <div class="info-box" style="margin-bottom: 10px;">
              <p class="info-value">${room.roomName} × ${room.quantity}</p>
              ${room.mealPlan ? `<p class="info-sub">${room.mealPlan}</p>` : ''}
            </div>
          `).join('')}
        </div>

        ${booking.upsells && booking.upsells.length > 0 ? `
        <div class="section">
          <p class="section-title">Add-ons (Subject to Availability)</p>
          ${booking.upsells.map(u => `
            <div class="upsell">
              <span>${u.name}${u.time ? ` - ${u.time}` : ''}</span>
              <span>${booking.pricing.currency} ${u.price.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="section">
          <p class="section-title">Guest Information</p>
          <div class="guest-list">
            ${booking.guests.map(g => `
              <div class="guest">
                <span style="font-weight: 600;">${g.firstName} ${g.lastName}</span>
                ${g.isLead ? '<span class="lead-badge">Lead Guest</span>' : ''}
                <span style="color: #888; margin-left: 10px;">(${g.type})</span>
                ${g.email && g.isLead ? `<br><span style="font-size: 12px; color: #666;">${g.email}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="price-summary">
          <div class="price-row">
            <span>Room Total (${nights} night${nights !== 1 ? 's' : ''})</span>
            <span>${booking.pricing.currency} ${booking.pricing.roomTotal.toFixed(2)}</span>
          </div>
          ${booking.pricing.upsellsTotal > 0 ? `
          <div class="price-row">
            <span>Add-ons</span>
            <span>${booking.pricing.currency} ${booking.pricing.upsellsTotal.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="price-row">
            <span>Total Paid</span>
            <span>${booking.pricing.currency} ${booking.pricing.totalPaid.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>This voucher is your confirmation of booking. Please present it at check-in.</p>
          <p style="margin-top: 10px;">Booked on ${format(new Date(booking.bookingDate), "MMMM d, yyyy 'at' h:mm a")}</p>
          <p style="margin-top: 20px;">Thank you for booking with TravelHub</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleSendEmail = async () => {
    setEmailSending(true);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Email Sent",
      description: `Confirmation sent to ${booking?.guests.find(g => g.isLead)?.email || "guest email"}.`,
    });
    
    setEmailSending(false);
  };

  const handleAddToCalendar = () => {
    if (!booking) return;

    const leadGuest = booking.guests.find(g => g.isLead);
    const event = createBookingCalendarEvent({
      hotelName: booking.hotel.name,
      address: booking.hotel.address,
      city: booking.hotel.city,
      country: booking.hotel.country,
      checkIn: booking.dates.checkIn,
      checkOut: booking.dates.checkOut,
      confirmationNumber: booking.confirmationNumber,
      roomType: booking.rooms[0]?.roomName,
      guestName: leadGuest ? `${leadGuest.firstName} ${leadGuest.lastName}` : undefined,
    });

    downloadICSFile(event, `booking-${booking.confirmationNumber}`);
    
    toast({
      title: "Calendar Event Downloaded",
      description: "Open the .ics file to add to your calendar.",
    });
  };

  const handleCopyConfirmation = () => {
    if (!booking) return;
    
    navigator.clipboard.writeText(booking.confirmationNumber);
    setCopied(true);
    
    toast({
      title: "Copied",
      description: "Confirmation number copied to clipboard.",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!booking) return;
    
    const shareData = {
      title: `Booking Confirmation - ${booking.hotel.name}`,
      text: `My booking at ${booking.hotel.name}\nConfirmation: ${booking.confirmationNumber}\nCheck-in: ${format(new Date(booking.dates.checkIn), "MMM d, yyyy")}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback to copy link
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Booking link copied to clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading booking details...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!booking) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <Card className="max-w-md mx-4">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-heading font-bold mb-2">Booking Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't find the booking details. Please check your booking reference.
                </p>
                <Button onClick={() => navigate("/dashboard/search")}>
                  Search Hotels
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const leadGuest = booking.guests.find(g => g.isLead);
  const nights = differenceInDays(new Date(booking.dates.checkOut), new Date(booking.dates.checkIn));
  const hasEarlyCheckIn = booking.upsells?.some(u => u.type === "early_checkin");
  const hasLateCheckout = booking.upsells?.some(u => u.type === "late_checkout");
  const earlyCheckIn = booking.upsells?.find(u => u.type === "early_checkin");
  const lateCheckout = booking.upsells?.find(u => u.type === "late_checkout");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-3xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Booking Confirmed!
              </h1>
              <p className="text-muted-foreground">
                Your reservation has been successfully confirmed.
                {leadGuest?.email && (
                  <> A confirmation email has been sent to <span className="font-medium">{leadGuest.email}</span>.</>
                )}
              </p>
            </div>

            {/* Confirmation Number */}
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Confirmation Number</p>
                    <p className="font-heading text-2xl text-primary tracking-wider font-bold">
                      {booking.confirmationNumber}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyConfirmation}
                    className="gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hotel & Stay Details */}
            <Card className="mb-6">
              <CardContent className="p-6">
                {/* Hotel Info */}
                <div className="flex gap-4 mb-6">
                  {booking.hotel.image && (
                    <img
                      src={booking.hotel.image}
                      alt={booking.hotel.name}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {[...Array(booking.hotel.starRating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-[hsl(var(--app-gold))] fill-current" />
                      ))}
                    </div>
                    <h2 className="font-heading text-xl font-bold text-foreground mb-1 truncate">
                      {booking.hotel.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {booking.hotel.address}, {booking.hotel.city}, {booking.hotel.country}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Dates & Room */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Check-in
                    </p>
                    <p className="font-medium text-foreground">
                      {format(new Date(booking.dates.checkIn), "EEE, MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hasEarlyCheckIn ? earlyCheckIn?.time : booking.hotel.checkInTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Check-out
                    </p>
                    <p className="font-medium text-foreground">
                      {format(new Date(booking.dates.checkOut), "EEE, MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hasLateCheckout ? lateCheckout?.time : booking.hotel.checkOutTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Duration
                    </p>
                    <p className="font-medium text-foreground">
                      {nights} night{nights !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Guests
                    </p>
                    <p className="font-medium text-foreground">
                      {booking.guests.filter(g => g.type === "adult").length} adult{booking.guests.filter(g => g.type === "adult").length !== 1 ? "s" : ""}
                      {booking.guests.filter(g => g.type === "child").length > 0 && (
                        <>, {booking.guests.filter(g => g.type === "child").length} child</>
                      )}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Room Details */}
                <div className="space-y-2">
                  {booking.rooms.map((room, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{room.roomName}</p>
                        {room.mealPlan && (
                          <p className="text-sm text-muted-foreground">{room.mealPlan}</p>
                        )}
                      </div>
                      <Badge variant="secondary">×{room.quantity}</Badge>
                    </div>
                  ))}
                </div>

                {/* Upsells Section */}
                {booking.upsells && booking.upsells.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-primary" />
                        Add-ons Included
                      </p>
                      <div className="space-y-2">
                        {booking.upsells.map((upsell, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg"
                          >
                            {upsell.type === "early_checkin" ? (
                              <Sunrise className="h-5 w-5 text-amber-500" />
                            ) : (
                              <Sunset className="h-5 w-5 text-orange-500" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{upsell.name}</p>
                              {upsell.time && (
                                <p className="text-sm text-muted-foreground">
                                  {upsell.type === "early_checkin" ? "Check-in from" : "Check-out until"} {upsell.time}
                                </p>
                              )}
                            </div>
                            <p className="font-medium text-foreground">
                              {booking.pricing.currency} {upsell.price.toFixed(2)}
                            </p>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground mt-2">
                          * Subject to hotel availability at time of arrival
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator className="my-4" />

                {/* Lead Guest & Payment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Lead Guest</p>
                    <p className="font-medium text-foreground">
                      {leadGuest?.firstName} {leadGuest?.lastName}
                    </p>
                    {leadGuest?.email && (
                      <p className="text-sm text-muted-foreground">{leadGuest.email}</p>
                    )}
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-sm text-muted-foreground mb-1">Payment</p>
                    <div className="flex items-center gap-2 sm:justify-start justify-end">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground capitalize">{booking.payment.method}</span>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        {booking.payment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading">Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Total</span>
                    <span>{booking.pricing.currency} {booking.pricing.roomTotal.toFixed(2)}</span>
                  </div>
                  {booking.pricing.upsellsTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Add-ons</span>
                      <span>{booking.pricing.currency} {booking.pricing.upsellsTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {booking.pricing.taxesIncluded > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes (included)</span>
                      <span>{booking.pricing.currency} {booking.pricing.taxesIncluded.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total Paid</span>
                    <span className="text-primary">
                      {booking.pricing.currency} {booking.pricing.totalPaid.toFixed(2)}
                    </span>
                  </div>
                  {booking.pricing.totalAtHotel > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>To Pay at Hotel</span>
                      <span>{booking.pricing.currency} {booking.pricing.totalAtHotel.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={handleDownloadVoucher}
                disabled={voucherLoading}
              >
                {voucherLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <span className="text-xs">Download Voucher</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={handleSendEmail}
                disabled={emailSending}
              >
                {emailSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
                <span className="text-xs">Email Confirmation</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={handleAddToCalendar}
              >
                <CalendarPlus className="h-5 w-5" />
                <span className="text-xs">Add to Calendar</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
                <span className="text-xs">Share Booking</span>
              </Button>
            </div>

            {/* Important Information Accordion */}
            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="checkin">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Check-in Instructions
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Check-in Time</p>
                        <p className="text-muted-foreground">
                          {hasEarlyCheckIn 
                            ? `Early check-in from ${earlyCheckIn?.time} (subject to availability)`
                            : `Standard check-in from ${booking.hotel.checkInTime}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Required Documents</p>
                        <p className="text-muted-foreground">
                          Valid photo ID (passport or national ID) and booking confirmation
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Credit Card</p>
                        <p className="text-muted-foreground">
                          A credit card may be required for incidentals and security deposit
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="checkout">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Check-out Instructions
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Check-out Time</p>
                        <p className="text-muted-foreground">
                          {hasLateCheckout 
                            ? `Late checkout until ${lateCheckout?.time} (subject to availability)`
                            : `Standard checkout by ${booking.hotel.checkOutTime}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Express Checkout</p>
                        <p className="text-muted-foreground">
                          Contact the front desk for express checkout options
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="contact">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Hotel Contact
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    {booking.hotel.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${booking.hotel.phone}`}
                          className="text-primary hover:underline"
                        >
                          {booking.hotel.phone}
                        </a>
                      </div>
                    )}
                    {booking.hotel.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${booking.hotel.email}`}
                          className="text-primary hover:underline"
                        >
                          {booking.hotel.email}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.hotel.address}, {booking.hotel.city}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* What's Next Section */}
            <Card className="mb-6 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  What Happens Next
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Confirmation Email Sent</p>
                      <p className="text-sm text-muted-foreground">
                        We've sent your booking confirmation to {leadGuest?.email || "your email"}.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Download Your Voucher</p>
                      <p className="text-sm text-muted-foreground">
                        Present the voucher at check-in for a smooth arrival experience.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <CalendarPlus className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Add to Calendar</p>
                      <p className="text-sm text-muted-foreground">
                        Never miss your trip dates by adding them to your calendar.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Arrive at the Hotel</p>
                      <p className="text-sm text-muted-foreground">
                        Check-in from {hasEarlyCheckIn ? earlyCheckIn?.time : booking.hotel.checkInTime} on {format(new Date(booking.dates.checkIn), "MMMM d, yyyy")}.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Countdown to Check-in */}
            {nights > 0 && differenceInDays(new Date(booking.dates.checkIn), new Date()) > 0 && (
              <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Your trip starts in</p>
                      <p className="font-heading text-3xl font-bold text-primary">
                        {differenceInDays(new Date(booking.dates.checkIn), new Date())} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Check-in date</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(booking.dates.checkIn), "EEEE, MMMM d")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Status Timeline */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading">Booking Timeline</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <BookingTimeline
                  bookingDate={booking.bookingDate}
                  confirmedAt={booking.bookingDate}
                  checkInDate={booking.dates.checkIn}
                  checkOutDate={booking.dates.checkOut}
                  status={booking.status}
                />
              </CardContent>
            </Card>

            {/* Trip Reference */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This booking is part of</p>
                      <p className="font-medium text-foreground">Trip: {booking.hotel.city} Getaway</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/trips">View All Trips</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                asChild
              >
                <Link to={`/orders/${booking.id}`}>
                  <FileText className="w-4 h-4" />
                  View Full Details
                </Link>
              </Button>
              <Button 
                className="flex-1 gap-2"
                onClick={() => navigate("/dashboard/search")}
              >
                Book Another Hotel
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Support */}
            <p className="text-center text-sm text-muted-foreground mt-8">
              Need help? Contact our support team at{" "}
              <a href="mailto:support@travelhub.com" className="text-primary hover:underline">
                support@travelhub.com
              </a>
            </p>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
