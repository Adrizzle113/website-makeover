import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes text by stripping HTML tags, guillemets, and normalizing whitespace
 */
export function sanitizeDescription(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ') // Strip all HTML tags
    .replace(/&nbsp;/gi, ' ') // Replace HTML entities
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[«»]/g, '') // Remove guillemets
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
