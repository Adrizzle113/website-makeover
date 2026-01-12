// Booking storage service - saves confirmed bookings to Supabase
import { supabase } from "@/integrations/supabase/client";
import { bookingApi } from "@/services/bookingApi";
import type { 
  UserBookingRow, 
  UserBookingInsert, 
  UserBooking,
  RoomData,
  GuestData,
} from "@/types/userBooking";
import { transformBookingRow } from "@/types/userBooking";
import type { OrderInfoResponse, PendingBookingData } from "@/types/etgBooking";
import { isDemoOrder, getMockPendingBookingData } from "@/lib/mockBookingData";

// Table name constant
const TABLE_NAME = "user_bookings";

/**
 * Get the current authenticated user's ID
 */
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Save a booking to the Supabase database
 * Called after a booking is confirmed on BookingConfirmationPage
 */
export async function saveBookingToDatabase(
  orderId: string,
  pendingData?: PendingBookingData,
  apiResponse?: OrderInfoResponse
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn("No authenticated user, cannot save booking to database");
      return { success: false, error: "User not authenticated" };
    }

    // For demo orders, use mock data if no pending data provided
    const isDemo = isDemoOrder(orderId);
    if (isDemo && !pendingData) {
      pendingData = getMockPendingBookingData(orderId);
      console.log("📦 Using mock pending data for demo order:", orderId);
    }

    // Check if booking already exists using raw query
    const { data: existing, error: checkError } = await supabase
      .from(TABLE_NAME as any)
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (checkError) {
      // Table might not exist yet - return gracefully
      console.warn("Could not check for existing booking:", checkError.message);
      return { success: false, error: "Database table not ready. Please run the migration first." };
    }

    if (existing) {
      console.log("Booking already exists in database:", orderId);
      return { success: true };
    }

    // Build insert data from pending booking and/or API response
    const insertData = buildInsertData(orderId, userId, pendingData, apiResponse);

    const { error } = await supabase
      .from(TABLE_NAME as any)
      .insert(insertData as any);

    if (error) {
      console.error("Failed to save booking:", error);
      return { success: false, error: error.message };
    }

    console.log("Booking saved to database:", orderId);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error saving booking:", message);
    return { success: false, error: message };
  }
}

/**
 * Build the insert data from available sources
 */
function buildInsertData(
  orderId: string,
  userId: string,
  pendingData?: PendingBookingData,
  apiResponse?: OrderInfoResponse
): UserBookingInsert {
  const apiData = apiResponse?.data;
  
  // Prefer API response data, fall back to pending booking data
  const checkIn = apiData?.dates?.check_in || 
    (typeof pendingData?.searchParams?.checkIn === 'string' 
      ? pendingData.searchParams.checkIn 
      : pendingData?.searchParams?.checkIn?.toISOString?.()?.split("T")[0] || new Date().toISOString().split("T")[0]);
  
  const checkOut = apiData?.dates?.check_out || 
    (typeof pendingData?.searchParams?.checkOut === 'string' 
      ? pendingData.searchParams.checkOut 
      : pendingData?.searchParams?.checkOut?.toISOString?.()?.split("T")[0] || new Date().toISOString().split("T")[0]);

  // Build rooms data
  const roomsData: RoomData[] = pendingData?.rooms?.map(r => ({
    roomId: r.roomId,
    roomName: r.roomName,
    quantity: r.quantity,
  })) || (apiData?.room ? [{
    roomId: "room-1",
    roomName: apiData.room.name,
    mealPlan: apiData.room.meal_plan,
    quantity: 1,
  }] : []);

  // Build guests data
  const guestsData: GuestData[] = pendingData?.guests?.map(g => ({
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email,
    type: g.type,
    age: g.age,
    isLead: g.isLead,
  })) || apiData?.room?.guests?.map((g, i) => ({
    firstName: g.first_name,
    lastName: g.last_name,
    type: g.is_child ? "child" as const : "adult" as const,
    age: g.age,
    isLead: i === 0,
  })) || [];

  const leadGuest = guestsData.find(g => g.isLead) || guestsData[0];

  return {
    user_id: userId,
    order_id: orderId,
    partner_order_id: pendingData?.bookingId,
    order_group_id: apiData?.order_group_id,
    status: apiData?.status || "confirmed",
    confirmation_number: apiData?.confirmation_number || orderId,
    hotel_id: pendingData?.hotel?.id || apiData?.hotel?.id,
    hotel_name: pendingData?.hotel?.name || apiData?.hotel?.name,
    hotel_address: pendingData?.hotel?.address || apiData?.hotel?.address,
    hotel_city: pendingData?.hotel?.city || apiData?.hotel?.city,
    hotel_country: pendingData?.hotel?.country || apiData?.hotel?.country,
    hotel_star_rating: pendingData?.hotel?.starRating || apiData?.hotel?.star_rating,
    hotel_phone: apiData?.hotel?.phone,
    hotel_image: pendingData?.hotel?.mainImage,
    check_in_date: checkIn,
    check_out_date: checkOut,
    nights: apiData?.dates?.nights || Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    ),
    rooms_data: roomsData,
    guests_data: guestsData,
    lead_guest_name: leadGuest ? `${leadGuest.firstName} ${leadGuest.lastName}` : apiData?.lead_guest ? `${apiData.lead_guest.first_name} ${apiData.lead_guest.last_name}` : undefined,
    lead_guest_email: leadGuest?.email || apiData?.lead_guest?.email,
    amount: apiData?.price?.amount || pendingData?.totalPrice?.toString(),
    currency_code: apiData?.price?.currency_code || pendingData?.hotel?.currency || "USD",
    payment_type: apiData?.payment?.type || pendingData?.paymentType,
    payment_status: apiData?.payment?.status,
    taxes: pendingData?.rooms?.flatMap(r => r.taxes || []),
    raw_api_response: apiResponse as unknown as Record<string, unknown>,
  };
}

