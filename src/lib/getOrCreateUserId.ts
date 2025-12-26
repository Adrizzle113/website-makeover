/**
 * Get or create a stable user ID for API calls.
 * If the user is logged in, returns their userId.
 * Otherwise, generates and persists an anonymous ID.
 */
export function getOrCreateUserId(): string {
  const existing = localStorage.getItem("userId");
  if (existing) {
    return existing;
  }

  // Generate anonymous user ID
  const anonId = `anon_${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  localStorage.setItem("userId", anonId);
  return anonId;
}
