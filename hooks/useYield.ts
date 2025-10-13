import { useEffect, useState } from 'react';
import { YieldService } from '../utils/yieldService';
import { useAuth } from './useAuth';

export interface YieldData {
  apy: number;
  earned: number;
  earnedUsd: number;
  deposited: number;
  isLoading: boolean;
  error: string | null;
}

export const useYield = () => {
  const auth = useAuth();
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
      if (!auth.isAuthenticated || !auth.starknetAddress) {
        setYieldData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Not authenticated',
        }));
        return;
      }

      try {
        setYieldData(prev => ({ ...prev, isLoading: true, error: null }));
        
        const yieldService = YieldService.getInstance();
        const data = await yieldService.getYieldData(auth.starknetAddress);
        
        setYieldData({
          apy: data.apy,
          earned: data.earned,
          earnedUsd: data.earnedUsd,
          deposited: data.deposited,
          isLoading: false,
          error: null,
        });
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
  }, [auth.isAuthenticated, auth.starknetAddress]);

  return {
    ...yieldData,
  };
};