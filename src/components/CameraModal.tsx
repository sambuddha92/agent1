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
  const [state, setState] = useState<CameraModalState>('idle');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Auto-start camera when modal opens
  useEffect(() => {
    if (isOpen && state === 'idle') {
      handleOpenCamera();
    }
  }, [isOpen, state]); // handleOpenCamera is stable, no need to include

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

  const cleanup = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCapturedFile(null);
    setState('idle');
  }, [previewUrl]);

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

        {state === 'preview' && previewUrl && (
          <>
            {/* Full Screen Preview */}
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <img
                src={previewUrl}
                alt="Captured photo"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 pt-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between px-8 max-w-sm mx-auto">
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