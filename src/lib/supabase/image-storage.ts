import { createClient } from '@/lib/supabase/server';
import type { Image, ImageType } from '@/types';

export const uploadImage = async (
  buffer: Buffer,
  mimeType: string,
  type: ImageType,
  userId: string,
  description?: string
): Promise<Image> => {
  const supabase = createClient();
  const fileExt = mimeType.split('/')[1] || 'jpg';
  const path = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, buffer, {
      contentType: mimeType,
    });

  if (error) throw new Error('Image upload failed: ' + error.message);

  const { data: imageData, error: insertError } = await supabase
    .from('images')
    .insert({
      user_id: userId,
      type,
      storage_path: data.path,
      description,
      metadata: {
        size: buffer.length,
        type: mimeType,
        uploadedAt: new Date().toISOString()
      }
    })
    .select()
    .single();

  if (insertError) throw new Error('Image record creation failed: ' + insertError.message);
  
  // Generate public URL for the image
  const publicUrl = supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl;
  
  // Return image data with URL included
  return { ...imageData, url: publicUrl };
};

export const getImages = async (
  userId: string,
  type?: ImageType
): Promise<Image[]> => {
  const supabase = createClient();
  let query = supabase
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  if (error) throw new Error('Failed to fetch images: ' + error.message);
  return data;
};

export const getImageUrl = (path: string): string => {
  const supabase = createClient();
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
};

export const deleteImage = async (imageId: string, storagePath: string): Promise<void> => {
  const supabase = createClient();
  
  // Delete from storage bucket first
  const { error: storageError } = await supabase.storage
    .from('images')
    .remove([storagePath]);
  
  if (storageError) throw new Error('Storage deletion failed: ' + storageError.message);
  
  // Then delete the database record
  const { error: dbError } = await supabase.from('images').delete().eq('id', imageId);
  if (dbError) throw new Error('Database record deletion failed: ' + dbError.message);
};
