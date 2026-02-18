/**
 * Camera Permissions Utility
 * Simplified to essential capability check only
 */

/**
 * Check if the browser supports camera access.
 * Synchronous capability check — safe to call anywhere.
 */
export function isCameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}
