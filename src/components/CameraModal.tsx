'use client';

/**
 * CameraModal Component
 * 
 * Full-screen camera modal with live preview for both mobile and desktop.
 * Shows camera feed before capture, optimized for mobile screens.
 * 
 * Features:
 * - Permission status display
 * - HTTPS requirement warning
 * - Live camera preview with capture button
 */

import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Drag to dismiss state
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ y: 0, timestamp: 0 });
  const dismissThreshold = useRef(0);

  // Initialize camera when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const startCamera = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setIsInitializing(false);
      } catch (err) {
        if (!mounted) return;

        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Camera access denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError('No camera found on this device.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setError('Camera is already in use by another application.');
          } else {
            setError('Failed to access camera. Please try again.');
          }
        } else {
          setError('An unknown error occurred while accessing the camera.');
        }
        setIsInitializing(false);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || video.videoWidth === 0 || isCapturing) return;

    setIsCapturing(true);

    try {
      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
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

      // Convert to File
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Pass to parent
      onCapture(file);
      onClose();
    } catch (err) {
      console.error('[CameraModal] Capture failed:', err);
      setError('Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    onClose();
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Only allow drag if not initializing, no error, and not capturing
    if (isInitializing || error || isCapturing) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    dragStartRef.current = {
      y: clientY,
      timestamp: Date.now(),
    };
    
    // Calculate dismiss threshold as 30-40% of viewport height
    dismissThreshold.current = window.innerHeight * 0.35;
    
    setIsDragging(true);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const offset = clientY - dragStartRef.current.y;
    
    // Only allow downward drag (positive offset)
    if (offset > 0) {
      setDragOffset(offset);
    }
  };

  const handleDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const clientY = 'touches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;
    const offset = clientY - dragStartRef.current.y;
    const timeElapsed = Date.now() - dragStartRef.current.timestamp;
    
    // Calculate velocity (pixels per millisecond)
    const velocity = timeElapsed > 0 ? offset / timeElapsed : 0;
    
    // Dismiss if:
    // 1. Offset exceeds threshold (30-40% of viewport)
    // 2. Quick flick detected (velocity > 0.5 px/ms, roughly 500px/1s)
    if (offset > dismissThreshold.current || velocity > 0.5) {
      handleClose();
    } else {
      // Snap back to top with animation
      setDragOffset(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black touch-none"
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      style={{
        transform: `translateY(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <span className="text-white font-semibold text-lg">Camera</span>
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors text-white"
          aria-label="Close camera"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera Preview */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
            <p className="text-white/80 text-sm">Starting camera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="max-w-md bg-black/60 backdrop-blur-sm rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white font-semibold text-lg mb-2">Camera Error</p>
              <p className="text-white/70 text-sm mb-6">{error}</p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isInitializing || error ? 'invisible' : ''}`}
        />
      </div>

      {/* Capture Button */}
      {!isInitializing && !error && (
        <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 pt-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center">
            <button
              onClick={handleCapture}
              disabled={isCapturing}
              className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white hover:bg-white/30 transition-all disabled:opacity-50"
              aria-label="Capture photo"
            >
              {isCapturing ? (
                <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
              ) : (
                <div className="absolute inset-2 rounded-full bg-white" />
              )}
            </button>
          </div>
          <p className="text-white/60 text-xs text-center mt-4 sm:hidden">
            Tap to capture
          </p>
        </div>
      )}
    </div>
  );
}
