'use client';

import { useEffect, useState } from 'react';
import { X, Camera as CameraIcon, SwitchCamera, Loader2, AlertCircle } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionPrompt } from './PermissionPrompt';
import { PhotoPreview } from './PhotoPreview';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

/**
 * CameraCapture Component
 * Full-screen in-app camera experience with permission handling
 */
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const {
    videoRef,
    isActive,
    isInitializing,
    error: cameraError,
    canSwitchCamera,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    dataURLtoFile,
  } = useCamera();

  const {
    isChecking,
    isGranted,
    isDenied,
    needsPrompt,
    checkPermission,
  } = usePermissions();

  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [isCaptureInProgress, setIsCaptureInProgress] = useState(false);

  // Check permission and start camera if granted
  useEffect(() => {
    if (!isChecking) {
      if (isGranted) {
        startCamera();
      } else if (needsPrompt || isDenied) {
        setShowPermissionPrompt(true);
      }
    }
  }, [isChecking, isGranted, needsPrompt, isDenied, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle permission request
  const handleRequestPermission = async () => {
    setShowPermissionPrompt(false);
    await startCamera();
    await checkPermission();
  };

  // Handle fallback to file upload
  const handleFallbackToUpload = () => {
    setShowPermissionPrompt(false);
    onClose();
  };

  // Handle photo capture
  const handleCapture = () => {
    if (!isActive) return;
    
    setIsCaptureInProgress(true);
    
    // Add slight delay for visual feedback
    setTimeout(() => {
      const photoDataUrl = capturePhoto();
      if (photoDataUrl) {
        setCapturedPhotoUrl(photoDataUrl);
      }
      setIsCaptureInProgress(false);
    }, 100);
  };

  // Handle photo confirmation
  const handleConfirmPhoto = () => {
    if (!capturedPhotoUrl) return;

    const file = dataURLtoFile(capturedPhotoUrl, `plant-photo-${Date.now()}.jpg`);
    onCapture(file);
    stopCamera();
    onClose();
  };

  // Handle photo retake
  const handleRetakePhoto = () => {
    setCapturedPhotoUrl(null);
  };

  // Show permission prompt
  if (showPermissionPrompt) {
    return (
      <PermissionPrompt
        onRequestPermission={handleRequestPermission}
        onClose={onClose}
        onFallbackToUpload={handleFallbackToUpload}
      />
    );
  }

  // Show photo preview
  if (capturedPhotoUrl) {
    return (
      <PhotoPreview
        photoDataUrl={capturedPhotoUrl}
        onConfirm={handleConfirmPhoto}
        onRetake={handleRetakePhoto}
        onClose={onClose}
      />
    );
  }

  // Main camera view
  return (
    <div className="camera-capture">
      {/* Backdrop */}
      <div className="camera-backdrop" />

      {/* Camera container */}
      <div className="camera-container">
        {/* Header */}
        <div className="camera-header">
          <div className="flex items-center gap-2">
            <CameraIcon className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Camera</span>
          </div>
          <button
            onClick={onClose}
            className="camera-close-btn"
            aria-label="Close camera"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video viewfinder */}
        <div className="camera-viewfinder">
          {isInitializing && (
            <div className="camera-loading">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <p className="text-white mt-4">Initializing camera...</p>
            </div>
          )}

          {cameraError && (
            <div className="camera-error">
              <AlertCircle className="w-12 h-12 text-error" />
              <p className="text-white mt-4 text-center max-w-sm">{cameraError}</p>
              <button
                onClick={onClose}
                className="btn-primary mt-6"
              >
                Close
              </button>
            </div>
          )}

          {!isInitializing && !cameraError && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
          )}

          {/* Camera overlay grid (optional) */}
          {isActive && !isCaptureInProgress && (
            <div className="camera-grid">
              <div className="camera-grid-line camera-grid-line-h camera-grid-line-1" />
              <div className="camera-grid-line camera-grid-line-h camera-grid-line-2" />
              <div className="camera-grid-line camera-grid-line-v camera-grid-line-1" />
              <div className="camera-grid-line camera-grid-line-v camera-grid-line-2" />
            </div>
          )}

          {/* Capture flash effect */}
          {isCaptureInProgress && <div className="camera-flash" />}
        </div>

        {/* Controls */}
        <div className="camera-controls">
          <div className="camera-controls-inner">
            {/* Switch camera button (if available) */}
            {canSwitchCamera ? (
              <button
                onClick={switchCamera}
                disabled={!isActive || isInitializing}
                className="camera-control-btn"
                aria-label="Switch camera"
              >
                <SwitchCamera className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-14" /> // Spacer
            )}

            {/* Capture button */}
            <button
              onClick={handleCapture}
              disabled={!isActive || isInitializing || isCaptureInProgress}
              className="camera-capture-btn"
              aria-label="Take photo"
            >
              <div className="camera-capture-btn-inner" />
            </button>

            {/* Spacer for symmetry */}
            <div className="w-14" />
          </div>

          {/* Helper text */}
          <p className="text-white/70 text-sm text-center mt-4">
            Tap the button to capture your plant
          </p>
        </div>
      </div>
    </div>
  );
}
