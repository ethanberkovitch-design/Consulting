import { useEffect, useState } from 'react';
import { fetchMarketBenchmarks } from '../lib/marketData';
import type { MarketDataResult } from '../types';

interface MarketDataState {
  data: MarketDataResult | null;
  loading: boolean;
  error: string | null;
}

export function useMarketData() {
  const [state, setState] = useState<MarketDataState>({ data: null, loading: true, error: null });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchMarketBenchmarks()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return { ...state, retry };
}
