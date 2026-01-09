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

/**
 * Checks if a description is likely real content vs metadata
 * Returns false for descriptions that are too short or match metadata patterns
 */
export function isValidDescription(text: string | undefined | null): boolean {
  if (!text) return false;
  const cleaned = text.trim();
  
  // Too short to be a real description (less than 100 chars)
  if (cleaned.length < 100) return false;
  
  // Match metadata patterns like "Hotel with X room types"
  const metadataPatterns = [
    /^hotel\s+with\s+\d+\s+room\s+types?/i,
    /^\d+\s+room\s+types?\s+available/i,
    /^located\s+in\s+/i,
    /^property\s+in\s+/i,
  ];
  
  if (metadataPatterns.some(pattern => pattern.test(cleaned))) {
    return false;
  }
  
  return true;
}
