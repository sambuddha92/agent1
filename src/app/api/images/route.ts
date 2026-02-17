import { createClient } from '@/lib/supabase/server';
import { getImages, uploadImage, deleteImage } from '@/lib/supabase/image-storage';
import { NextResponse } from 'next/server';
import type { ImageType } from '@/types';

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as ImageType;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const images = await getImages(user.id, type);
    return NextResponse.json(images);
  } catch (error) {
    console.error('[GET /api/images] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch images';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const type = formData.get('type') as ImageType;
  const description = formData.get('description') as string;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!file || !type) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const image = await uploadImage(buffer, file.type, type, user.id, description);
    return NextResponse.json(image);
  } catch (error) {
    console.error('[POST /api/images] Error:', error);
    const message = error instanceof Error ? error.message : 'Image upload failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('id');
    const storagePath = searchParams.get('path');

    if (!imageId || !storagePath) {
      return NextResponse.json(
        { error: 'Missing image ID or storage path' },
        { status: 400 }
      );
    }

    // Verify the image belongs to the user
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('user_id')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    if (image.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - image does not belong to user' },
        { status: 403 }
      );
    }

    // Delete the image
    await deleteImage(imageId, storagePath);
    
    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('[DELETE /api/images] Error:', error);
    const message = error instanceof Error ? error.message : 'Image deletion failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
