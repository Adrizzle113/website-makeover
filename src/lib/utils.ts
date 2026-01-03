import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes description text by removing guillemets and normalizing whitespace
 */
export function sanitizeDescription(text: string): string {
  if (!text) return '';
  return text
    .replace(/[«»]/g, '') // Remove guillemets
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
