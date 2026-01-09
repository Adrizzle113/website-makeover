import { useState, useEffect, useCallback } from "react";

type ClockFormat = "12h" | "24h";

const STORAGE_KEY = "user-clock-format";

/**
 * Hook to manage and access the user's clock format preference.
 * Persists to localStorage and provides utilities for formatting times.
 */
export function useClockFormat() {
  const [clockFormat, setClockFormatState] = useState<ClockFormat>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return (stored as ClockFormat) || "24h";
    }
    return "24h";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, clockFormat);
  }, [clockFormat]);

  const setClockFormat = useCallback((format: ClockFormat) => {
    setClockFormatState(format);
    localStorage.setItem(STORAGE_KEY, format);
  }, []);

  /**
   * Format a time string (e.g., "14:00" or "14:00:00") according to user preference.
   * Returns "2:00 PM" for 12h or "14:00" for 24h.
   */
  const formatTime = useCallback(
    (time: string | null | undefined): string => {
      if (!time) return "";

      // Parse the time - handle "14:00", "14:00:00", "2:00 PM" etc.
      let hours: number;
      let minutes: number;

      // Check if already in 12-hour format
      const pmMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (pmMatch) {
        hours = parseInt(pmMatch[1], 10);
        minutes = parseInt(pmMatch[2], 10);
        const isPM = pmMatch[3].toUpperCase() === "PM";
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
      } else {
        // Parse 24-hour format
        const match = time.match(/(\d{1,2}):(\d{2})/);
        if (!match) return time;
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
      }

      if (clockFormat === "12h") {
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
      } else {
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }
    },
    [clockFormat]
  );

  return {
    clockFormat,
    setClockFormat,
    formatTime,
    is12Hour: clockFormat === "12h",
  };
}

/**
 * Get clock format from localStorage without hook (for non-component use).
 */
export function getClockFormat(): ClockFormat {
  if (typeof window !== "undefined") {
    return (localStorage.getItem(STORAGE_KEY) as ClockFormat) || "24h";
  }
  return "24h";
}

/**
 * Format a time string according to stored preference (utility function).
 */
export function formatTimeWithPreference(time: string | null | undefined): string {
  if (!time) return "";
  
  const clockFormat = getClockFormat();
  
  let hours: number;
  let minutes: number;

  const pmMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (pmMatch) {
    hours = parseInt(pmMatch[1], 10);
    minutes = parseInt(pmMatch[2], 10);
    const isPM = pmMatch[3].toUpperCase() === "PM";
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else {
    const match = time.match(/(\d{1,2}):(\d{2})/);
    if (!match) return time;
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
  }

  if (clockFormat === "12h") {
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  } else {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
}
