import { useState, useCallback } from "react";

const STORAGE_KEY = "user-language";

/**
 * Hook for managing user's preferred language for RateHawk API responses
 * Persists to localStorage for cross-session consistency
 */
export function useLanguage() {
  const [language, setLanguageState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || "en";
    }
    return "en";
  });

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  return { language, setLanguage };
}

/**
 * Utility function to get language preference without hook
 * Used by API services that can't use hooks directly
 */
export function getLanguage(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem(STORAGE_KEY) || "en";
  }
  return "en";
}
