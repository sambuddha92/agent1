/**
 * Camera Capture Hook - Production Grade
 * 
 * Manages the new camera modal flow with preview + confirm/retake system.
 * Integrates with existing upload pipeline without breaking changes.
 * 
 * Architecture:
 * - Opens fullscreen camera modal
 * - User captures photo with native camera
 * - Shows preview with retake/confirm options  
 * - Integrates with existing attachment pipeline
 */

import { useState, useCallback } from 'react';

interface UseCameraCaptureOptions {
  onCapture: (file: File) => void | Promise<void>;
}

interface UseCameraCaptureReturn {
  openCameraModal: () => void;
  isCameraModalOpen: boolean;
  closeCameraModal: () => void;
  handleCameraConfirm: (file: File) => Promise<void>;
}

/**
 * Hook for production-grade camera capture with preview system
 * 
 * Usage:
 * ```tsx
 * const { openCameraModal, isCameraModalOpen, closeCameraModal } = useCameraCapture({
 *   onCapture: handleFileUpload
 * });
 * 
 * // CRITICAL: Direct user gesture binding (required for iOS Safari)
 * <button onClick={openCameraModal}>Take Photo</button>
 * 
 * // Modal component
 * <CameraModal 
 *   isOpen={isCameraModalOpen}
 *   onClose={closeCameraModal}
 *   onConfirm={handleCameraConfirm}
 * />
 * ```
 */
export function useCameraCapture({ onCapture }: UseCameraCaptureOptions): UseCameraCaptureReturn {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  /**
   * Opens the camera modal
   * CRITICAL: Must be called directly from user gesture (no async boundaries)
   */
  const openCameraModal = useCallback(() => {
    console.log('[useCameraCapture] Opening camera modal');
    setIsCameraModalOpen(true);
  }, []);

  /**
   * Closes the camera modal and cleans up state
   */
  const closeCameraModal = useCallback(() => {
    console.log('[useCameraCapture] Closing camera modal');
    setIsCameraModalOpen(false);
  }, []);

  /**
   * Handles confirmed photo from camera modal
   * Passes to existing upload pipeline
   */
  const handleCameraConfirm = useCallback(async (file: File) => {
    console.log('[useCameraCapture] Photo confirmed, passing to upload pipeline');
    
    try {
      // Pass to existing upload pipeline
      await onCapture(file);
      console.log('[useCameraCapture] Upload pipeline completed successfully');
    } catch (error) {
      console.error('[useCameraCapture] Upload pipeline failed:', error);
      // Error handling is managed by the upload pipeline
    }
  }, [onCapture]);

  return {
    openCameraModal,
    isCameraModalOpen,
    closeCameraModal,
    // Internal handler - used by CameraModal
    handleCameraConfirm,
  } as UseCameraCaptureReturn & {
    handleCameraConfirm: (file: File) => Promise<void>;
  };
}