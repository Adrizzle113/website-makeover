import { addDays, isBefore, startOfDay, differenceInDays } from "date-fns";
import { RATEHAWK_CONSTRAINTS } from "@/config/apiConstraints";

export interface DateValidationResult {
  isValid: boolean;
  checkIn: Date;
  checkOut: Date;
  wasRefreshed: boolean;
  message?: string;
}

/**
 * Validates check-in and check-out dates, automatically refreshing stale dates to valid defaults.
 * Handles dates from localStorage (strings) or Date objects.
 */
export function validateAndRefreshDates(
  checkIn: Date | string | null | undefined,
  checkOut: Date | string | null | undefined,
  maxStayNights: number = RATEHAWK_CONSTRAINTS.MAX_STAY_NIGHTS
): DateValidationResult {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const defaultCheckout = addDays(tomorrow, 2);

  // Parse dates if they're strings (from localStorage/URL)
  const parsedCheckIn = parseDate(checkIn);
  const parsedCheckOut = parseDate(checkOut);

  // Case 1: No dates provided - use defaults
  if (!parsedCheckIn || !parsedCheckOut) {
    return {
      isValid: true,
      checkIn: tomorrow,
      checkOut: defaultCheckout,
      wasRefreshed: true,
      message: "Dates set to default",
    };
  }

  // Case 2: Check-in is in the past
  if (isBefore(startOfDay(parsedCheckIn), today)) {
    // Preserve the original stay duration if possible
    const originalNights = differenceInDays(parsedCheckOut, parsedCheckIn);
    const preservedNights = Math.min(Math.max(originalNights, 1), maxStayNights);
    
    return {
      isValid: true,
      checkIn: tomorrow,
      checkOut: addDays(tomorrow, preservedNights),
      wasRefreshed: true,
      message: "Dates were in the past and have been updated",
    };
  }

  // Case 3: Check-out is before or same as check-in
  if (parsedCheckOut <= parsedCheckIn) {
    return {
      isValid: true,
      checkIn: parsedCheckIn,
      checkOut: addDays(parsedCheckIn, 1),
      wasRefreshed: true,
      message: "Check-out date was adjusted",
    };
  }

  // Case 4: Stay exceeds maximum nights
  const nights = differenceInDays(parsedCheckOut, parsedCheckIn);
  if (nights > maxStayNights) {
    return {
      isValid: true,
      checkIn: parsedCheckIn,
      checkOut: addDays(parsedCheckIn, maxStayNights),
      wasRefreshed: true,
      message: `Stay was limited to ${maxStayNights} nights`,
    };
  }

  // Case 5: Dates are valid
  return {
    isValid: true,
    checkIn: parsedCheckIn,
    checkOut: parsedCheckOut,
    wasRefreshed: false,
  };
}

/**
 * Checks if a check-in date is in the past
 */
export function isCheckInInPast(checkIn: Date | string | null | undefined): boolean {
  const date = parseDate(checkIn);
  if (!date) return false;
  return isBefore(startOfDay(date), startOfDay(new Date()));
}

/**
 * Safely parses a date that could be a Date object, ISO string, or null/undefined
 */
function parseDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }
  
  if (typeof date === "string") {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
}
