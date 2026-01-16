/**
 * Guest name validation utilities for RateHawk API
 * RateHawk doesn't allow digits in first_name or last_name
 */

/**
 * Sanitize guest names by removing digits
 * RateHawk API rejects names containing numbers
 */
export function sanitizeGuestName(name: string): string {
  return name.replace(/\d/g, '').trim();
}

/**
 * Check if a name contains invalid characters (digits)
 */
export function hasInvalidNameChars(name: string): boolean {
  return /\d/.test(name);
}
