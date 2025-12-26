/**
 * Returns a static user ID for API calls.
 * Authentication has been removed - all users share the same ID.
 */
export function getOrCreateUserId(): string {
  return "default_user";
}
