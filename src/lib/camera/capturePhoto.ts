/**
 * Camera Capture Module
 * 
 * Deterministic camera photo capture with dual implementation:
 * 1. Primary: Native input with capture attribute (most reliable for mobile)
 * 2. Fallback: getUserMedia with canvas capture (for desktop)
 * 
 * Returns a proper File object ready for upload pipeline.
 */

import { isCameraSupported } from './permissions';

/**
 * Capture a photo using the device camera.
 * 
 * Strategy:
 * - Mobile browsers (iOS Safari, Android Chrome): Use native file input with capture="environment"
 *   This triggers the OS camera app directly and is the most reliable method.
 * 
 * - Desktop browsers: Use getUserMedia to show live camera preview, capture frame to canvas,
 *   convert to Blob, then to File.
 * 
 * @returns Promise<File> - A File object ready for upload
 * @throws Error if camera access fails or user cancels
 */
export async function capturePhoto(): Promise<File> {
  if (!isCameraSupported()) {
    throw new Error('Camera is not supported on this device');
  }

  // Detect mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // PRIMARY METHOD: Native input capture (most reliable for mobile)
    return await captureWithNativeInput();
  } else {
    // FALLBACK METHOD: getUserMedia (for desktop)
    return await captureWithGetUserMedia();
  }
}

/**
 * PRIMARY METHOD: Native file input with capture attribute
 * Most reliable for iOS Safari and Android Chrome
 */
async function captureWithNativeInput(): Promise<File> {
  return new Promise<File>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Request back camera
    
    // Handle file selection
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        // Convert to properly named File if needed
        const renamedFile = new File([file], `photo_${Date.now()}.jpg`, {
          type: file.type || 'image/jpeg',
        });
        resolve(renamedFile);
      } else {
        reject(new Error('No photo was captured'));
      }
      // Cleanup
      input.remove();
    };

    // Handle cancellation
    input.oncancel = () => {
      reject(new Error('Camera capture was cancelled'));
      input.remove();
    };

    // Trigger the camera
    input.click();
  });
}

/**
 * FALLBACK METHOD: getUserMedia with canvas capture
 * Used for desktop browsers where native capture is not available
 */
async function captureWithGetUserMedia(): Promise<File> {
  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;

  try {
    // Request camera access
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });

    // Create temporary video element
    video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    // Wait for video to be ready
    await new Promise<void>((resolve, reject) => {
      if (!video) {
        reject(new Error('Video element not initialized'));
        return;
      }
      video.onloadedmetadata = () => {
        video?.play().then(() => resolve()).catch(reject);
      };
      video.onerror = () => reject(new Error('Failed to load video stream'));
    });

    // Small delay to ensure camera is fully initialized
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture frame to canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        'image/jpeg',
        0.92
      );
    });

    // Convert Blob to File
    const file = new File([blob], `photo_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    return file;
  } catch (error) {
    // Map errors to user-friendly messages
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Camera access denied. Please allow camera access in your browser settings.');
      }
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No camera was found on this device.');
      }
      if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Camera is already in use by another application.');
      }
      throw error;
    }
    throw new Error('An unknown error occurred while accessing the camera.');
  } finally {
    // CRITICAL: Clean up stream and video element
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (video) {
      video.srcObject = null;
      video.remove();
    }
  }
}
