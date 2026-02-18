/**
 * Camera Permission Check Hook
 * 
 * Checks camera permission status on mount and caches result.
 * Runs once per page load to avoid repeated permission queries.
 */

import { useState, useEffect } from 'react';

type CameraPermissionStatus = 'granted' | 'denied' | 'prompt' | 'checking';

export function useCheckCameraPermission() {
  const [status, setStatus] = useState<CameraPermissionStatus>('checking');

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      // Check if Permissions API is supported
      if (!navigator.permissions?.query) {
        console.log('[Camera] Permissions API not available on this device');
        setStatus('prompt');
        return;
      }

      // Query the Permissions API for camera status
      // iOS Safari doesn't support this, so it will be caught and default to 'prompt'
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('[Camera] Permission status:', permission.state);
        setStatus(permission.state as CameraPermissionStatus);

        // Listen for permission changes
        permission.addEventListener('change', () => {
          console.log('[Camera] Permission changed to:', permission.state);
          setStatus(permission.state as CameraPermissionStatus);
        });
      } catch {
        // iOS Safari throws here - default to 'prompt' so user can grant on first attempt
        console.log('[Camera] Permissions API not supported, defaulting to prompt');
        setStatus('prompt');
      }
    } catch (error) {
      console.error('[Camera] Error checking permission:', error);
      setStatus('prompt');
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      setStatus('checking');

      // Attempt to get camera access - this triggers the native permission prompt on iOS
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      // Permission granted - stop the stream immediately
      stream.getTracks().forEach((track) => track.stop());
      setStatus('granted');
      console.log('[Camera] Permission granted');

      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          console.log('[Camera] Permission denied by user');
          setStatus('denied');
        } else {
          console.error('[Camera] Error requesting permission:', error.message);
          setStatus('prompt');
        }
      }
      return false;
    }
  };

  return {
    status,
    requestPermission,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    isPrompt: status === 'prompt',
    isChecking: status === 'checking',
  };
}
