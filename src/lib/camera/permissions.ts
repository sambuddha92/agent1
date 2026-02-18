/**
 * Camera Permissions Utility
 * Handles camera permission checking and requesting using Web APIs
 */

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * Check if the browser supports camera access
 */
export function isCameraSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check current camera permission state
 * Returns 'unsupported' if Permissions API is not available
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  if (!isCameraSupported()) {
    return 'unsupported';
  }

  // Check if Permissions API is available
  if (!navigator.permissions || !navigator.permissions.query) {
    // Permissions API not available, return 'prompt' as we can't check
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state as PermissionStatus;
  } catch (error) {
    // If query fails, assume we need to prompt
    console.warn('[camera] Permission query failed:', error);
    return 'prompt';
  }
}

/**
 * Request camera access
 * Returns the MediaStream if successful
 */
export async function requestCameraAccess(
  facingMode: 'user' | 'environment' = 'environment'
): Promise<MediaStream> {
  if (!isCameraSupported()) {
    throw new Error('Camera is not supported on this device');
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });

    return stream;
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Camera permission was denied');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No camera found on this device');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Camera is already in use by another application');
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('Camera does not meet requirements');
      } else if (error.name === 'SecurityError') {
        throw new Error('Camera access requires a secure context (HTTPS)');
      }
    }
    throw new Error('Failed to access camera: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Stop all tracks in a media stream
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    track.stop();
  });
}

/**
 * Check if device has multiple cameras (front and back)
 */
export async function hasMultipleCameras(): Promise<boolean> {
  if (!isCameraSupported()) {
    return false;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    return videoDevices.length > 1;
  } catch (error) {
    console.warn('[camera] Failed to enumerate devices:', error);
    return false;
  }
}

/**
 * Check if device has a back/environment-facing camera
 * Returns false for laptops with only front cameras
 * Returns true for mobile devices with back cameras
 */
export async function hasBackCamera(): Promise<boolean> {
  if (!isCameraSupported()) {
    return false;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    // If no cameras at all, return false
    if (videoDevices.length === 0) {
      return false;
    }
    
    // If only one camera, it's likely a laptop with front camera only
    if (videoDevices.length === 1) {
      const device = videoDevices[0];
      const label = device.label.toLowerCase();
      
      // Check if the single camera is explicitly a back camera
      // Some devices might label it as "back", "rear", or "environment"
      if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
        return true;
      }
      
      // If it's labeled as front/user facing, definitely not a back camera
      if (label.includes('front') || label.includes('user')) {
        return false;
      }
      
      // If unlabeled or generic, assume it's a front camera (typical for laptops)
      return false;
    }
    
    // If multiple cameras, check if any is a back camera
    for (const device of videoDevices) {
      const label = device.label.toLowerCase();
      if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
        return true;
      }
    }
    
    // Multiple cameras but can't identify a back camera from labels
    // This is likely a phone/tablet, so assume back camera exists
    return videoDevices.length > 1;
  } catch (error) {
    console.warn('[camera] Failed to check for back camera:', error);
    // On error, return false to be safe (hide camera option)
    return false;
  }
}

/**
 * Get user-friendly error message for camera errors
 */
export function getCameraErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred while accessing the camera';
}
