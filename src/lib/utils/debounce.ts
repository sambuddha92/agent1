/**
 * Debounce Utilities
 *
 * Provides debouncing functionality to prevent excessive function calls
 * during rapid user interactions (e.g., search, resize events)
 *
 * Usage:
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   fetch(`/api/search?q=${query}`);
 * }, 300);
 *
 * input.addEventListener('input', (e) => {
 *   debouncedSearch(e.target.value);
 * });
 * ```
 */

// ============================================
// Debounce Function
// ============================================

/**
 * Creates a debounced function that delays execution until after
 * the specified time has elapsed without the function being called
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel method
 *
 * @example
 * ```typescript
 * const search = debounce((query: string) => {
 *   console.log('Searching:', query);
 * }, 300);
 *
 * // Rapid calls - only last one executes after 300ms
 * search('a');
 * search('ab');
 * search('abc');
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
} {
  let timeoutId: NodeJS.Timeout | null = null;

  function debounced(...args: Parameters<T>): void {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  }

  /**
   * Cancel pending execution
   */
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  /**
   * Execute pending function immediately
   */
  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      func(...([] as unknown[] as Parameters<T>));
      timeoutId = null;
    }
  };

  return debounced;
}

// ============================================
// Throttle Function
// ============================================

/**
 * Creates a throttled function that executes at most once per
 * specified time interval
 *
 * Useful for performance-critical event handlers like scroll/resize
 *
 * @param func - Function to throttle
 * @param interval - Minimum interval between calls in milliseconds
 * @returns Throttled function with cancel method
 *
 * @example
 * ```typescript
 * const handleScroll = throttle(() => {
 *   console.log('Scroll position:', window.scrollY);
 * }, 100);
 *
 * window.addEventListener('scroll', handleScroll);
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  interval: number
): {
  (...args: Parameters<T>): void;
  cancel(): void;
} {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  function throttled(...args: Parameters<T>): void {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= interval) {
      // Enough time has passed, execute immediately
      func(...args);
      lastCall = now;

      // Clear pending call
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } else {
      // Schedule for later
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const remainingTime = interval - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        func(...args);
        lastCall = Date.now();
        timeoutId = null;
      }, remainingTime);
    }
  }

  /**
   * Cancel pending execution
   */
  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCall = 0;
  };

  return throttled;
}

// ============================================
// Common Debounce Configs
// ============================================

/**
 * Standard debounce delay for search inputs (300ms)
 * Balances responsiveness with API load
 */
export const DEBOUNCE_SEARCH = 300;

/**
 * Debounce delay for text input (500ms)
 * Useful for auto-save operations
 */
export const DEBOUNCE_TEXT = 500;

/**
 * Debounce delay for resize/scroll (150ms)
 * Prevents excessive reflow/repaint
 */
export const DEBOUNCE_RESIZE = 150;
