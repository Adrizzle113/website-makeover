// WorldOTA Order Info Edge Function
// Fetches complete order details from WorldOTA API

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderInfoRequest {
  order_id: string;
  language?: string;
}

/**
 * Extract taxes from order-level taxes array (not room data)
 * Separates included vs not included fees
 */
function extractTaxes(orderTaxes: any[]): { included: any[]; notIncluded: any[] } {
  const included: any[] = [];
  const notIncluded: any[] = [];
  
  for (const tax of orderTaxes || []) {
    const taxInfo = {
      name: tax.name || 'Tax',
      amount: tax.amount?.amount || tax.amount || '0',
      currency: tax.amount?.currency_code || tax.currency_code || 'USD',
      included_by_supplier: tax.is_included ?? tax.included_by_supplier ?? false,
    };
    
    if (taxInfo.included_by_supplier) {
      included.push(taxInfo);
    } else {
      notIncluded.push(taxInfo);
    }
  }
  
  return { included, notIncluded };
}

/**
 * Extract deposit information from hotel/room data
 */
function extractDepositInfo(hotelData: any, roomsData: any[]): string[] {
  const deposits: string[] = [];
  
  // Check for deposit in hotel data
  if (hotelData?.deposit) {
    if (typeof hotelData.deposit === 'string') {
      deposits.push(hotelData.deposit);
    } else if (Array.isArray(hotelData.deposit)) {
      deposits.push(...hotelData.deposit);
    }
  }
  
  // Check room-level deposit info
  for (const room of roomsData || []) {
    if (room.deposit) {
      deposits.push(room.deposit);
    }
  }
  
  return deposits;
}

/**
 * Extract guest count from room data
 */
function extractGuestCounts(roomsData: any[]): { adults: number; children: number } {
  const firstRoom = roomsData?.[0];
  const guestData = firstRoom?.guest_data;
  
  return {
    adults: guestData?.adults_number || guestData?.guests?.filter((g: any) => !g.is_child).length || 0,
    children: guestData?.children_number || guestData?.guests?.filter((g: any) => g.is_child).length || 0,
  };
}

/**
 * Transform WorldOTA batch response format to expected frontend format
 */
