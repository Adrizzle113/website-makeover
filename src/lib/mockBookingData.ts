// Centralized mock booking data for demo orders
import type { PendingBookingData, OrderStatus, PaymentType, OrderInfoResponse } from "@/types/etgBooking";

/**
 * Generate a unique demo order ID
 */
export function generateDemoOrderId(): string {
  return `DEMO-${Date.now()}`;
}

/**
 * Check if an order ID is a demo order
 */
export function isDemoOrder(orderId: string): boolean {
  return orderId.startsWith("demo-") || orderId.startsWith("DEMO-");
}

/**
 * Complete mock booking data matching RateHawk API response format
 */
export const MOCK_BOOKING_DATA = {
  orderId: "", // Will be set dynamically
  confirmationNumber: "ETG-DEMO-12345",
  status: "confirmed" as const,
  
  hotel: {
    id: "l_ermitage_beverly_hills",
    name: "L'Ermitage Beverly Hills",
    starRating: 5,
    address: "9291 Burton Way",
    city: "Beverly Hills",
    country: "US",
    phone: "+1 310-278-3344",
    email: "reservations@lermitagebeverlyhills.com",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80",
    currency: "USD",
  },
  
  rooms: [{
    roomId: "deluxe-suite-001",
    roomName: "Deluxe Double Classic Suite (full double bed)",
    mealPlan: "Room Only",
    quantity: 1,
  }],
  
  guests: [{
    firstName: "Areahna",
    lastName: "Vitor",
    email: "areahnaorea@gmail.com",
    type: "adult" as const,
    isLead: true,
  }, {
    firstName: "Guest",
    lastName: "Two",
    type: "adult" as const,
    isLead: false,
  }],
  
  dates: {
    checkIn: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // ~40 days from now
    checkOut: new Date(Date.now() + 43 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 3 nights
    nights: 3,
  },
  
  pricing: {
    roomTotal: 2922.70,
    upsellsTotal: 0,
    taxesIncluded: 0,
    taxesAtHotel: 151.83,
    totalPaid: 2922.70,
    totalAtHotel: 151.83,
    currency: "USD",
  },
  
  taxes: [
    { name: "Resort fee", amount: "24.24", currency_code: "USD", included_by_supplier: false },
    { name: "Service fee", amount: "127.59", currency_code: "USD", included_by_supplier: false },
  ],
  
  // Simplified taxes for display
  displayTaxes: [
    { name: "Resort fee", amount: 24.24, currency: "USD", included: false },
    { name: "Service fee", amount: 127.59, currency: "USD", included: false },
  ],
  
  payment: {
    method: "deposit",
    status: "paid",
  },
  
  cancellation: {
    isCancellable: true,
    freeCancellationBefore: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000).toISOString(), // 2 days before check-in
    policies: [{
      deadline: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000).toISOString(),
      penalty: 0,
      currency: "USD"
    }, {
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      penalty: 2922.70,
      currency: "USD"
    }],
  },
};

/**
 * Get mock pending booking data for demo orders
 * @param orderId - The demo order ID to use
 */
export function getMockPendingBookingData(orderId: string): PendingBookingData {
  const checkInDate = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000);
  const checkOutDate = new Date(Date.now() + 43 * 24 * 60 * 60 * 1000);
  
  return {
    bookingId: orderId,
    orderId: orderId,
    bookingHash: `mock-hash-${orderId}`,
    hotel: {
      id: MOCK_BOOKING_DATA.hotel.id,
      name: MOCK_BOOKING_DATA.hotel.name,
      address: MOCK_BOOKING_DATA.hotel.address,
      city: MOCK_BOOKING_DATA.hotel.city,
      country: MOCK_BOOKING_DATA.hotel.country,
      starRating: MOCK_BOOKING_DATA.hotel.starRating,
      mainImage: MOCK_BOOKING_DATA.hotel.mainImage,
      currency: MOCK_BOOKING_DATA.hotel.currency,
    },
    rooms: MOCK_BOOKING_DATA.rooms.map(r => ({
      roomId: r.roomId,
      roomName: r.roomName,
      quantity: r.quantity,
      pricePerRoom: MOCK_BOOKING_DATA.pricing.roomTotal / r.quantity,
      totalPrice: MOCK_BOOKING_DATA.pricing.roomTotal,
      taxes: MOCK_BOOKING_DATA.taxes,
    })),
    guests: MOCK_BOOKING_DATA.guests.map((g, i) => ({
      id: `guest-${i + 1}`,
      firstName: g.firstName,
      lastName: g.lastName,
      email: g.email,
      type: g.type,
      isLead: g.isLead,
    })),
    bookingDetails: {
      countryCode: "+1",
      phoneNumber: "555-123-4567",
      groupOfClients: "leisure",
      specialRequests: "",
    },
    searchParams: {
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: 2,
      rooms: 1,
      children: 0,
    },
    totalPrice: MOCK_BOOKING_DATA.pricing.totalPaid,
    residency: "US",
    paymentType: "deposit",
  };
}

