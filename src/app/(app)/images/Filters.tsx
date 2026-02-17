'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { ImageType } from '@/types';

const filters: { label: string; value?: ImageType }[] = [
  { label: 'All' },
  { label: 'Uploaded', value: 'uploaded' },
  { label: 'Generated', value: 'generated' },
];

export default function Filters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentFilter = searchParams.get('type');

  const handleFilter = (value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('type', value);
    } else {
      params.delete('type');
    }
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.value || 'all'}
          onClick={() => handleFilter(filter.value)}
          className={`px-4 py-2 rounded-full text-sm ${
            currentFilter === filter.value || (!currentFilter && !filter.value)
              ? 'bg-black text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}