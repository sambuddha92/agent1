// Client-side image functions using the Supabase client
import { createClient } from '@/lib/supabase/client';
import type { Image, ImageType } from '@/types';

export const uploadImageClient = async (
  file: File,
  type: ImageType,
  userId: string,
  description?: string
): Promise<Image> => {
  const supabase = createClient();
  const path = `${userId}/${Date.now()}-${file.name}`;

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
  return `${supabaseUrl}/storage/v1/object/public/images/${path}`;
};
