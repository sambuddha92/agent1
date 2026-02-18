'use client';

/**
 * CameraModal Component
 * 
 * Layer 2: Fullscreen Camera Modal (UX Container)
 * Layer 3: Preview + Confirm System
 * 
 * Production-grade camera flow identical to ChatGPT on iOS Safari:
 * User taps camera icon → fullscreen modal → camera launches → preview → confirm/retake
 * 
 * States: idle | capturing | preview
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { CameraInputBridge, CameraInputBridgeRef } from './CameraInputBridge';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

type CameraModalState = 'idle' | 'capturing' | 'preview';

export function CameraModal({ isOpen, onClose, onConfirm }: CameraModalProps) {
  const cameraInputRef = useRef<CameraInputBridgeRef>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraModalState>('idle');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // More reliable platform detection
  const isMobile = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window.orientation !== 'undefined') ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && /MacIntel/.test(navigator.platform))
  );

  console.log('[CameraModal] Platform detection - isMobile:', isMobile, 'userAgent:', navigator.userAgent);

  // Auto-start camera when modal opens - different behavior for mobile vs desktop
  useEffect(() => {
    if (isOpen && state === 'idle') {
      console.log('[CameraModal] Modal opened, starting camera flow for platform:', isMobile ? 'mobile' : 'desktop');
      if (isMobile) {
        // Mobile: use file input bridge (for iOS Safari compatibility)
        handleOpenCamera();
      } else {
        // Desktop: use getUserMedia directly (no file picker)
        handleStartDesktopCamera();
      }
    }
  }, [isOpen, state, isMobile]);

  // Memory cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]); // cleanup is stable, no need to include

  // Memory cleanup when component unmounts
  useEffect(() => {
    return cleanup;
  }, []); // cleanup is stable, no need to include

  // Handle video stream assignment when entering preview state with desktop camera
  useEffect(() => {
    if (state === 'preview' && !isMobile && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      console.log('[CameraModal] useEffect: Assigning stream to video element');
      videoRef.current.srcObject = streamRef.current;
      
      // Setup event listeners
      videoRef.current.onloadedmetadata = () => {
        console.log('[CameraModal] Video metadata loaded - dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
        setIsVideoReady(true);
      };
      
      videoRef.current.onloadeddata = () => {
        console.log('[CameraModal] Video data loaded');
      };
      
      videoRef.current.oncanplay = () => {
        console.log('[CameraModal] Video can start playing');
      };
      
      videoRef.current.onerror = (e) => {
        console.error('[CameraModal] Video element error:', e);
      };
      
      // Try to play
      setTimeout(() => {
        if (videoRef.current) {
          console.log('[CameraModal] Attempting to play video');
          videoRef.current.play().catch((error) => {
            console.error('[CameraModal] Video play failed:', error);
          });
        }
      }, 100);
    }
  }, [state, isMobile]);

  const cleanup = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    // Stop desktop camera stream if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCapturedFile(null);
    setState('idle');
  }, [previewUrl]);

  const handleStartDesktopCamera = useCallback(async () => {
    console.log('[CameraModal] Starting desktop camera setup');
    setState('capturing');
    setIsVideoReady(false);

    try {
      console.log('[CameraModal] Requesting getUserMedia access');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Desktop usually has front camera
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      });

      console.log('[CameraModal] Stream obtained successfully:', stream.getVideoTracks()[0]?.getSettings());
      streamRef.current = stream;
      
      // CRITICAL FIX: Set state to preview and let useEffect handle video element setup
      // This avoids the React timing issue where videoRef.current is null
      // because React hasn't re-rendered yet
      console.log('[CameraModal] Setting state to preview - useEffect will handle video setup');
      setState('preview');
      
      // The useEffect hook (lines 72-103) will handle video element assignment
      // after React re-renders with the video element in the DOM
      
    } catch (error) {
      console.error('[CameraModal] Desktop camera failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown camera error';
      alert(`Camera access failed: ${errorMessage}`);
      onClose();
    }
  }, [onClose]);

  const handleDesktopCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || video.videoWidth === 0) return;

    try {
      console.log('[CameraModal] Capturing desktop photo');
      
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

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Create preview URL for confirmation screen
      const url = URL.createObjectURL(file);
      setCapturedFile(file);
      setPreviewUrl(url);
      setState('preview');
      
      console.log('[CameraModal] Desktop photo captured successfully');
      
    } catch (error) {
      console.error('[CameraModal] Desktop capture failed:', error);
      onClose();
    }
  }, [onClose]);

  const handleOpenCamera = useCallback(async () => {
    if (!cameraInputRef.current) {
      console.error('[CameraModal] Camera input bridge not available');
      onClose();
      return;
    }

    setState('capturing');

    try {
      // This will trigger the native camera via file input
      // Must be called synchronously within user gesture chain
      console.log('[CameraModal] Opening camera via input bridge');
      const file = await cameraInputRef.current.openCamera();
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      
      setCapturedFile(file);
      setPreviewUrl(url);
      setState('preview');
      
      console.log('[CameraModal] Photo captured, showing preview');
    } catch (error) {
      console.log('[CameraModal] Camera cancelled or failed:', error);
      // User cancelled - close modal
      onClose();
    }
  }, [onClose]);

  const handleRetake = useCallback(() => {
    // Clean up current preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedFile(null);
    setState('idle');
    
    // Reopen camera
    handleOpenCamera();
  }, [previewUrl, handleOpenCamera]);

  const handleUsePhoto = useCallback(() => {
    if (!capturedFile) return;
    
    console.log('[CameraModal] Confirming photo');
    onConfirm(capturedFile);
    onClose();
  }, [capturedFile, onConfirm, onClose]);

  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  const handleCaptured = useCallback((file: File) => {
    // This is called by CameraInputBridge - we handle it in handleOpenCamera promise
    console.log('[CameraModal] File captured via bridge:', file.name);
  }, []);

  const handleCancelled = useCallback(() => {
    // This is called by CameraInputBridge when user cancels
    console.log('[CameraModal] Camera cancelled via bridge');
    onClose();
  }, [onClose]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Fullscreen Modal Container */}
      <div className="fixed inset-0 z-[9999] bg-black">
        
        {/* Camera Input Bridge - Hidden */}
        <CameraInputBridge
          ref={cameraInputRef}
          onCapture={handleCaptured}
          onCancel={handleCancelled}
        />

        {/* Header - Always visible */}
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

        {/* State-based Content */}
        {state === 'capturing' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="text-white/80 text-sm">Opening camera...</p>
            </div>
          </div>
        )}

        {state === 'preview' && (
          <>
            {/* Desktop Live Preview or Mobile/Desktop Photo Preview */}
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              {!isMobile && streamRef.current && !previewUrl ? (
                /* Desktop Live Camera Preview */
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    transform: 'scaleX(-1)', // Mirror the video like typical camera apps
                  }}
                  onLoadedData={() => {
                    console.log('[CameraModal] Video data loaded');
                  }}
                  onPlaying={() => {
                    console.log('[CameraModal] Video is playing');
                  }}
                  onError={(e) => {
                    console.error('[CameraModal] Video error:', e);
                  }}
                />
              ) : (
                /* Photo Preview (Mobile captured or Desktop captured) */
                previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Captured photo"
                    className="max-w-full max-h-full object-contain"
                  />
                )
              )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 pt-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center">
                {!isMobile && streamRef.current && !previewUrl ? (
                  /* Desktop Live Preview - Show Capture Button */
                  <button
                    onClick={handleDesktopCapture}
                    className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white hover:bg-white/30 transition-all"
                    aria-label="Capture photo"
                  >
                    <div className="absolute inset-2 rounded-full bg-white" />
                  </button>
                ) : (
                  /* Photo Preview - Show Retake/Use Photo */
                  <div className="flex items-center justify-between px-8 max-w-sm mx-auto w-full">
                    {/* Retake Button */}
                    <button
                      onClick={handleRetake}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors border border-white/20"
                    >
                      Retake
                    </button>

                    {/* Use Photo Button */}
                    <button
                      onClick={handleUsePhoto}
                      className="px-6 py-3 bg-white hover:bg-white/90 text-black rounded-full font-medium transition-colors"
                    >
                      Use Photo
                    </button>
                  </div>
                )}
              </div>
              
              {/* Safe area padding for iPhone */}
              <div className="h-4"></div>
            </div>
          </>
        )}

        {/* Loading/Error State Fallback */}
        {state === 'idle' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white/80 text-sm">Preparing camera...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}