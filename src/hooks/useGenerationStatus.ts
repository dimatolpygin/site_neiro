import useSWR from 'swr';

interface GenerationStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  errorMessage?: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useGenerationStatus(generationId: string | null) {
  const { data, error, isLoading } = useSWR<GenerationStatus>(
    generationId ? `/api/generate/status/${generationId}` : null,
    fetcher,
    {
      refreshInterval: (data) => {
        if (!data) return 2000;
        if (data.status === 'completed' || data.status === 'failed') return 0;
        return 2000;
      },
    }
  );

  return {
    status: data?.status,
    resultUrl: data?.resultUrl,
    errorMessage: data?.errorMessage,
    isLoading,
    error,
    isDone: data?.status === 'completed' || data?.status === 'failed',
  };
}
