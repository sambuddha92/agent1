/**
 * Magic Numbers & Constants
 *
 * Centralized location for all hardcoded values in the application
 * Makes code more maintainable and easier to adjust configurations
 *
 * Categories:
 * - Image/File sizes
 * - Pagination
 * - Timing/Delays
 * - Limits
 */

// ============================================
// Image & File Constants
// ============================================

/** Maximum image file size: 20 MB */
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

/** Allowed image MIME types for upload */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

// ============================================
// Pagination Constants
// ============================================

/** Default number of items per page */
export const DEFAULT_PAGE_SIZE = 12;

/** Additional items to load when using "Load More" */
export const LOAD_MORE_INCREMENT = 12;

// ============================================
// Timing Constants
// ============================================

/** Debounce delay for search inputs (milliseconds) */
export const DEBOUNCE_SEARCH_MS = 300;

/** Debounce delay for text input/auto-save (milliseconds) */
export const DEBOUNCE_TEXT_MS = 500;

/** Debounce delay for resize/scroll events (milliseconds) */
export const DEBOUNCE_RESIZE_MS = 150;

/** Standard timeout for API requests (milliseconds) */
export const API_TIMEOUT_MS = 30000;

/** Session refresh interval (milliseconds) */
export const SESSION_REFRESH_MS = 60000;

// ============================================
// Rate Limiting Constants
// ============================================

/** Maximum chat requests per minute */
export const RATE_LIMIT_CHAT_REQUESTS = 10;

/** Rate limit window (milliseconds) */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** Maximum auth attempts per minute */
export const RATE_LIMIT_AUTH_REQUESTS = 5;

/** Maximum image uploads per minute */
export const RATE_LIMIT_IMAGE_UPLOADS = 5;

// ============================================
// Validation Constants
// ============================================

/** Maximum message length (characters) */
export const MAX_MESSAGE_LENGTH = 10000;

/** Minimum message length (characters) */
export const MIN_MESSAGE_LENGTH = 1;

/** Maximum conversation title length */
export const MAX_TITLE_LENGTH = 200;

/** Minimum title length */
export const MIN_TITLE_LENGTH = 1;

/** Maximum description length for images */
export const MAX_DESCRIPTION_LENGTH = 500;

// ============================================
// UI Constants
// ============================================

/** Maximum textarea height (pixels) */
export const MAX_TEXTAREA_HEIGHT = 240;

/** Default textarea row count */
export const TEXTAREA_DEFAULT_ROWS = 1;

/** Image aspect ratio for grid (square) */
export const IMAGE_ASPECT_RATIO = 1;

// ============================================
// Memory/Performance Constants
// ============================================

/** Stale entry threshold for rate limiter cleanup (milliseconds) */
export const RATE_LIMITER_STALE_THRESHOLD_MS = 5 * 60 * 1000;

/** Cleanup interval for rate limiter (milliseconds) */
export const RATE_LIMITER_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
