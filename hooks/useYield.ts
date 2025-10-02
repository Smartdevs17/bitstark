import { useEffect, useState } from 'react';

export interface YieldData {
  apy: number;
  earned: number;
  earnedUsd: number;
  deposited: number;
  isLoading: boolean;
  error: string | null;
}

export const useYield = () => {
  const [yieldData, setYieldData] = useState<YieldData>({
    apy: 0,
    earned: 0,
    earnedUsd: 0,
    deposited: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchYieldData = async () => {
      try {
        // TODO: Replace with actual Vesu/Troves SDK integration
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const mockData = {
          apy: 8.5, // 8.5% APY
          earned: 0.00234, // BTC earned
          earnedUsd: 0.00234 * 95000,
          deposited: 0.025, // BTC deposited
          isLoading: false,
          error: null,
        };

        setYieldData(mockData);
      } catch (error) {
        setYieldData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to fetch yield data',
        }));
      }
    };

    fetchYieldData();

    // Refresh yield data every 30 seconds
    const interval = setInterval(fetchYieldData, 30000);
    return () => clearInterval(interval);
  }, []);

  return yieldData;
};