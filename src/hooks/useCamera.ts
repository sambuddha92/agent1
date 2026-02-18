/**
 * useCamera hook
 * Manages camera stream, capture, and controls.
 *
 * Design notes:
 * - Multi-camera detection happens AFTER the stream is active so device labels
 *   are populated (browsers hide labels before permission is granted).
 * - Switching cameras stops the current stream, toggles the facingMode, then
 *   re-starts.  The restart is triggered by an explicit call, not a useEffect
 *   watching facingMode, to avoid race conditions.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  requestCameraAccess,
  stopCameraStream,
  hasMultipleCameras,
  getCameraErrorMessage,
} from '@/lib/camera/permissions';

type FacingMode = 'user' | 'environment';

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Keep a ref to the current stream so cleanup callbacks always see the
  // latest value without needing it as a dependency.
  const streamRef = useRef<MediaStream | null>(null);

  // ─── Internal helpers ───────────────────────────────────────────────────────

  const attachStream = useCallback((newStream: MediaStream) => {
    streamRef.current = newStream;
    setStream(newStream);
    setIsActive(true);

    if (videoRef.current) {
      videoRef.current.srcObject = newStream;
    }
  }, []);

  const releaseStream = useCallback(() => {
    stopCameraStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setIsActive(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Start (or restart) the camera.
   * Accepts an optional facingMode so callers can pass the new mode directly
   * during a camera switch without waiting for state to update.
   */
  const startCamera = useCallback(
    async (mode?: FacingMode) => {
      setIsInitializing(true);
      setError(null);

      // Stop any existing stream first
      releaseStream();

      try {
        const newStream = await requestCameraAccess();
        attachStream(newStream);

        // Now that permission is granted, labels are available — check for
        // multiple cameras so we can show the switch button if needed.
        const multipleFound = await hasMultipleCameras();
        setCanSwitchCamera(multipleFound);

        // Track the active facing mode
        if (mode) setFacingMode(mode);
      } catch (err) {
        setError(getCameraErrorMessage(err));
        setIsActive(false);
      } finally {
        setIsInitializing(false);
      }
    },
    [releaseStream, attachStream]
  );

  /** Stop the camera and release hardware. */
  const stopCamera = useCallback(() => {
    releaseStream();
    setError(null);
  }, [releaseStream]);

  /** Toggle between front and back camera. */
  const switchCamera = useCallback(async () => {
    if (!canSwitchCamera) return;
    const nextMode: FacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    await startCamera(nextMode);
  }, [canSwitchCamera, facingMode, startCamera]);

  // ─── Capture ─────────────────────────────────────────────────────────────────

  /**
   * Draw the current video frame to an off-screen canvas and return a Blob.
   * Returns null if the video isn't ready.
   */
  const capturePhoto = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || !streamRef.current || video.videoWidth === 0) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.92
      );
    });
  }, []);

  /**
   * Convert a Blob to a named File object ready for upload.
   */
  const blobToFile = useCallback((blob: Blob, filename: string): File => {
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopCameraStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  return {
    videoRef,
    stream,
    isActive,
    isInitializing,
    error,
    facingMode,
    canSwitchCamera,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    blobToFile,
  };
}
