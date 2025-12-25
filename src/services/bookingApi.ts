// ETG / RateHawk Booking API Service
import { API_BASE_URL } from "@/config/api";
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.error?.message || `API Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("Booking API Error:", error);
      throw error;
    }
  }

  private getCurrentUserId(): string {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      throw new Error("No authenticated user found. Please log in first.");
    }
    return userId;
  }

  /**
   * Step 2: Prebook - Validate availability and lock rate
   * MUST be called before Order Booking Finish
   */
  async prebook(params: PrebookParams): Promise<PrebookResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.PREBOOK}`;
    const userId = this.getCurrentUserId();

    console.log("📤 Prebook request:", { ...params, userId });

    const response = await this.fetchWithError<PrebookResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        book_hash: params.book_hash,
        residency: params.residency,
        currency: params.currency || "USD",
      }),
    });

    console.log("📥 Prebook response:", response);
    return response;
  }

  /**
   * Step 3: Get Order Booking Form - Retrieve required guest fields
   */
  async getOrderForm(bookingHash: string): Promise<OrderFormResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_FORM}`;
    const userId = this.getCurrentUserId();

    console.log("📤 Order form request:", { bookingHash, userId });

    const response = await this.fetchWithError<OrderFormResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        booking_hash: bookingHash,
      }),
    });

    console.log("📥 Order form response:", response);
    return response;
  }

  /**
   * Step 4: Order Booking Finish - Complete the booking
   * For certification: supports deposit and hotel payment types
   */
  async finishBooking(params: OrderFinishParams): Promise<OrderFinishResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_FINISH}`;
    const userId = this.getCurrentUserId();

    console.log("📤 Order finish request:", { ...params, userId });

    const response = await this.fetchWithError<OrderFinishResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        ...params,
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