/**
 * Fetch all bookings for the current user from Supabase
 */
export async function getUserBookings(): Promise<UserBooking[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.warn("No authenticated user");
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE_NAME as any)
    .select("*")
    .eq("user_id", userId)
    .order("check_in_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch bookings:", error);
    return [];
  }

  return ((data || []) as unknown as UserBookingRow[]).map(transformBookingRow);
}

/**
 * Get a specific booking by order ID
 */
export async function getBookingByOrderId(orderId: string): Promise<UserBooking | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from(TABLE_NAME as any)
    .select("*")
    .eq("order_id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return transformBookingRow(data as unknown as UserBookingRow);
}

/**
 * Update booking status (e.g., after cancellation)
 */
export async function updateBookingStatus(
  orderId: string, 
  status: string,
  additionalData?: Partial<UserBookingInsert>
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const { error } = await supabase
    .from(TABLE_NAME as any)
    .update({ 
      status, 
      updated_at: new Date().toISOString(),
      ...(status === "cancelled" ? { cancelled_at: new Date().toISOString() } : {}),
      ...additionalData,
    } as any)
    .eq("order_id", orderId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Sync a booking from the API (refresh data)
 */
export async function syncBookingFromApi(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch fresh data from API
    const [orderInfo, orderStatus] = await Promise.all([
      bookingApi.getOrderInfo(orderId),
      bookingApi.getOrderStatus(orderId),
    ]);

    if (orderInfo.status !== "ok" || !orderInfo.data) {
      return { success: false, error: "Failed to fetch order info" };
    }

    const apiData = orderInfo.data;
    const statusData = orderStatus.data;

    // Update the database record
    const { error } = await supabase
      .from(TABLE_NAME as any)
      .update({
        status: apiData.status,
        confirmation_number: apiData.confirmation_number,
        hotel_name: apiData.hotel.name,
        hotel_address: apiData.hotel.address,
        hotel_city: apiData.hotel.city,
        hotel_country: apiData.hotel.country,
        hotel_star_rating: apiData.hotel.star_rating,
        hotel_phone: apiData.hotel.phone,
        amount: apiData.price.amount,
        currency_code: apiData.price.currency_code,
        payment_status: apiData.payment.status,
        free_cancellation_before: statusData?.cancellation_info?.free_cancellation_before,
        last_synced_at: new Date().toISOString(),
        raw_api_response: orderInfo as unknown as Record<string, unknown>,
      } as any)
      .eq("order_id", orderId)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Delete a booking from the database
 */
export async function deleteBooking(orderId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  const { error } = await supabase
    .from(TABLE_NAME as any)
    .delete()
    .eq("order_id", orderId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if user is authenticated
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return !!userId;
}
