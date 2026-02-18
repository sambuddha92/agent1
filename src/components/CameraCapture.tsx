'use client';

/**
 * CameraCapture — production-grade in-app camera modal.
 *
 * Flow:
 *   Initializing → Live Preview → [Capture] → Photo Preview → [Use Photo] → onCapture(file)
 *
 * Error states:
 *   - Permission denied  → friendly message + "Upload Photo Instead" button
 *   - No camera found    → friendly message + "Upload Photo Instead" button
 *   - Camera in use      → friendly message + retry button
 *
 * Cleanup:
 *   - All tracks stopped on close, retake, and component unmount
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  Camera as CameraIcon,
  SwitchCamera,
  Loader2,
  AlertCircle,
  RotateCcw,
  Check,
  Upload,
} from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  /** Called when the user explicitly chooses to upload instead of use camera */
  onFallbackToUpload?: () => void;
}

type ModalScreen = 'preview' | 'photo-preview';

export function CameraCapture({ onCapture, onClose, onFallbackToUpload }: CameraCaptureProps) {
  const {
    videoRef,
    isActive,
    isInitializing,
    error,
    canSwitchCamera,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    blobToFile,
  } = useCamera();

  const [screen, setScreen] = useState<ModalScreen>('preview');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Revoke object URL on unmount / when it changes to prevent memory leaks
  const prevUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    prevUrlRef.current = capturedUrl;
  }, [capturedUrl]);

  // Start the camera as soon as the modal mounts
  useEffect(() => {
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup when modal unmounts — ensures hardware is released
  useEffect(() => {
    return () => {
      stopCamera();
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach stream to the video element when the video element renders
  // (needed because the video element may mount after startCamera() resolves)
  const isActiveRef = useRef(isActive);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCapture = useCallback(async () => {
    if (!isActive || isCapturing) return;
    setIsCapturing(true);

    // Flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    const blob = await capturePhoto();
    setIsCapturing(false);

    if (!blob) return;

    const url = URL.createObjectURL(blob);
    setCapturedBlob(blob);
    setCapturedUrl(url);
    setScreen('photo-preview');
    // Stop the live stream — we have the photo, no need to keep camera on
    stopCamera();
  }, [isActive, isCapturing, capturePhoto, stopCamera]);

  const handleRetake = useCallback(() => {
    setCapturedBlob(null);
    setCapturedUrl(null);
    setScreen('preview');
    startCamera();
  }, [startCamera]);

  const handleUsePhoto = useCallback(() => {
    if (!capturedBlob) return;
    const file = blobToFile(capturedBlob, `plant-photo-${Date.now()}.jpg`);
    stopCamera();
    onCapture(file);
    onClose();
  }, [capturedBlob, blobToFile, stopCamera, onCapture, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const handleFallback = useCallback(() => {
    stopCamera();
    onFallbackToUpload?.();
    onClose();
  }, [stopCamera, onFallbackToUpload, onClose]);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const isDenied =
    error?.toLowerCase().includes('denied') ||
    error?.toLowerCase().includes('settings');

  // ── Photo Preview screen ───────────────────────────────────────────────────

  if (screen === 'photo-preview' && capturedUrl) {
    return (
      <div className="camera-modal-overlay" role="dialog" aria-modal="true" aria-label="Photo preview">
        {/* Header */}
        <div className="camera-modal-header">
          <span className="text-white font-semibold text-base">Preview Photo</span>
          <button
            onClick={handleClose}
            className="camera-icon-btn"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Photo */}
        <div className="camera-modal-body">
          <div className="relative w-full max-w-2xl aspect-[4/3] rounded-xl overflow-hidden bg-black mx-auto">
            <Image
              src={capturedUrl}
              alt="Captured photo"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>

        {/* Actions */}
        <div className="camera-modal-footer">
          <div className="flex gap-3 w-full max-w-2xl mx-auto">
            <button
              onClick={handleRetake}
              className="camera-action-btn camera-action-btn--secondary"
            >
              <RotateCcw className="w-5 h-5" />
              Retake
            </button>
            <button
              onClick={handleUsePhoto}
              className="camera-action-btn camera-action-btn--primary"
            >
              <Check className="w-5 h-5" />
              Use This Photo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Live Camera screen ─────────────────────────────────────────────────────

  return (
    <div className="camera-modal-overlay" role="dialog" aria-modal="true" aria-label="Camera">
      {/* Header */}
      <div className="camera-modal-header">
        <div className="flex items-center gap-2">
          <CameraIcon className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-base">Camera</span>
        </div>
        <button
          onClick={handleClose}
          className="camera-icon-btn"
          aria-label="Close camera"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="camera-viewfinder">
        {/* Loading state */}
        {isInitializing && (
          <div className="camera-center-state">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <p className="text-white/80 mt-4 text-sm">Starting camera…</p>
          </div>
        )}

        {/* Error state */}
        {!isInitializing && error && (
          <div className="camera-center-state px-6">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white font-semibold text-lg text-center mb-2">
              {isDenied ? 'Camera Access Denied' : 'Camera Unavailable'}
            </p>
            <p className="text-white/70 text-sm text-center mb-6 max-w-xs">
              {error}
              {isDenied && (
                <> Open your browser&apos;s site settings and allow camera access, then try again.</>
              )}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {!isDenied && (
                <button
                  onClick={() => startCamera()}
                  className="camera-action-btn camera-action-btn--primary"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={handleFallback}
                className="camera-action-btn camera-action-btn--secondary"
              >
                <Upload className="w-5 h-5" />
                Upload Photo Instead
              </button>
            </div>
          </div>
        )}

        {/* Video element — always in the DOM so the ref is stable */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`camera-video${isActive && !error ? '' : ' invisible'}`}
        />

        {/* Rule-of-thirds grid — only when live */}
        {isActive && !error && (
          <div className="camera-grid" aria-hidden="true">
            <div className="camera-grid-line h camera-grid-line--1" />
            <div className="camera-grid-line h camera-grid-line--2" />
            <div className="camera-grid-line v camera-grid-line--1" />
            <div className="camera-grid-line v camera-grid-line--2" />
          </div>
        )}

        {/* Capture flash */}
        {isFlashing && <div className="camera-flash" aria-hidden="true" />}
      </div>

      {/* Controls */}
      <div className="camera-controls">
        {/* Switch camera — left slot */}
        {canSwitchCamera ? (
          <button
            onClick={switchCamera}
            disabled={!isActive || isInitializing}
            className="camera-icon-btn"
            aria-label="Switch camera"
          >
            <SwitchCamera className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-10 h-10" aria-hidden="true" />
        )}

        {/* Shutter button — centre */}
        <button
          onClick={handleCapture}
          disabled={!isActive || isInitializing || isCapturing}
          className="camera-shutter-btn"
          aria-label="Take photo"
        >
          <div className="camera-shutter-inner" />
        </button>

        {/* Right spacer — mirrors switch button for symmetry */}
        <div className="w-10 h-10" aria-hidden="true" />
      </div>

      <p className="text-white/50 text-xs text-center pb-4" aria-hidden="true">
        Tap to capture your plant
      </p>
    </div>
  );
}
