// ETG / RateHawk Booking API Service
import { API_BASE_URL } from "@/config/api";
import { getOrCreateUserId } from "@/lib/getOrCreateUserId";
import type {
  PrebookParams,
  PrebookResponse,
  OrderFormResponse,
  OrderFinishParams,
  OrderFinishResponse,
  OrderStatusResponse,
  OrderInfoResponse,
  DocumentsResponse,
  PaymentType,
} from "@/types/etgBooking";

const BOOKING_ENDPOINTS = {
  PREBOOK: "/api/ratehawk/prebook",
  ORDER_FORM: "/api/ratehawk/order/form",
  ORDER_FINISH: "/api/ratehawk/order/finish",
  ORDER_STATUS: "/api/ratehawk/order/status",
  ORDER_INFO: "/api/ratehawk/order/info",
  ORDER_DOCUMENTS: "/api/ratehawk/order/documents",
} as const;

class BookingApiService {
  private async fetchWithError<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      // Handle rate limiting BEFORE parsing JSON
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        throw new Error(`Service is busy. Please wait ${waitSeconds} seconds and try again.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`${data?.error?.message || "API Error"} (HTTP ${response.status})`);
      }

      return data;
    } catch (error) {
      console.error("Booking API Error:", error);
      throw error;
    }
  }

  private getCurrentUserId(): string {
    return getOrCreateUserId();
  }

  /**
   * Step 2: Prebook - Validate availability and lock rate
   * MUST be called before Order Booking Finish
   */
  async prebook(params: PrebookParams): Promise<PrebookResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.PREBOOK}`;
    const userId = this.getCurrentUserId();

    console.log("📤 Prebook request:", { ...params, userId });

    // The backend has historically accepted different key names for the hash.
    // We send both to be resilient.
    const requestInit: RequestInit = {
      method: "POST",
      body: JSON.stringify({
        userId,
        hash: params.book_hash,
        book_hash: params.book_hash, // Can be match_hash (m-...) or book_hash (h-...)
        residency: params.residency,
        currency: params.currency || "USD",
      }),
    };

    let response: PrebookResponse;
    try {
      response = await this.fetchWithError<PrebookResponse>(url, requestInit);
    } catch (error) {
      // Render/ETG can be flaky; retry once to reduce transient 500s.
      console.warn("Prebook failed, retrying once...", error);
      await new Promise((r) => setTimeout(r, 1200));
      response = await this.fetchWithError<PrebookResponse>(url, requestInit);
    }

    console.log("📥 Prebook response:", response);
    return response;
  }

  /**
   * Step 3: Get Order Booking Form - Retrieve required guest fields
   * @param bookHash - The book_hash from prebook response
   * @param partnerOrderId - Required unique partner order ID
   */
  async getOrderForm(bookHash: string, partnerOrderId: string): Promise<OrderFormResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_FORM}`;
    const userId = this.getCurrentUserId();

    if (!bookHash || !partnerOrderId) {
      throw new Error("Missing required fields: book_hash or partner_order_id");
    }

    console.log("📤 Order form request:", { bookHash, partnerOrderId, userId });

    const response = await this.fetchWithError<OrderFormResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        book_hash: bookHash,
        partner_order_id: partnerOrderId,
      }),
    });

    console.log("📥 Order form response:", response);
    return response;
  }

  /**
   * Step 4: Order Booking Finish - Complete the booking
   * For certification: supports deposit and hotel payment types
   * @param params - Must include order_id and item_id from form response
   */
  async finishBooking(params: OrderFinishParams): Promise<OrderFinishResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_FINISH}`;
    const userId = this.getCurrentUserId();

    // Validate required fields from ETG API spec
    if (!params.order_id || !params.item_id || !params.partner_order_id) {
      throw new Error("Missing required booking fields: order_id, item_id, or partner_order_id");
    }

    console.log("📤 Order finish request:", { ...params, userId });

    const response = await this.fetchWithError<OrderFinishResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        order_id: params.order_id,
        item_id: params.item_id,
        partner_order_id: params.partner_order_id,
        payment_type: params.payment_type,
        guests: params.guests,
        email: params.email,
        phone: params.phone,
        user_ip: params.user_ip,
        language: params.language,
      }),
    });

    console.log("📥 Order finish response:", response);
    return response;
  }

  /**
   * Step 5: Order Finish Status - Poll until final status
   * MUST call repeatedly until confirmed or failed
   */
  async getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_STATUS}`;
    const userId = this.getCurrentUserId();

    console.log("📤 Order status request:", { orderId, userId });

    const response = await this.fetchWithError<OrderStatusResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        order_id: orderId,
      }),
    });

    console.log("📥 Order status response:", response);
    return response;
  }

  /**
   * Step 6a: Get Order Information - Retrieve full order details
   */
  async getOrderInfo(orderId: string): Promise<OrderInfoResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_INFO}`;
    const userId = this.getCurrentUserId();

    console.log("📤 Order info request:", { orderId, userId });

    const response = await this.fetchWithError<OrderInfoResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        order_id: orderId,
      }),
    });

    console.log("📥 Order info response:", response);
    return response;
  }

  /**
   * Step 6b: Get Order Documents - Retrieve voucher and confirmation docs
   */
  async getDocuments(orderId: string): Promise<DocumentsResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_DOCUMENTS}`;
    const userId = this.getCurrentUserId();

    console.log("📤 Order documents request:", { orderId, userId });

    const response = await this.fetchWithError<DocumentsResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        order_id: orderId,
      }),
    });

    console.log("📥 Order documents response:", response);
    return response;
  }

  /**
   * Helper: Poll order status until final (confirmed/failed)
   * Returns final status or throws on timeout
   */
  async pollOrderStatus(
    orderId: string,
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onStatusUpdate?: (status: string, attempt: number) => void;
    } = {}
  ): Promise<OrderStatusResponse> {
    const { maxAttempts = 20, intervalMs = 3000, onStatusUpdate } = options;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const statusResponse = await this.getOrderStatus(orderId);
        const status = statusResponse.data?.status;
        
        onStatusUpdate?.(status, attempts);

        if (status === "confirmed" || status === "failed" || status === "cancelled") {
          return statusResponse;
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } catch (error) {
        console.error(`Status poll attempt ${attempts} failed:`, error);
        
        // If it's a network error, wait and retry
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
      }
    }

    // Timeout - return last known status with processing state
    throw new Error("Status polling timeout - booking may still be processing");
  }

  /**
   * Helper: Generate partner order ID
   */
  generatePartnerOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BK-${timestamp}-${random}`;
  }
}

export const bookingApi = new BookingApiService();
