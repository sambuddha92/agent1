/**
 * Safe Camera Invocation Wrapper
 * 
 * Wraps openNativeCamera with error handling and capability checks.
 * Can be called from gesture handlers.
 */

import { openNativeCamera } from './openNativeCamera';

export function safeCameraInvoke(
  onFile: (file: File) => void,
  onCancel?: () => void
): void {
  try {
    // Check if camera is supported
    const hasNativeCapture = 'capture' in HTMLInputElement.prototype;
    const hasMediaDevices = !!navigator.mediaDevices;

    if (!hasNativeCapture && !hasMediaDevices) {
      throw new Error('Camera not supported on this device');
    }

    // Invoke native camera synchronously
    openNativeCamera(onFile, onCancel);
  } catch (err) {
    console.error('[Camera] Error during invocation:', err);
    // Don't show UI error here - let caller decide
    // Silent failure is better than breaking gesture chain
  }
}
