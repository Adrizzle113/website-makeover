// Shared Mapbox token configuration
// Priority: 1) Environment variable, 2) localStorage override

const MAPBOX_STORAGE_KEY = 'mapbox_public_token';

/**
 * Get the Mapbox public token from environment or localStorage
 */
export function getMapboxToken(): string | null {
  // First check environment variable
  const envToken = (import.meta as any).env?.VITE_MAPBOX_TOKEN;
  if (envToken) {
    return envToken;
  }

  // Fall back to localStorage (for manual setup in preview)
  try {
    const storedToken = localStorage.getItem(MAPBOX_STORAGE_KEY);
    if (storedToken) {
      return storedToken;
    }
  } catch (e) {
    // localStorage might be unavailable
    console.warn('Unable to access localStorage for Mapbox token');
  }

  return null;
}

/**
 * Save a Mapbox token to localStorage
 */
export function saveMapboxToken(token: string): void {
  try {
    localStorage.setItem(MAPBOX_STORAGE_KEY, token);
  } catch (e) {
    console.warn('Unable to save Mapbox token to localStorage');
  }
}

/**
 * Clear the stored Mapbox token from localStorage
 */
export function clearMapboxToken(): void {
  try {
    localStorage.removeItem(MAPBOX_STORAGE_KEY);
  } catch (e) {
    console.warn('Unable to clear Mapbox token from localStorage');
  }
}

/**
 * Check if a Mapbox token is available
 */
export function hasMapboxToken(): boolean {
  return getMapboxToken() !== null;
}
