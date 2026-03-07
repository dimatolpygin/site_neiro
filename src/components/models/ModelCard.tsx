'use client';

import { useRouter } from 'next/navigation';
import type { Model } from '@/types/database';
import { kopecksToRubles } from '@/lib/utils/currency';

const TYPE_COLORS: Record<Model['type'], string> = {
  image: '#FFE600',
  edit: '#FF2D78',
  video: '#00E5A0',
};

const TYPE_LABELS: Record<Model['type'], string> = {
  image: 'Изображение',
  edit: 'Редактирование',
  video: 'Видео',
};

interface ModelCardProps {
  model: Model;
}

export function ModelCard({ model }: ModelCardProps) {
  const router = useRouter();
  const accentColor = TYPE_COLORS[model.type];

  return (
    <div className="border-2 border-black shadow-[4px_4px_0px_#000] bg-white hover:-translate-y-1 hover:shadow-[4px_8px_0px_#000] transition-all flex flex-col">
      {/* Preview */}
      <div
        className="h-40 border-b-2 border-black flex items-center justify-center"
        style={{ backgroundColor: accentColor }}
      >
        {model.preview_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={model.preview_url} alt={model.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl font-black text-black opacity-30 uppercase tracking-widest">
            {model.type}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Badge */}
        <span
          className="self-start text-xs font-black uppercase tracking-wide px-2 py-0.5 border-2 border-black"
          style={{ backgroundColor: accentColor }}
        >
          {TYPE_LABELS[model.type]}
        </span>

        <div className="flex-1">
          <h3 className="font-black text-lg uppercase leading-tight">{model.name}</h3>
          {model.description && (
            <p className="text-sm text-gray-600 mt-1">{model.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t-2 border-black">
          <span className="font-black text-base">{kopecksToRubles(model.cost_kopecks)}</span>
          <button
            onClick={() => router.push(`/models/${model.slug}`)}
            className="px-4 py-2 text-xs font-black uppercase tracking-wide border-2 border-black shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform bg-[#FFE600]"
          >
            Попробовать
          </button>
        </div>
      </div>
    </div>
  );
}
