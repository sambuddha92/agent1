/**
 * Camera Capture Hook
 * 
 * React integration for camera photo capture.
 * Wraps capturePhoto() and integrates with existing upload pipeline.
 */

import { useState, useCallback } from 'react';
import { capturePhoto } from '@/lib/camera/capturePhoto';

interface UseCameraCaptureOptions {
  onCapture: (file: File) => void | Promise<void>;
}

interface UseCameraCaptureReturn {
  capture: () => Promise<void>;
  isCapturing: boolean;
}

/**
 * Hook for capturing photos using device camera.
 * 
 * Usage:
 * ```tsx
 * const { capture, isCapturing } = useCameraCapture({
 *   onCapture: handleFileUpload
 * });
 * 
 * // CRITICAL: Direct user gesture binding (required for iOS Safari)
 * <button onClick={capture}>Take Photo</button>
 * ```
 * 
 * @param options.onCapture - Callback to receive the captured File object
 * @returns capture function and loading state
 */
export function useCameraCapture({ onCapture }: UseCameraCaptureOptions): UseCameraCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(async () => {
    // Prevent concurrent captures
    if (isCapturing) return;

    setIsCapturing(true);

    try {
      // Invoke camera capture (may show native camera or getUserMedia UI)
      const file = await capturePhoto();
      
      // Pass to existing upload pipeline
      await onCapture(file);
    } catch (error) {
      // Graceful error handling - log but don't crash UI
      // User cancellation is expected and should be silent
      if (error instanceof Error) {
        if (error.message.includes('cancelled')) {
          // User cancelled - this is normal, no action needed
          console.log('[Camera] User cancelled photo capture');
        } else {
          // Other errors - log for debugging but don't show error UI
          // The upload pipeline (onCapture) will handle showing error messages
          console.error('[Camera] Capture failed:', error.message);
        }
      }
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, onCapture]);

  return {
    capture,
    isCapturing,
  };
}
