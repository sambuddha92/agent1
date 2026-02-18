// Client-side image functions using the Supabase client
import { createClient } from '@/lib/supabase/client';
import type { Image, ImageType } from '@/types';

/**
 * Sanitizes filenames for Supabase storage
 * Removes special characters, spaces, and other problematic characters
 * Supabase storage keys don't allow spaces or special Unicode characters
 */
function sanitizeFileName(fileName: string): string {
  // Get file extension
  const lastDot = fileName.lastIndexOf('.');
  const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  const ext = lastDot > 0 ? fileName.substring(lastDot) : '';

  // Replace all whitespace (including special Unicode spaces like narrow no-break space U+202F)
  // with hyphens, then remove any remaining special characters
  let sanitized = name
    .replace(/\s+/g, '-') // Replace all whitespace with hyphens
    .replace(/[^\w\-]/g, '') // Remove all non-word characters except hyphens
    .replace(/\-+/g, '-') // Replace multiple hyphens with single hyphen
    .toLowerCase(); // Convert to lowercase for consistency

  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^\-+|\-+$/g, '');

  // Ensure we have at least some filename
  if (!sanitized) {
    sanitized = 'upload';
  }

  return sanitized + ext;
}

export const uploadImageClient = async (
  file: File,
  type: ImageType,
  userId: string,
  description?: string
): Promise<Image> => {
  const supabase = createClient();
  const sanitizedFileName = sanitizeFileName(file.name);
  const path = `${userId}/${Date.now()}-${sanitizedFileName}`;

  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, file);

  if (error) throw new Error('Image upload failed: ' + error.message);

  const { data: imageData, error: insertError } = await supabase
    .from('images')
    .insert({
      user_id: userId,
      type,
      storage_path: data.path,
      description,
      metadata: {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    })
    .select()
    .single();

  if (insertError) throw new Error('Image record creation failed: ' + insertError.message);
  
  // Add the URL to the image data
  const imageUrl = getImageUrlClient(imageData.storage_path);
  return { ...imageData, url: imageUrl };
};

export const getImageUrlClient = (path: string): string => {
  // Construct Supabase public image URL directly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  
  if (!supabaseUrl) {
    console.warn('[getImageUrlClient] NEXT_PUBLIC_SUPABASE_URL is not set');
    return '';
  }
  
  // Ensure URL is properly formatted with /public/ segment
  const cleanUrl = supabaseUrl.replace(/\/$/, ''); // Remove trailing slash if present
  const cleanPath = path.startsWith('/') ? path : path; // Keep path as-is
  
  const fullUrl = `${cleanUrl}/storage/v1/object/public/images/${cleanPath}`;
  return fullUrl;
};
