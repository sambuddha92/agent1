import { createClient } from '@/lib/supabase/server';
import { getImages, uploadImage } from '@/lib/supabase/image-storage';
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