function transformOrderResponse(worldotaOrder: any) {
  const firstRoom = worldotaOrder.rooms_data?.[0];
  const firstGuest = firstRoom?.guest_data?.guests?.[0];
  
  // Extract taxes from order-level (not room-level)
  const taxes = extractTaxes(worldotaOrder.taxes);
  
  // Extract deposit info
  const deposits = extractDepositInfo(worldotaOrder.hotel_data, worldotaOrder.rooms_data);
  
  // Extract guest counts
  const guestCounts = extractGuestCounts(worldotaOrder.rooms_data);
  
  // Build cancellation policy text
  let cancellationPolicyText = null;
  if (worldotaOrder.cancellation_info?.penalties) {
    const penalties = worldotaOrder.cancellation_info.penalties;
    if (Array.isArray(penalties) && penalties.length > 0) {
      cancellationPolicyText = penalties.map((p: any) => {
        const amount = p.amount?.amount || p.amount || 'full booking amount';
        const currency = p.amount?.currency_code || '';
        const fromDate = p.from_date ? new Date(p.from_date).toLocaleDateString() : '';
        return `From ${fromDate}: ${amount} ${currency} penalty`;
      }).join('; ');
    }
  }
  
  // Extract bedding from first room
  const bedding = firstRoom?.bedding_name;
  
  return {
    order_id: String(worldotaOrder.order_id),
    partner_order_id: worldotaOrder.partner_data?.order_id || null,
    order_group_id: worldotaOrder.order_group_id ? String(worldotaOrder.order_group_id) : null,
    status: worldotaOrder.status,
    confirmation_number: worldotaOrder.supplier_data?.confirmation_id || String(worldotaOrder.order_id),
    created_at: worldotaOrder.created_at,
    updated_at: worldotaOrder.modified_at,
    
    // Transform dates to expected nested format
    dates: {
      check_in: worldotaOrder.checkin_at,
      check_out: worldotaOrder.checkout_at,
      nights: worldotaOrder.nights,
    },
    
    // Hotel data - WorldOTA only gives ID, not name/address
    hotel: {
      id: worldotaOrder.hotel_data?.id,
      hid: worldotaOrder.hotel_data?.hid,
      name: worldotaOrder.hotel_data?.name || null,
      address: worldotaOrder.hotel_data?.address || null,
      city: worldotaOrder.hotel_data?.city || null,
      country: worldotaOrder.hotel_data?.country || null,
      star_rating: worldotaOrder.hotel_data?.star_rating || null,
      phone: worldotaOrder.hotel_data?.phone || null,
      latitude: worldotaOrder.hotel_data?.latitude || null,
      longitude: worldotaOrder.hotel_data?.longitude || null,
      check_in_time: worldotaOrder.hotel_data?.check_in_time || "14:00:00",
      check_out_time: worldotaOrder.hotel_data?.check_out_time || "12:00:00",
    },
    
    // Transform room data
    room: firstRoom ? {
      name: firstRoom.room_name,
      meal_plan: firstRoom.meal_name,
      meal_name: firstRoom.meal_name,
      bedding: bedding,
      bedding_name: bedding,
      has_breakfast: firstRoom.has_breakfast || false,
      no_child_meal: firstRoom.no_child_meal || false,
      guests: firstRoom.guest_data?.guests?.map((g: any) => ({
        first_name: g.first_name,
        last_name: g.last_name,
        is_child: g.is_child,
        age: g.age,
      })) || [],
    } : null,
    
    // Guest counts
    guest_counts: guestCounts,
    
    // Lead guest from first room's first guest
    lead_guest: firstGuest ? {
      first_name: firstGuest.first_name,
      last_name: firstGuest.last_name,
      email: worldotaOrder.user_data?.email,
      phone: null,
    } : null,
    
    // Price data
    price: {
      amount: worldotaOrder.amount_sell?.amount,
      currency_code: worldotaOrder.amount_sell?.currency_code,
    },
    
    // Payment data
    payment: {
      type: worldotaOrder.payment_data?.payment_type,
      status: worldotaOrder.payment_data?.paid_at ? "paid" : "pending",
      due_date: worldotaOrder.payment_data?.payment_due,
    },
    
    // Cancellation info
    cancellation_info: worldotaOrder.cancellation_info,
    cancellation_policy_text: cancellationPolicyText,
    is_cancellable: worldotaOrder.is_cancellable,
    free_cancellation_before: worldotaOrder.cancellation_info?.free_cancellation_before || null,
    
    // Taxes: separated into included and not included
    taxes_included: taxes.included,
    taxes_not_included: taxes.notIncluded,
    
    // Deposits array
    deposits: deposits,
    
    // Special requests
    special_requests: firstRoom?.special_requests || null,
    
    // Include raw data for debugging/fallback
    _raw: worldotaOrder,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { order_id, language = "en" }: OrderInfoRequest = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ status: "error", error: { message: "order_id is required" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[worldota-order-info] Fetching order info for: ${order_id}`);

    // Get WorldOTA credentials
    const keyId = Deno.env.get("WORLDOTA_KEY_ID");
    const apiKey = Deno.env.get("WORLDOTA_API_KEY");

    if (!keyId || !apiKey) {
      console.error("[worldota-order-info] Missing WorldOTA credentials");
      return new Response(
        JSON.stringify({ status: "error", error: { message: "WorldOTA credentials not configured" } }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Basic Auth header
    const authHeader = `Basic ${btoa(`${keyId}:${apiKey}`)}`;

    // Call WorldOTA order/info batch endpoint with correct format
    const requestBody = {
      ordering: {
        ordering_type: "desc",
        ordering_by: "created_at"
      },
      pagination: {
        page_size: "1",
        page_number: "1"
      },
      search: {
        order_id: [Number(order_id)]
      },
      language: language,
    };

    console.log(`[worldota-order-info] Request body:`, JSON.stringify(requestBody));

    const response = await fetch("https://api.worldota.net/api/b2b/v3/hotel/order/info/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[worldota-order-info] API error: ${response.status}`, data);
      
      // If 401, try with swapped credentials
      if (response.status === 401) {
        console.log("[worldota-order-info] Retrying with swapped credentials...");
        const swappedAuthHeader = `Basic ${btoa(`${apiKey}:${keyId}`)}`;
        
        const retryResponse = await fetch("https://api.worldota.net/api/b2b/v3/hotel/order/info/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": swappedAuthHeader,
          },
          body: JSON.stringify(requestBody),
        });

        const retryData = await retryResponse.json();
        
        if (retryResponse.ok) {
          console.log(`[worldota-order-info] Success with swapped credentials for order: ${order_id}`);
          const orders = retryData.data?.orders || [];
          if (orders.length === 0) {
            return new Response(
              JSON.stringify({ status: "error", error: { message: "Order not found" } }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          // Transform and return
          const transformedOrder = transformOrderResponse(orders[0]);
          return new Response(
            JSON.stringify({ status: "ok", data: transformedOrder }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ status: "error", error: { message: "Authentication failed", details: retryData } }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ status: "error", error: { message: "Failed to fetch order info", details: data } }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract single order from batch response
    const orders = data.data?.orders || [];
    if (orders.length === 0) {
      console.log(`[worldota-order-info] Order not found: ${order_id}`);
      return new Response(
        JSON.stringify({ status: "error", error: { message: "Order not found" } }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[worldota-order-info] Successfully fetched order info for: ${order_id}`);
    
    // Transform to expected format and return
    const transformedOrder = transformOrderResponse(orders[0]);
    return new Response(
      JSON.stringify({ status: "ok", data: transformedOrder }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[worldota-order-info] Error:", error);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        error: { message: error instanceof Error ? error.message : "Unknown error" } 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
