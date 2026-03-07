'use client';

import { useState } from 'react';
import type { Model } from '@/types/database';
import { ModelCard } from './ModelCard';

type FilterType = 'all' | 'image' | 'video' | 'edit';

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'image', label: 'Изображения' },
  { value: 'video', label: 'Видео' },
  { value: 'edit', label: 'Редактирование' },
];

interface ModelsGridProps {
  models: Model[];
}

export function ModelsGrid({ models }: ModelsGridProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? models : models.filter(m => m.type === filter);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm font-black uppercase border-2 border-black transition-all ${
              filter === f.value
                ? 'bg-[#FFE600] shadow-[3px_3px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border-2 border-black p-12 text-center">
          <p className="font-bold text-gray-500">Моделей не найдено</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(model => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}
