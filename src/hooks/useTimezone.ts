import { useState, useEffect, useCallback } from "react";
import { getClockFormat } from "./useClockFormat";

const STORAGE_KEY = "user-timezone";

// Timezone display labels
const TIMEZONE_LABELS: Record<string, string> = {
  "America/New_York": "ET",
  "America/Chicago": "CT",
  "America/Denver": "MT",
  "America/Los_Angeles": "PT",
  "Europe/London": "GMT",
  "Europe/Paris": "CET",
  "Asia/Dubai": "GST",
  "UTC": "UTC",
};

/**
 * Hook to manage and access the user's timezone preference.
 * Persists to localStorage and provides utilities for formatting times.
 */
export function useTimezone() {
  const [timezone, setTimezoneState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || "UTC";
    }
    return "UTC";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, timezone);
  }, [timezone]);

  const setTimezone = useCallback((tz: string) => {
    setTimezoneState(tz);
    localStorage.setItem(STORAGE_KEY, tz);
  }, []);

  const getTimezoneLabel = useCallback(() => {
    return TIMEZONE_LABELS[timezone] || timezone.split("/").pop() || "UTC";
  }, [timezone]);

  /**
   * Format a UTC ISO date string to user's timezone and clock format
   */
  const formatDateTime = useCallback((isoDate: string): { date: string; time: string; tzLabel: string } | undefined => {
    if (!isoDate) return undefined;
    try {
      const utcDate = new Date(isoDate);
      if (isNaN(utcDate.getTime())) return undefined;

      // Format date in user's timezone
      const dateStr = utcDate.toLocaleDateString('en-US', { 
        timeZone: timezone,
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });

      // Get hours and minutes in user's timezone
      const timeOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      const timeParts = new Intl.DateTimeFormat('en-US', timeOptions).formatToParts(utcDate);
      const hours = timeParts.find(p => p.type === 'hour')?.value || '00';
      const minutes = timeParts.find(p => p.type === 'minute')?.value || '00';
      
      // Format according to clock preference
      const clockFormat = getClockFormat();
      let timeStr: string;
      if (clockFormat === "12h") {
        const h = parseInt(hours, 10);
        const period = h >= 12 ? "PM" : "AM";
        const displayHour = h % 12 || 12;
        timeStr = `${displayHour}:${minutes} ${period}`;
      } else {
        timeStr = `${hours}:${minutes}`;
      }

      return { 
        date: dateStr, 
        time: timeStr, 
        tzLabel: TIMEZONE_LABELS[timezone] || timezone.split("/").pop() || "UTC"
      };
    } catch {
      return undefined;
    }
  }, [timezone]);

  return {
    timezone,
    setTimezone,
    getTimezoneLabel,
    formatDateTime,
  };
}

/**
 * Get timezone from localStorage without hook (for non-component use).
 */
export function getTimezone(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem(STORAGE_KEY) || "UTC";
  }
  return "UTC";
}

/**
 * Get timezone label from timezone string
 */
export function getTimezoneLabel(tz?: string): string {
  const timezone = tz || getTimezone();
  return TIMEZONE_LABELS[timezone] || timezone.split("/").pop() || "UTC";
}

/**
 * Format a UTC ISO date to user's preferred timezone and clock format.
 * Utility function for non-component use.
 */
export function formatDateTimeWithPreference(isoDate: string): { date: string; time: string; tzLabel: string } | undefined {
  if (!isoDate) return undefined;
  try {
    const timezone = getTimezone();
    const clockFormat = getClockFormat();
    const utcDate = new Date(isoDate);
    if (isNaN(utcDate.getTime())) return undefined;

    // Format date in user's timezone
    const dateStr = utcDate.toLocaleDateString('en-US', { 
      timeZone: timezone,
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    // Get hours and minutes in user's timezone
    const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    const timeParts = new Intl.DateTimeFormat('en-US', timeOptions).formatToParts(utcDate);
    const hours = timeParts.find(p => p.type === 'hour')?.value || '00';
    const minutes = timeParts.find(p => p.type === 'minute')?.value || '00';
    
    let timeStr: string;
    if (clockFormat === "12h") {
      const h = parseInt(hours, 10);
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 || 12;
      timeStr = `${displayHour}:${minutes} ${period}`;
    } else {
      timeStr = `${hours}:${minutes}`;
    }

    return { 
      date: dateStr, 
      time: timeStr, 
      tzLabel: TIMEZONE_LABELS[timezone] || timezone.split("/").pop() || "UTC"
    };
  } catch {
    return undefined;
  }
}
