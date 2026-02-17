'use client';

import { useState, useRef } from 'react';
import { uploadImageClient } from '@/lib/supabase/image-client';
import { Camera, Upload } from 'lucide-react';
import type { Image } from '@/types';

interface ImageUploadButtonProps {
  userId: string;
  onImageUploaded: (image: Image, file: File) => void;
  disabled?: boolean;
}

export default function ImageUploadButton({ userId, onImageUploaded, disabled = false }: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    try {
      setError(null);
      setIsUploading(true);

      // Upload
      const image = await uploadImageClient(file, 'uploaded', userId, file.name);
      onImageUploaded(image, file);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  return (
    <>
      {error && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 z-40 max-w-sm">
          {error}
        </div>
      )}

      <div className="image-upload-buttons flex gap-2">
        {/* Camera Button */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="upload-icon-btn"
          title="Capture photo"
          aria-label="Capture photo"
        >
          <Camera className="w-5 h-5" />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraCapture}
            disabled={isUploading}
          />
        </button>

        {/* File Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="upload-icon-btn"
          title="Upload file"
          aria-label="Upload file"
        >
          <Upload className="w-5 h-5" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isUploading}
          />
        </button>
      </div>
    </>
  );
}
