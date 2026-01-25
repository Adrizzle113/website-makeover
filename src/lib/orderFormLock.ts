/**
 * Cross-mount request lock for order form API calls.
 * Prevents duplicate POST requests to /api/ratehawk/order/form caused by React 18 Strict Mode.
 * Uses sessionStorage to persist across component remounts.
 */

const LOCK_KEY_PREFIX = "order_form_lock:";
const LOCK_TTL_MS = 30000; // 30 seconds - prevents stale locks

interface LockData {
  status: "inflight" | "done" | "failed";
  timestamp: number;
  orderForms?: any[]; // Cached result for cross-mount recovery
}

/**
 * Attempts to acquire a lock for the given booking ID.
 * Returns true if lock was acquired, false if already locked.
 */
export function acquireLock(bookingId: string): boolean {
  const key = LOCK_KEY_PREFIX + bookingId;
  const existing = sessionStorage.getItem(key);

  if (existing) {
    try {
      const lock: LockData = JSON.parse(existing);
      const age = Date.now() - lock.timestamp;

      // Lock is recent and inflight - don't acquire
      if (lock.status === "inflight" && age < LOCK_TTL_MS) {
        console.log(`🔒 Lock held for ${bookingId} (age: ${age}ms) - skipping duplicate request`);
        return false;
      }

      // Lock is done with cached data - use cache instead
      if (lock.status === "done" && lock.orderForms) {
        console.log(`📦 Lock has cached data for ${bookingId} - use getCachedOrderForms()`);
        return false;
      }
    } catch (e) {
      // Invalid lock data - clear it
      sessionStorage.removeItem(key);
    }
  }

  // Set new lock
  sessionStorage.setItem(
    key,
    JSON.stringify({
      status: "inflight",
      timestamp: Date.now(),
    })
  );

  console.log(`🔓 Lock acquired for ${bookingId}`);
  return true;
}

/**
 * Releases the lock and optionally caches the order form results.
 * Call this after the API call completes (success or failure).
 */
export function releaseLock(bookingId: string, orderForms?: any[]): void {
  const key = LOCK_KEY_PREFIX + bookingId;
  sessionStorage.setItem(
    key,
    JSON.stringify({
      status: orderForms ? "done" : "failed",
      timestamp: Date.now(),
      orderForms,
    })
  );

  console.log(`🔓 Lock released for ${bookingId} (status: ${orderForms ? "done" : "failed"})`);
}

/**
 * Gets cached order forms from a completed lock.
 * Returns null if no cache or lock is still inflight/failed.
 */
export function getCachedOrderForms(bookingId: string): any[] | null {
  const key = LOCK_KEY_PREFIX + bookingId;
  const existing = sessionStorage.getItem(key);

  if (existing) {
    try {
      const lock: LockData = JSON.parse(existing);
      if (lock.status === "done" && lock.orderForms && lock.orderForms.length > 0) {
        console.log(`📦 Retrieved cached order forms for ${bookingId}`);
        return lock.orderForms;
      }
    } catch (e) {
      sessionStorage.removeItem(key);
    }
  }

  return null;
}

/**
 * Clears the lock for a specific booking ID.
 * Call this when starting a fresh booking or retrying with a new ID.
 */
export function clearLock(bookingId: string): void {
  const key = LOCK_KEY_PREFIX + bookingId;
  sessionStorage.removeItem(key);
  console.log(`🧹 Cleared lock for ${bookingId}`);
}

/**
 * Clears all order form locks.
 * Call this when entering the booking page to clean up stale locks.
 */
export function clearAllLocks(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(LOCK_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  
  if (keysToRemove.length > 0) {
    console.log(`🧹 Cleared ${keysToRemove.length} stale order form lock(s)`);
  }
}

/**
 * Checks if a lock is currently inflight (request in progress).
 */
export function isLockInflight(bookingId: string): boolean {
  const key = LOCK_KEY_PREFIX + bookingId;
  const existing = sessionStorage.getItem(key);

  if (existing) {
    try {
      const lock: LockData = JSON.parse(existing);
      const age = Date.now() - lock.timestamp;
      return lock.status === "inflight" && age < LOCK_TTL_MS;
    } catch (e) {
      return false;
    }
  }

  return false;
}
