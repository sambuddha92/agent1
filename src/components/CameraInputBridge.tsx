'use client';

/**
 * CameraInputBridge Component
 * 
 * Layer 1: Hidden Camera Input (Native Bridge)
 * 
 * CRITICAL: This component provides the native file input bridge for iOS Safari.
 * The input.click() MUST be called synchronously within a user gesture.
 * 
 * Architecture: Hidden input element that launches native camera when clicked.
 * Returns Promise<File> when photo is captured.
 */

import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

interface CameraInputBridgeProps {
  onCapture: (file: File) => void;
  onCancel?: () => void;
}

export interface CameraInputBridgeRef {
  openCamera: () => Promise<File>;
}

export const CameraInputBridge = forwardRef<CameraInputBridgeRef, CameraInputBridgeProps>(
  function CameraInputBridge({ onCapture, onCancel }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingResolveRef = useRef<{
    resolve: (file: File) => void;
    reject: (error: Error) => void;
  } | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Reset input value to allow same file selection again
    event.target.value = '';
    
    if (file) {
      console.log('[CameraInputBridge] File captured:', file.name, file.type, file.size);
      onCapture(file);
      
      // Resolve pending promise if exists
      if (pendingResolveRef.current) {
        pendingResolveRef.current.resolve(file);
        pendingResolveRef.current = null;
      }
    } else {
      console.log('[CameraInputBridge] No file selected - user cancelled');
      onCancel?.();
      
      // Reject pending promise if exists
      if (pendingResolveRef.current) {
        pendingResolveRef.current.reject(new Error('User cancelled camera'));
        pendingResolveRef.current = null;
      }
    }
  }, [onCapture, onCancel]);

  /**
   * Opens the native camera
   * 
   * CRITICAL: Must be called synchronously from user gesture handler
   * 
   * @returns Promise that resolves with File when photo captured
   */
  const openCamera = useCallback((): Promise<File> => {
    return new Promise<File>((resolve, reject) => {
      if (!inputRef.current) {
        reject(new Error('Camera input not available'));
        return;
      }

      // Store promise handlers for when file is selected
      pendingResolveRef.current = { resolve, reject };

      // CRITICAL: Synchronous click - no async boundaries allowed
      console.log('[CameraInputBridge] Opening native camera');
      inputRef.current.click();

      // Timeout fallback - iOS sometimes doesn't trigger onchange on cancel
      setTimeout(() => {
        if (pendingResolveRef.current) {
          console.log('[CameraInputBridge] Timeout reached - user likely cancelled');
          pendingResolveRef.current.reject(new Error('Camera timeout - user cancelled'));
          pendingResolveRef.current = null;
        }
      }, 30000); // 30 second timeout
    });
  }, []);

  // Expose openCamera function via ref
  useImperativeHandle(ref, () => ({
    openCamera
  }), [openCamera]);

  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handleFileChange}
      style={{ display: 'none' }}
      aria-hidden="true"
    />
  );
});

// Export the bridge component and openCamera function for external use
export type { CameraInputBridgeProps };
