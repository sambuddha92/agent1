/**
 * useCamera hook
 * Manages camera stream, capture, and controls
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

  // Check if device has multiple cameras
  useEffect(() => {
    hasMultipleCameras().then(setCanSwitchCamera);
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const newStream = await requestCameraAccess(facingMode);
      setStream(newStream);
      setIsActive(true);

      // Attach stream to video element if ref exists
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      const message = getCameraErrorMessage(err);
      setError(message);
      setIsActive(false);
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stopCameraStream(stream);
      setStream(null);
      setIsActive(false);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  // Switch between front and back camera
  const switchCamera = useCallback(() => {
    if (!canSwitchCamera) return;

    // Stop current stream
    stopCamera();

    // Toggle facing mode
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [canSwitchCamera, stopCamera]);

  // Re-start camera when facing mode changes
  useEffect(() => {
    if (isActive && !stream) {
      startCamera();
    }
  }, [facingMode, isActive, stream, startCamera]);

  // Capture photo from video stream
  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !stream) {
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Return base64 data URL
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [stream]);

  // Convert data URL to File object
  const dataURLtoFile = useCallback((dataURL: string, filename: string): File => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stopCameraStream(stream);
      }
    };
  }, [stream]);

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
    dataURLtoFile,
  };
}