/**
 * Get mock API responses for demo orders
 */
export const MOCK_API_RESPONSES = {
  cancellation: (orderId: string) => ({
    status: "ok" as const,
    order_id: orderId,
    cancelled_at: new Date().toISOString(),
    cancellation_fee: 0,
    refund_amount: MOCK_BOOKING_DATA.pricing.totalPaid,
    currency: MOCK_BOOKING_DATA.pricing.currency,
    message: "Demo booking cancelled successfully",
  }),
  
  voucher: (orderId: string, partnerOrderId: string) => ({
    order_id: orderId,
    partner_order_id: partnerOrderId,
    voucher_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    language: "en",
    generated_at: new Date().toISOString(),
  }),
  
  invoice: (orderId: string) => ({
    order_id: orderId,
    invoice_number: `INV-${orderId}`,
    invoice_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    amount: MOCK_BOOKING_DATA.pricing.totalPaid,
    currency: MOCK_BOOKING_DATA.pricing.currency,
    issue_date: new Date().toISOString(),
  }),
  
  orderInfo: (orderId: string): OrderInfoResponse => ({
    status: "ok",
    data: {
      order_id: orderId,
      order_group_id: `grp-${orderId}`,
      status: "confirmed" as OrderStatus,
      confirmation_number: `ETG-${orderId.slice(-8)}`,
      hotel: {
        id: MOCK_BOOKING_DATA.hotel.id,
        name: MOCK_BOOKING_DATA.hotel.name,
        address: MOCK_BOOKING_DATA.hotel.address,
        city: MOCK_BOOKING_DATA.hotel.city,
        country: MOCK_BOOKING_DATA.hotel.country,
        star_rating: MOCK_BOOKING_DATA.hotel.starRating,
        phone: MOCK_BOOKING_DATA.hotel.phone,
      },
      dates: {
        check_in: MOCK_BOOKING_DATA.dates.checkIn,
        check_out: MOCK_BOOKING_DATA.dates.checkOut,
        nights: MOCK_BOOKING_DATA.dates.nights,
      },
      room: {
        name: MOCK_BOOKING_DATA.rooms[0].roomName,
        meal_plan: MOCK_BOOKING_DATA.rooms[0].mealPlan,
        guests: MOCK_BOOKING_DATA.guests.map(g => ({
          first_name: g.firstName,
          last_name: g.lastName,
          is_child: false,
        })),
      },
      lead_guest: {
        first_name: MOCK_BOOKING_DATA.guests[0].firstName,
        last_name: MOCK_BOOKING_DATA.guests[0].lastName,
        email: MOCK_BOOKING_DATA.guests[0].email,
      },
      price: {
        amount: MOCK_BOOKING_DATA.pricing.totalPaid.toString(),
        currency_code: MOCK_BOOKING_DATA.pricing.currency,
      },
      payment: {
        type: "deposit" as PaymentType,
        status: "paid" as "paid" | "pending" | "refunded",
      },
      cancellation_policy: MOCK_BOOKING_DATA.cancellation.isCancellable ? "Free cancellation available" : "Non-refundable",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  }),
  
  orderStatus: (orderId: string) => ({
    success: true,
    status: "ok" as const,
    data: {
      status: "ok" as const,
      is_final: true,
      is_success: true,
      is_processing: false,
      partner_order_id: orderId,
      order_id: orderId,
      percent: 100,
      confirmation_number: `ETG-${orderId}`,
      cancellation_info: {
        free_cancellation_before: MOCK_BOOKING_DATA.cancellation.freeCancellationBefore,
      },
    },
    timestamp: new Date().toISOString(),
    duration: "0ms",
  }),
};
