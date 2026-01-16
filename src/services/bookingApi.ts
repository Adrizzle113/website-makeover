// ETG / RateHawk Booking API Service
import { API_BASE_URL } from "@/config/api";
import { getOrCreateUserId } from "@/lib/getOrCreateUserId";
import { isDemoOrder, MOCK_API_RESPONSES } from "@/lib/mockBookingData";
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
  PayotaTokenRequest,
  PayotaTokenResponse,
  // Multiroom types
  MultiroomPrebookParams,
  MultiroomPrebookResponse,
  MultiroomOrderFormResponse,
  MultiroomOrderFinishParams,
  MultiroomOrderFinishResponse,
  // Post-booking types
  CancellationResponse,
  ContractDataResponse,
  FinancialInfoResponse,
  ClosingDocumentsInfoResponse,
  ClosingDocumentDownloadResponse,
  VoucherDownloadResponse,
  InvoiceDownloadResponse,
  OrderGroupInvoiceResponse,
  ActDownloadResponse,
  // Batch order info types
  OrderInfoBatchRequest,
  RateHawkOrderInfoBatchResponse,
} from "@/types/etgBooking";
import {
  isMultiroomPrebookParams,
  isMultiroomOrderFinishParams,
} from "@/types/etgBooking";

const BOOKING_ENDPOINTS = {
  PREBOOK: "/api/ratehawk/prebook",
  ORDER_FORM: "/api/ratehawk/order/form",
  ORDER_FINISH: "/api/ratehawk/order/finish",
  ORDER_STATUS: "/api/ratehawk/order/status",
  ORDER_INFO: "/api/ratehawk/order/info",
  ORDER_INFO_BATCH: "/api/ratehawk/order/info/batch",  // Batch retrieval
  ORDER_DOCUMENTS: "/api/ratehawk/order/documents",
  // New booking flow endpoints
  CREATE_CARD_TOKEN: "/api/ratehawk/order/credit-card-token",
  BOOKING_START: "/api/booking/start",
  BOOKING_STATUS: "/api/booking/status",
  // Post-booking endpoints - aligned with backend mock API
  CANCEL_BOOKING: "/api/ratehawk/order/cancel",
  CONTRACT_DATA: "/api/ratehawk/contract/data",
  FINANCIAL_INFO: "/api/ratehawk/financial/info",
  CLOSING_DOCS_INFO: "/api/ratehawk/document/closing/info",
  CLOSING_DOCS_DOWNLOAD: "/api/ratehawk/document/closing/download",
  VOUCHER_DOWNLOAD: "/api/ratehawk/order/voucher/download",
  INVOICE_DOWNLOAD: "/api/ratehawk/order/invoice/info/download",
  ORDER_GROUP_INVOICE: "/api/ratehawk/ordergroup/invoice/download",
  SINGLE_ACT_DOWNLOAD: "/api/ratehawk/order/act/download",
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

  private async getUserIp(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '0.0.0.0';
    } catch {
      console.warn('Could not detect user IP, using fallback');
      return '0.0.0.0';
    }
  }

  /**
   * Step 2: Prebook - Validate availability and lock rate
   * Supports both single-room and multiroom formats
   * @param params.price_increase_percent - Allow finding alternative rates within this % tolerance (default 20)
   */
  async prebook(params: PrebookParams): Promise<PrebookResponse>;
  async prebook(params: MultiroomPrebookParams): Promise<MultiroomPrebookResponse>;
  async prebook(params: PrebookParams | MultiroomPrebookParams): Promise<PrebookResponse | MultiroomPrebookResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.PREBOOK}`;
    const userId = this.getCurrentUserId();

    // Detect if multiroom request
    if (isMultiroomPrebookParams(params)) {
      console.log("📤 Multiroom Prebook request:", { rooms: params.rooms.length, userId });

      const requestInit: RequestInit = {
        method: "POST",
        body: JSON.stringify({
          userId,
          rooms: params.rooms.map(room => ({
            book_hash: room.book_hash,
            match_hash: room.match_hash,
            guests: room.guests,
            residency: room.residency || "US",
            price_increase_percent: room.price_increase_percent ?? 20,
          })),
          language: params.language || "en",
          currency: params.currency || "USD",
        }),
      };

      let response: MultiroomPrebookResponse;
      try {
        response = await this.fetchWithError<MultiroomPrebookResponse>(url, requestInit);
      } catch (error) {
        console.warn("Multiroom prebook failed, retrying once...", error);
        await new Promise((r) => setTimeout(r, 1200));
        response = await this.fetchWithError<MultiroomPrebookResponse>(url, requestInit);
      }

      console.log("📥 Multiroom Prebook response:", {
        total: response.data?.total_rooms,
        successful: response.data?.successful_rooms,
        failed: response.data?.failed_rooms,
      });
      return response;
    }

    // Single room prebook (existing logic)
    console.log("📤 Prebook request:", { ...params, userId });

    const requestInit: RequestInit = {
      method: "POST",
      body: JSON.stringify({
        userId,
        hash: params.book_hash,
        book_hash: params.book_hash,
        residency: params.residency,
        currency: params.currency || "USD",
        price_increase_percent: params.price_increase_percent ?? 20,
      }),
    };

    let response: PrebookResponse;
    try {
      response = await this.fetchWithError<PrebookResponse>(url, requestInit);
    } catch (error) {
      console.warn("Prebook failed, retrying once...", error);
      await new Promise((r) => setTimeout(r, 1200));
      response = await this.fetchWithError<PrebookResponse>(url, requestInit);
    }

    console.log("📥 Prebook response:", response);
    return response;
  }

  /**
   * Helper: Recover existing order by partner_order_id when double_booking_form occurs
   * Uses getOrdersBatch to find the already-created order
   */
  async recoverOrderByPartnerOrderId(partnerOrderId: string): Promise<{
    order_id: string;
    item_id: string;
    payment_types: any[];
  } | null> {
    try {
      console.log("🔄 Attempting to recover existing order for:", partnerOrderId);
      
      const response = await this.getOrdersBatch({
        partnerOrderIds: [partnerOrderId],
        pageSize: 1,
      });
      
      if (response.data?.orders?.length > 0) {
        const order = response.data.orders[0] as any; // Use any for flexible property access
        console.log("✅ Recovered existing order:", order.order_id);
        
        // Extract item_id from various possible locations in the response
        const itemId = order.item_id || 
                      order.rooms_data?.[0]?.item_id || 
                      order.rooms?.[0]?.item_id || 
                      "";
        
        // Extract payment types - may be in payment_data or as payment_types array
        const paymentTypes = order.payment_types || 
                            (order.payment_data?.payment_type ? [{ type: order.payment_data.payment_type }] : []);
        
        return {
          order_id: String(order.order_id),
          item_id: String(itemId),
          payment_types: paymentTypes,
        };
      }
      
      console.warn("⚠️ No existing order found for partner_order_id:", partnerOrderId);
      return null;
    } catch (error) {
      console.error("❌ Failed to recover order:", error);
      return null;
    }
  }

  /**
   * Step 3: Get Order Booking Form - Retrieve required guest fields
   * RateHawk Best Practices Section 5.3: Retry up to 10 times on 5xx, timeout, or unknown errors
   * Recovers from double_booking_form by fetching the existing order
   * @param bookHash - The book_hash from prebook response
   * @param partnerOrderId - Required unique partner order ID
   */
  async getOrderForm(bookHash: string, partnerOrderId: string): Promise<OrderFormResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_FORM}`;
    const userId = this.getCurrentUserId();
    const userIp = await this.getUserIp();

    if (!bookHash || !partnerOrderId) {
      throw new Error("Missing required fields: book_hash or partner_order_id");
    }

    const requestBody = {
      userId,
      book_hash: bookHash,
      partner_order_id: partnerOrderId,
      language: "en",
      user_ip: userIp,
    };

    console.log("📤 Order form request:", requestBody);

    const MAX_RETRIES = 10;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < MAX_RETRIES) {
      attempt++;
      
      try {
        const response = await this.fetchWithError<OrderFormResponse>(url, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        // Check for retryable errors in response
        if (response.error?.code) {
          const errorCode = response.error.code.toLowerCase();
          
          // Handle double_booking_form by recovering the existing order
          if (errorCode === "double_booking_form") {
            console.warn("⚠️ double_booking_form from API response - attempting recovery");
            const recovered = await this.recoverOrderByPartnerOrderId(partnerOrderId);
            if (recovered) {
              // Return minimal response with recovered data - cast through unknown for type safety
              return {
                status: "ok",
                data: {
                  order_id: recovered.order_id,
                  item_id: recovered.item_id,
                  payment_types: recovered.payment_types,
                  _recovered: true,
                  // Provide required fields with empty defaults for type compatibility
                  required_fields: [],
                  rooms: [],
                  payment_types_available: recovered.payment_types.map((pt: any) => pt.type || pt),
                  final_price: { amount: "0", currency_code: "USD" },
                },
              } as unknown as OrderFormResponse;
            }
            throw new Error("Booking session expired. Please return to hotel details and start a new booking.");
          }
          
          // Non-retryable errors - fail immediately
          if (["contract_mismatch", "duplicate_reservation", 
               "hotel_not_found", "insufficient_b2b_balance", "reservation_is_not_allowed",
               "rate_not_found", "sandbox_restriction"].includes(errorCode)) {
            console.error(`❌ Order form non-retryable error: ${errorCode}`);
            throw new Error(response.error.message || `Booking failed: ${errorCode}`);
          }
          
          // Retryable errors - continue loop
          if (["timeout", "unknown"].includes(errorCode) && attempt < MAX_RETRIES) {
            console.warn(`⚠️ Order form attempt ${attempt}/${MAX_RETRIES} got ${errorCode}, retrying...`);
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }
        }

        // Success
        console.log("📥 Order form response:", response);
        return response;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMsg = lastError.message.toLowerCase();
        
        // Check for double_booking_form in error message - attempt recovery
        if (errorMsg.includes("double_booking_form") || errorMsg.includes("double booking form")) {
          console.warn("⚠️ double_booking_form in error message - attempting recovery");
          const recovered = await this.recoverOrderByPartnerOrderId(partnerOrderId);
          if (recovered) {
            // Return minimal response with recovered data - cast through unknown for type safety
            return {
              status: "ok",
              data: {
                order_id: recovered.order_id,
                item_id: recovered.item_id,
                payment_types: recovered.payment_types,
                _recovered: true,
                // Provide required fields with empty defaults for type compatibility
                required_fields: [],
                rooms: [],
                payment_types_available: recovered.payment_types.map((pt: any) => pt.type || pt),
                final_price: { amount: "0", currency_code: "USD" },
              },
            } as unknown as OrderFormResponse;
          }
          throw new Error("Booking session expired. Please return to hotel details and start a new booking.");
        }
        
        // Check if it's a 5xx error or network error (retryable)
        const is5xxError = errorMsg.includes("5") && errorMsg.includes("http");
        const isNetworkError = errorMsg.includes("network") || errorMsg.includes("fetch");
        
        if ((is5xxError || isNetworkError) && attempt < MAX_RETRIES) {
          console.warn(`⚠️ Order form attempt ${attempt}/${MAX_RETRIES} failed, retrying...`, error);
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }
        
        // Non-retryable error
        throw lastError;
      }
    }

    // All retries exhausted
    console.error(`❌ Order form failed after ${MAX_RETRIES} attempts`);
    throw lastError || new Error("Order form request failed after maximum retries");
  }

  /**
   * Step 3b: Get Multiroom Order Form - Retrieve order forms for multiple rooms
   * @param prebookedRooms - Array of book_hash from multiroom prebook response
   * @param partnerOrderId - Required unique partner order ID (same for all rooms)
   */
  async getMultiroomOrderForm(
    prebookedRooms: Array<{ book_hash: string }>,
    partnerOrderId: string,
    language: string = "en"
  ): Promise<MultiroomOrderFormResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_FORM}`;
    const userId = this.getCurrentUserId();
    const userIp = await this.getUserIp();

    if (!prebookedRooms.length || !partnerOrderId) {
      throw new Error("Missing required fields: prebooked_rooms or partner_order_id");
    }

    const requestBody = {
      userId,
      // Some backend validators still require a top-level book_hash even for multiroom;
      // we provide the first prebooked room hash (p-...) for compatibility.
      book_hash: prebookedRooms[0]?.book_hash,
      prebooked_rooms: prebookedRooms,
      partner_order_id: partnerOrderId,
      language,
      user_ip: userIp,
    };

    console.log("📤 Multiroom Order form request:", { 
      rooms: prebookedRooms.length, 
      partnerOrderId 
    });

    const MAX_RETRIES = 10;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < MAX_RETRIES) {
      attempt++;
      
      try {
        const response = await this.fetchWithError<MultiroomOrderFormResponse>(url, {
          method: "POST",
          body: JSON.stringify(requestBody),
        });

        // Check for retryable errors
        if (response.error?.code) {
          const errorCode = response.error.code.toLowerCase();
          
          if (["contract_mismatch", "double_booking_form", "duplicate_reservation", 
               "hotel_not_found", "insufficient_b2b_balance", "reservation_is_not_allowed",
               "rate_not_found", "sandbox_restriction"].includes(errorCode)) {
            console.error(`❌ Multiroom order form non-retryable error: ${errorCode}`);
            throw new Error(response.error.message || `Booking failed: ${errorCode}`);
          }
          
          if (["timeout", "unknown"].includes(errorCode) && attempt < MAX_RETRIES) {
            console.warn(`⚠️ Multiroom order form attempt ${attempt}/${MAX_RETRIES} got ${errorCode}, retrying...`);
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }
        }

        console.log("📥 Multiroom Order form response:", {
          total: response.data?.total_rooms,
          successful: response.data?.successful_rooms,
          failed: response.data?.failed_rooms,
        });
        return response;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMsg = lastError.message.toLowerCase();
        
        const is5xxError = errorMsg.includes("5") && errorMsg.includes("http");
        const isNetworkError = errorMsg.includes("network") || errorMsg.includes("fetch");
        
        if ((is5xxError || isNetworkError) && attempt < MAX_RETRIES) {
          console.warn(`⚠️ Multiroom order form attempt ${attempt}/${MAX_RETRIES} failed, retrying...`, error);
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }
        
        throw lastError;
      }
    }

    console.error(`❌ Multiroom order form failed after ${MAX_RETRIES} attempts`);
    throw lastError || new Error("Multiroom order form request failed after maximum retries");
  }

  /**
   * Step 4: Order Booking Finish - Complete the booking
   * Supports both single-room and multiroom formats
   * @param params - Must include order_id and item_id from form response
   */
  async finishBooking(params: OrderFinishParams): Promise<OrderFinishResponse>;
  async finishBooking(params: MultiroomOrderFinishParams): Promise<MultiroomOrderFinishResponse>;
  async finishBooking(params: OrderFinishParams | MultiroomOrderFinishParams): Promise<OrderFinishResponse | MultiroomOrderFinishResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_FINISH}`;
    const userId = this.getCurrentUserId();

    // Detect if multiroom request
    if (isMultiroomOrderFinishParams(params)) {
      console.log("📤 Multiroom Order finish request:", { 
        rooms: params.rooms.length,
        partner_order_id: params.partner_order_id,
        payment_type: params.payment_type,
      });

      const response = await this.fetchWithError<MultiroomOrderFinishResponse>(url, {
        method: "POST",
        body: JSON.stringify({
          userId,
          rooms: params.rooms.map(room => ({
            order_id: room.order_id,
            item_id: room.item_id,
            guests: room.guests,
          })),
          payment_type: params.payment_type,
          payment_amount: params.payment_amount,
          payment_currency_code: params.payment_currency_code,
          email: params.email,
          phone: params.phone,
          partner_order_id: params.partner_order_id,
          language: params.language || "en",
          upsell_data: params.upsell_data,
        }),
      });

      console.log("📥 Multiroom Order finish response:", {
        total: response.data?.total_rooms,
        successful: response.data?.successful_rooms,
        failed: response.data?.failed_rooms,
        order_ids: response.data?.order_ids,
      });
      return response;
    }

    // Single room finish (existing logic)
    if (!params.order_id || !params.item_id || !params.partner_order_id) {
      throw new Error("Missing required booking fields: order_id, item_id, or partner_order_id");
    }

    // Validate required contact info
    if (!params.email) {
      throw new Error("Email is required to complete booking");
    }

    console.log("📤 Order finish request:", { ...params, userId });

    // Transform guests to the correct format: [{ guests: [...] }]
    const guestsPayload = [{
      guests: params.guests.map(g => ({
        first_name: g.first_name,
        last_name: g.last_name,
        is_child: g.is_child || false,
        ...(g.is_child && g.age ? { age: g.age } : {}),
      })),
    }];

    const response = await this.fetchWithError<OrderFinishResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        order_id: params.order_id,
        item_id: params.item_id,
        partner_order_id: params.partner_order_id,
        payment_type: params.payment_type,
        payment_amount: params.payment_amount,
        payment_currency_code: params.payment_currency_code,
        guests: guestsPayload,
        email: params.email,
        phone: params.phone,
        user_ip: params.user_ip,
        language: params.language || "en",
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
    // Return mock response for demo orders
    if (isDemoOrder(orderId)) {
      console.log("📤 Get demo order status (mock):", { orderId });
      return MOCK_API_RESPONSES.orderStatus(orderId) as OrderStatusResponse;
    }

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
    // Return mock response for demo orders
    if (isDemoOrder(orderId)) {
      console.log("📤 Get demo order info (mock):", { orderId });
      return MOCK_API_RESPONSES.orderInfo(orderId) as unknown as OrderInfoResponse;
    }

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
   * Batch retrieve orders with filtering and pagination
   * Uses the RateHawk /api/b2b/v3/hotel/order/info/ endpoint
   * More efficient than individual fetches for My Bookings page
   */
  async getOrdersBatch(params: {
    orderIds?: number[];
    partnerOrderIds?: string[];
    page?: number;
    pageSize?: number;
    fromDate?: string;
    toDate?: string;
    status?: Array<"confirmed" | "cancelled" | "processing" | "failed">;
    orderingBy?: "created_at" | "checkin_at" | "checkout_at";
    orderingType?: "asc" | "desc";
  } = {}): Promise<RateHawkOrderInfoBatchResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_INFO_BATCH}`;
    const userId = this.getCurrentUserId();

    const requestBody: OrderInfoBatchRequest = {
      ordering: {
        ordering_type: params.orderingType || "desc",
        ordering_by: params.orderingBy || "created_at",
      },
      pagination: {
        page_size: String(params.pageSize || 20),
        page_number: String(params.page || 1),
      },
      search: {
        order_id: params.orderIds,
        partner_order_id: params.partnerOrderIds,
        status: params.status,
        created_at: params.fromDate ? {
          from_date: params.fromDate,
          to_date: params.toDate,
        } : undefined,
      },
      language: "en",
    };

    // Clean up undefined search fields
    if (requestBody.search) {
      Object.keys(requestBody.search).forEach(key => {
        if ((requestBody.search as Record<string, unknown>)[key] === undefined) {
          delete (requestBody.search as Record<string, unknown>)[key];
        }
      });
      if (Object.keys(requestBody.search).length === 0) {
        delete requestBody.search;
      }
    }

    console.log("📤 Batch order info request:", {
      orderIds: params.orderIds?.length,
      partnerOrderIds: params.partnerOrderIds?.length,
      page: params.page,
      pageSize: params.pageSize,
    });

    const response = await this.fetchWithError<RateHawkOrderInfoBatchResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        ...requestBody,
      }),
    });

    console.log("📥 Batch order info response:", {
      total: response.data?.total_orders,
      found: response.data?.found_orders,
      page: response.data?.current_page_number,
    });

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

  /**
   * Step 4a: Create Credit Card Token (Payota API)
   * Required for card payment types before starting booking
   */
  async createCreditCardToken(params: PayotaTokenRequest): Promise<PayotaTokenResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.CREATE_CARD_TOKEN}`;
    const userId = this.getCurrentUserId();

    console.log("💳 Create card token request:", {
      object_id: params.object_id,
      pay_uuid: params.pay_uuid,
      init_uuid: params.init_uuid,
      user_first_name: params.user_first_name,
      user_last_name: params.user_last_name,
      is_cvc_required: params.is_cvc_required,
      // Don't log sensitive card data
    });

    const response = await this.fetchWithError<PayotaTokenResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        ...params,
      }),
    });

    console.log("💳 Card token response:", { status: response.status });
    return response;
  }

  /**
   * Step 4b: Start Booking Process
   * Called after card tokenization for card payments
   */
  async startBooking(orderId: string, paymentType: {
    type: "deposit" | "hotel" | "now";
    currency_code: string;
    pay_uuid?: string;
    init_uuid?: string;
  }): Promise<OrderFinishResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.BOOKING_START}`;
    const userId = this.getCurrentUserId();

    console.log("🚀 Start booking request:", { orderId, paymentType, userId });

    const response = await this.fetchWithError<OrderFinishResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        order_id: orderId,
        payment_type: paymentType,
      }),
    });

    console.log("🚀 Start booking response:", response);
    return response;
  }

  /**
   * Step 5b: Check Booking Status (alternative endpoint)
   * Poll this for real-time booking status
   */
  async checkBookingStatus(orderId: string): Promise<OrderStatusResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.BOOKING_STATUS}/${orderId}`;
    const userId = this.getCurrentUserId();

    console.log("📊 Check booking status:", { orderId, userId });

    const response = await this.fetchWithError<OrderStatusResponse>(url, {
      method: "GET",
      headers: {
        "X-User-Id": userId,
      },
    });

    console.log("📊 Booking status response:", response);
    return response;
  }

  /**
   * Helper: Poll multiple room order statuses in parallel
   * For multiroom bookings - polls all order IDs simultaneously
   */
  async pollMultiroomOrderStatuses(
    orderIds: string[],
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onStatusUpdate?: (statuses: Map<string, string>, attempt: number) => void;
    } = {}
  ): Promise<Map<string, OrderStatusResponse>> {
    const { maxAttempts = 20, intervalMs = 3000, onStatusUpdate } = options;
    const results = new Map<string, OrderStatusResponse>();
    const statuses = new Map<string, string>();
    let attempts = 0;
    let pendingOrderIds = [...orderIds];

    console.log(`📊 Starting multiroom status polling for ${orderIds.length} orders`);

    while (attempts < maxAttempts && pendingOrderIds.length > 0) {
      attempts++;
      
      try {
        // Poll all pending orders in parallel
        const pollPromises = pendingOrderIds.map(async (orderId) => {
          try {
            const response = await this.getOrderStatus(orderId);
            return { orderId, response, error: null };
          } catch (error) {
            return { orderId, response: null, error };
          }
        });

        const pollResults = await Promise.all(pollPromises);

        // Process results
        const stillPending: string[] = [];
        for (const { orderId, response, error } of pollResults) {
          if (error) {
            console.warn(`Status poll for order ${orderId} failed:`, error);
            stillPending.push(orderId);
            continue;
          }

          if (response) {
            const status = response.data?.status;
            statuses.set(orderId, status);

            if (status === "confirmed" || status === "failed" || status === "cancelled") {
              results.set(orderId, response);
            } else {
              stillPending.push(orderId);
            }
          }
        }

        pendingOrderIds = stillPending;
        onStatusUpdate?.(statuses, attempts);

        if (pendingOrderIds.length === 0) {
          console.log(`✅ All ${orderIds.length} orders reached final status`);
          break;
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } catch (error) {
        console.error(`Multiroom status poll attempt ${attempts} failed:`, error);
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
      }
    }

    // For any orders still pending, add them with whatever status we have
    if (pendingOrderIds.length > 0) {
      console.warn(`⚠️ ${pendingOrderIds.length} orders still processing after ${maxAttempts} attempts`);
    }

    return results;
  }

  // ============================================
  // POST-BOOKING OPERATIONS
  // ============================================

  /**
   * Cancel a booking
   * @param orderId - The order ID to cancel
   * @param reason - Optional cancellation reason
   * @param language - Language code (default: "en")
   */
  async cancelBooking(orderId: string, reason?: string, language: string = "en"): Promise<CancellationResponse> {
    // Return mock response for demo orders
    if (isDemoOrder(orderId)) {
      console.log("🚫 Cancel demo booking (mock):", { orderId });
      return MOCK_API_RESPONSES.cancellation(orderId);
    }

    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.CANCEL_BOOKING}`;
    const userId = this.getCurrentUserId();

    console.log("🚫 Cancel booking request:", { orderId, reason, language, userId });

    const response = await this.fetchWithError<CancellationResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        order_id: orderId,
        language,
        reason,
      }),
    });

    console.log("🚫 Cancel booking response:", response);
    return response;
  }

  /**
   * Get contract data (account level)
   * Backend mock: GET /api/ratehawk/contract/data
   */
  async getContractData(): Promise<ContractDataResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.CONTRACT_DATA}`;
    const userId = this.getCurrentUserId();

    console.log("📋 Get contract data request:", { userId });

    const response = await this.fetchWithError<ContractDataResponse>(url, {
      method: "GET",
      headers: {
        "X-User-Id": userId,
      },
    });

    console.log("📋 Get contract data response:", response);
    return response;
  }

  /**
   * Get financial information (account level)
   * Backend mock: GET /api/ratehawk/financial/info
   */
  async getFinancialInfo(): Promise<FinancialInfoResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.FINANCIAL_INFO}`;
    const userId = this.getCurrentUserId();

    console.log("💰 Get financial info request:", { userId });

    const response = await this.fetchWithError<FinancialInfoResponse>(url, {
      method: "GET",
      headers: {
        "X-User-Id": userId,
      },
    });

    console.log("💰 Get financial info response:", response);
    return response;
  }

  /**
   * Get closing documents info (account level)
   * Backend mock: GET /api/ratehawk/document/closing/info
   */
  async getClosingDocumentsInfo(): Promise<ClosingDocumentsInfoResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.CLOSING_DOCS_INFO}`;
    const userId = this.getCurrentUserId();

    console.log("📄 Get closing documents info request:", { userId });

    const response = await this.fetchWithError<ClosingDocumentsInfoResponse>(url, {
      method: "GET",
      headers: {
        "X-User-Id": userId,
      },
    });

    console.log("📄 Get closing documents info response:", response);
    return response;
  }

  /**
   * Download a closing document
   * Backend mock: POST /api/ratehawk/document/closing/download
   * @param documentId - The document ID to download
   */
  async downloadClosingDocument(documentId: string): Promise<ClosingDocumentDownloadResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.CLOSING_DOCS_DOWNLOAD}`;
    const userId = this.getCurrentUserId();

    console.log("⬇️ Download closing document request:", { documentId, userId });

    const response = await this.fetchWithError<ClosingDocumentDownloadResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        document_id: documentId,
      }),
    });

    console.log("⬇️ Download closing document response:", response);
    return response;
  }

  /**
   * Download voucher for an order
   * Backend mock: POST /api/ratehawk/order/voucher/download
   * @param partnerOrderId - The partner order ID (booking ID)
   * @param language - Language code (default: "en")
   */
  async downloadVoucher(partnerOrderId: string, language: string = "en"): Promise<VoucherDownloadResponse> {
    // Return mock response for demo orders
    if (isDemoOrder(partnerOrderId)) {
      console.log("🎫 Download demo voucher (mock):", { partnerOrderId });
      return MOCK_API_RESPONSES.voucher(partnerOrderId, partnerOrderId);
    }

    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.VOUCHER_DOWNLOAD}`;
    const userId = this.getCurrentUserId();

    console.log("🎫 Download voucher request:", { partnerOrderId, language, userId });

    const response = await this.fetchWithError<VoucherDownloadResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        partner_order_id: partnerOrderId,
        language,
      }),
    });

    console.log("🎫 Download voucher response:", response);
    return response;
  }

  /**
   * Download invoice for an order
   * Backend mock: POST /api/ratehawk/order/invoice/info/download
   * @param orderId - The order ID
   */
  async downloadInvoice(orderId: string): Promise<InvoiceDownloadResponse> {
    // Return mock response for demo orders
    if (isDemoOrder(orderId)) {
      console.log("🧾 Download demo invoice (mock):", { orderId });
      return MOCK_API_RESPONSES.invoice(orderId);
    }

    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.INVOICE_DOWNLOAD}`;
    const userId = this.getCurrentUserId();

    console.log("🧾 Download invoice request:", { orderId, userId });

    const response = await this.fetchWithError<InvoiceDownloadResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        order_id: orderId,
      }),
    });

    console.log("🧾 Download invoice response:", response);
    return response;
  }

  /**
   * Download order group invoice (for trips with multiple orders)
   * Backend mock: POST /api/ratehawk/ordergroup/invoice/download
   * @param invoiceId - The invoice ID
   */
  async downloadOrderGroupInvoice(invoiceId: string): Promise<OrderGroupInvoiceResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.ORDER_GROUP_INVOICE}`;
    const userId = this.getCurrentUserId();

    console.log("📑 Download order group invoice request:", { invoiceId, userId });

    const response = await this.fetchWithError<OrderGroupInvoiceResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        invoice_id: invoiceId,
      }),
    });

    console.log("📑 Download order group invoice response:", response);
    return response;
  }

  /**
   * Download single act document
   * Backend mock: POST /api/ratehawk/order/act/download
   * @param orderId - The order ID
   */
  async downloadSingleAct(orderId: string): Promise<ActDownloadResponse> {
    const url = `${API_BASE_URL}${BOOKING_ENDPOINTS.SINGLE_ACT_DOWNLOAD}`;
    const userId = this.getCurrentUserId();

    console.log("📃 Download single act request:", { orderId, userId });

    const response = await this.fetchWithError<ActDownloadResponse>(url, {
      method: "POST",
      body: JSON.stringify({
        userId,
        order_id: orderId,
      }),
    });

    console.log("📃 Download single act response:", response);
    return response;
  }

  /**
   * Helper: Trigger file download from a URL
   * @param downloadUrl - The URL to download from
   * @param fileName - The file name for the download
   */
  triggerDownload(downloadUrl: string, fileName: string): void {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const bookingApi = new BookingApiService();
