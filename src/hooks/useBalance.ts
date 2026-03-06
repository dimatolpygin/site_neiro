import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useBalance() {
  const { data, error, isLoading, mutate } = useSWR<{ balance: number }>(
    '/api/profile/balance',
    fetcher,
    { refreshInterval: 5000 }
  );

  return {
    balance: data?.balance,
    isLoading,
    error,
    mutate,
  };
}
