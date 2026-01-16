/**
 * Shared utility functions and constants
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Site configuration
export const SITE_URL = 'https://dilipdawadi.com.np';
export const AUTHOR_NAME = 'Dilip Dawadi';
export const TWITTER_HANDLE = '@dilipdawadi';

// Image dimension constants
export const AVATAR_SIZE = {
  hero: 120,
  footer: 80,
  sidebar: 200,
} as const;

export const PROJECT_IMAGE = {
  width: 600,
  height: 400,
} as const;

// Skill competency
export const MAX_COMPETENCY = 5;

/**
 * Formats a date string to a human-readable format.
 * Handles both ISO timestamps and date-only strings.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';

  // If it's already a full ISO timestamp, use it directly
  // Otherwise, parse as UTC to avoid timezone shifts
  const date = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T12:00:00`);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
