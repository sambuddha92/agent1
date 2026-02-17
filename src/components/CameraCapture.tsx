'use client';

import { useState, useEffect, useRef } from 'react';
import { uploadImageClient } from '@/lib/supabase/image-client';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Camera, Upload, Loader } from 'lucide-react';

export default function CameraCapture() {
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream>();

  // Get current user
  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    fetchUser();
  }, []);

  // Initialize camera
  useEffect(() => {
    if (typeof window === 'undefined' || !videoRef) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setIsCameraSupported(false);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        mediaStreamRef.current = stream;
        if (videoRef) {
          videoRef.srcObject = stream;
          setStreamActive(true);
        }
      })
      .catch(err => {
        console.error('Camera access denied:', err);
        setIsCameraSupported(false);
      });

    return () => {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      setStreamActive(false);
    };
  }, [videoRef]);

  const capturePhoto = async () => {
    if (!videoRef || !user) return;

    try {
      setError(null);
      setIsUploading(true);
      
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.videoWidth;
      canvas.height = videoRef.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef, 0, 0);

      canvas.toBlob(async blob => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          try {
            await uploadImageClient(file, 'uploaded', user.id, 'Captured image');
            setSuccess('Photo captured and uploaded successfully!');
            setTimeout(() => setSuccess(null), 3000);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Upload failed';
            setError(message);
          } finally {
            setIsUploading(false);
          }
        }
      }, 'image/jpeg');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Capture failed';
      setError(message);
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setError(null);
      setIsUploading(true);
      await uploadImageClient(file, 'uploaded', user.id, file.name);
      setSuccess('Image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
      e.target.value = ''; // Reset input
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isCameraSupported) {
    return (
      <div className="space-y-3">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {success}
          </div>
        )}
        <label className="flex items-center justify-center gap-2 p-4 bg-surface border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-surface/80 transition-colors">
          <Upload className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">Choose image from files</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}
      <div className="relative bg-black rounded-lg overflow-hidden border-2 border-primary/20">
        <video
          ref={setVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 sm:h-80 object-cover bg-black"
        />
        {streamActive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Live
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={capturePhoto}
          disabled={isUploading || !streamActive}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Capture Photo
            </>
          )}
        </button>
        
        <label className="flex-1">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={(e) => {
              const input = (e.currentTarget as HTMLButtonElement).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
              input?.click();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border-2 border-primary text-primary rounded-lg font-medium hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-4 h-4" />
            Choose File
          </button>
        </label>
      </div>
    </div>
  );
}
