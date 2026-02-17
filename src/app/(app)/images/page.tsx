import { getImages } from '@/lib/supabase/image-storage';
import { createClient } from '@/lib/supabase/server';
import ImageGrid from './ImageGrid';
import Filters from './Filters';

export default async function ImagesPage({
  searchParams,
}: {
  searchParams?: { type?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Unauthorized</div>;
  }

  const images = await getImages(user.id, searchParams?.type as 'uploaded' | 'generated');

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Garden</h1>
      <Filters />
      <ImageGrid initialImages={images} />
    </div>
  );
}