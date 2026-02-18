/**
 * Camera Permissions Utility
 * Handles camera permission checking and requesting using Web APIs
 */

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * Check if the browser supports camera access.
 * This is a synchronous capability check — safe to call anywhere.
 * Do NOT use label-based or device-count heuristics to decide visibility.
 */
export function isCameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

/**
 * Check current camera permission state via the Permissions API.
 * Returns 'prompt' when the Permissions API is unavailable (iOS Safari etc.)
 * so the flow always continues to actually requesting access.
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  if (!isCameraSupported()) {
    return 'unsupported';
  }

  if (!navigator.permissions?.query) {
    // Permissions API not available (iOS Safari) — assume we need to prompt
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state as PermissionStatus;
  } catch {
    // query() can throw on some browsers — treat as needing a prompt
    return 'prompt';
  }
}

/**
 * Request camera access with an environment-facing preference.
 *
 * Strategy:
 *   1. Try { facingMode: { ideal: 'environment' } } — works on all devices,
 *      browser picks back camera on phones and front camera on laptops gracefully.
 *   2. If that fails (OverconstrainedError or any error), fall back to
 *      { video: true } — bare minimum, always succeeds when a camera exists.
 *
 * Throws a user-friendly Error if permission is denied or no camera is found.
 */
export async function requestCameraAccess(): Promise<MediaStream> {
  if (!isCameraSupported()) {
    throw new Error('Camera is not supported on this device');
  }

  // Attempt 1: prefer environment (back) camera
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
    return stream;
  } catch (firstError) {
    // If permission was denied, throw immediately — no point retrying
    if (
      firstError instanceof Error &&
      (firstError.name === 'NotAllowedError' || firstError.name === 'PermissionDeniedError')
    ) {
      throw new Error('Camera access denied. Please allow camera access in your browser settings.');
    }

    // For any other error (OverconstrainedError, device issues, etc.) try bare fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      return stream;
    } catch (fallbackError) {
      // Now map the final error to a user-friendly message
      if (fallbackError instanceof Error) {
        switch (fallbackError.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            throw new Error('Camera access denied. Please allow camera access in your browser settings.');
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            throw new Error('No camera was found on this device.');
          case 'NotReadableError':
          case 'TrackStartError':
            throw new Error('Camera is already in use by another application.');
          case 'SecurityError':
            throw new Error('Camera access requires a secure connection (HTTPS).');
          default:
            throw new Error(`Could not start camera: ${fallbackError.message}`);
        }
      }
      throw new Error('An unknown error occurred while accessing the camera.');
    }
  }
}

/**
 * Stop all tracks in a media stream and release the camera hardware.
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Check whether the device has more than one video input.
 * Only call this AFTER permission has been granted — before that, device
 * labels are empty and the count may be inaccurate on some browsers.
 */
export async function hasMultipleCameras(): Promise<boolean> {
  if (!isCameraSupported()) return false;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    return videoDevices.length > 1;
  } catch {
    return false;
  }
}

/**
 * Get a user-friendly error message from an unknown thrown value.
 */
export function getCameraErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'An unknown error occurred while accessing the camera.';
}
