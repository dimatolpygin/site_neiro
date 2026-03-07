'use client';

import { useGenerationStatus } from '@/hooks/useGenerationStatus';
import { Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface GenerationStatusPollerProps {
  generationId: string;
  type: 'image' | 'video';
  onReset: () => void;
}

export function GenerationStatusPoller({ generationId, type, onReset }: GenerationStatusPollerProps) {
  const { status, resultUrl, errorMessage } = useGenerationStatus(generationId);

  const isProcessing = status === 'pending' || status === 'processing';

  return (
    <div className="p-6 h-full flex flex-col">
      {isProcessing && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="font-black uppercase text-sm tracking-wide">
            {status === 'pending' ? 'Ожидание в очереди...' : 'Генерация...'}
          </p>
          <div className="w-full max-w-xs bg-gray-200 border-2 border-black h-3">
            <div
              className="h-full bg-[#FFE600] border-r-2 border-black transition-all duration-500"
              style={{ width: status === 'processing' ? '65%' : '20%' }}
            />
          </div>
        </div>
      )}

      {status === 'completed' && resultUrl && (
        <div className="space-y-4">
          <div className="border-b-2 border-black pb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-black uppercase text-sm tracking-wide">Готово!</span>
          </div>
          {type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resultUrl}
              alt="Результат генерации"
              className="w-full object-contain border-2 border-black"
            />
          ) : (
            <video src={resultUrl} controls className="w-full border-2 border-black" />
          )}
          <div className="flex gap-3">
            <a
              href={resultUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFE600] border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
            >
              <Download className="h-4 w-4" />
              Скачать
            </a>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-white border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
            >
              Создать ещё
            </button>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="flex items-center gap-2 text-[#FF2D78]">
            <AlertCircle className="h-5 w-5" />
            <span className="font-black uppercase text-sm tracking-wide">Ошибка генерации</span>
          </div>
          {errorMessage && (
            <p className="text-sm text-gray-600 text-center max-w-xs">{errorMessage}</p>
          )}
          <button
            onClick={onReset}
            className="px-4 py-2 bg-white border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform"
          >
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
}
