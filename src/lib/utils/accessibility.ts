/**
 * Accessibility & UX Utilities
 *
 * Helpers for improving keyboard navigation, screen reader support,
 * and overall accessibility of the application
 *
 * Reference: WCAG 2.1 Guidelines
 */

// ============================================
// Touch Target Size Guidelines
// ============================================

/**
 * Minimum recommended touch target size (48x48 px)
 * WCAG 2.1 Level AAA standard
 */
export const MIN_TOUCH_TARGET_SIZE = 48;

/**
 * Recommended touch target size for buttons and links
 */
export const RECOMMENDED_TOUCH_TARGET = 'min-h-12 min-w-12';

/**
 * Spacing between interactive elements to prevent accidental clicks
 */
export const INTERACTIVE_ELEMENT_SPACING = 'gap-2';

// ============================================
// Keyboard Navigation
// ============================================

/**
 * Check if a keyboard event is an Enter or Space key press
 * Useful for custom button/link implementations
 *
 * @param event - Keyboard event
 * @returns true if Enter or Space was pressed
 */
export function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

/**
 * Check if Escape key was pressed
 * Useful for modals, dropdowns, etc.
 *
 * @param event - Keyboard event
 * @returns true if Escape was pressed
 */
export function isEscapeKey(event: React.KeyboardEvent): boolean {
  return event.key === 'Escape' || event.keyCode === 27;
}

/**
 * Check if Tab key was pressed
 * Useful for managing focus order
 *
 * @param event - Keyboard event
 * @returns true if Tab was pressed
 */
export function isTabKey(event: React.KeyboardEvent): boolean {
  return event.key === 'Tab' || event.keyCode === 9;
}

// ============================================
// Screen Reader Support
// ============================================

/**
 * Create an aria-label from a series of parts
 * Useful for complex interactive elements
 *
 * @param parts - Label parts to join
 * @returns Combined aria-label
 *
 * @example
 * ```typescript
 * const label = createAriaLabel('Chat', 'with', 'Alice', 'sent 2 hours ago');
 * // Result: 'Chat with Alice sent 2 hours ago'
 * ```
 */
export function createAriaLabel(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Get skip link ARIA role for keyboard navigation
 * Should be at the top of the page to skip to main content
 */
export const SKIP_LINK_ROLE = 'link';

/**
 * Get live region role for dynamic content updates
 * Announces changes to screen reader users
 */
export const LIVE_REGION_ROLE = 'region';

// ============================================
// Focus Management
// ============================================

/**
 * Create outline styles for focus indicators
 * WCAG 2.1 requires visible focus indicators
 */
export const FOCUS_OUTLINE = 'focus:outline-2 focus:outline-offset-2 focus:outline-primary';

/**
 * Create ring styles for focus indicators (Tailwind alternative)
 */
export const FOCUS_RING = 'focus:ring-2 focus:ring-primary focus:ring-offset-2';

/**
 * Common focus styles for buttons and links
 */
export const INTERACTIVE_FOCUS = `${FOCUS_RING} rounded transition-all duration-200`;

// ============================================
// Color Contrast
// ============================================

/**
 * WCAG 2.1 Level AA minimum contrast ratio
 */
export const MIN_CONTRAST_RATIO_AA = 4.5;

/**
 * WCAG 2.1 Level AAA minimum contrast ratio
 */
export const MIN_CONTRAST_RATIO_AAA = 7;

/**
 * Utility class for ensuring readable text on backgrounds
 */
export const HIGH_CONTRAST_TEXT = 'text-gray-900 dark:text-white';

// ============================================
// Motion & Animations
// ============================================

/**
 * Check if user prefers reduced motion
 * Respects prefers-reduced-motion media query
 */
export const PREFERS_REDUCED_MOTION = 'motion-safe:animate-pulse motion-reduce:opacity-75';

/**
 * Conditional animation class based on user preference
 */
export const RESPECTFUL_ANIMATION = 'transition-all duration-200';

// ============================================
// ARIA Helpers
// ============================================

/**
 * Common ARIA attributes for buttons
 */
export const BUTTON_ARIA = {
  type: 'button',
  role: 'button',
};

/**
 * Common ARIA attributes for links that act like buttons
 */
export const BUTTON_LINK_ARIA = {
  role: 'button',
  tabIndex: 0,
};

/**
 * Helper to create aria-live region for announcements
 */
export function createLiveRegion(message: string, assertive = false) {
  return {
    'aria-live': assertive ? 'assertive' : 'polite',
    'aria-atomic': 'true',
    role: 'status',
    children: message,
  };
}

// ============================================
// Validation & Error Messages
// ============================================

/**
 * Create accessible error message for form field
 */
export function createFieldError(fieldName: string, error: string): string {
  return `${fieldName}: ${error}`;
}

/**
 * ARIA attributes for form fields with errors
 */
export function getErrorAttributes(fieldId: string, hasError: boolean) {
  return {
    'aria-invalid': hasError,
    'aria-describedby': hasError ? `${fieldId}-error` : undefined,
  };
}
