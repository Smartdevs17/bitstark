import { useState } from 'react';

export interface DepositState {
  amount: string;
  usdValue: number;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

export const useDeposit = () => {
  const [depositState, setDepositState] = useState<DepositState>({
    amount: '',
    usdValue: 0,
    isLoading: false,
    error: null,
    txHash: null,
  });

  const BTC_PRICE = 95000; // Placeholder

  const setAmount = (value: string) => {
    // Validate BTC amount input
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 8) return; // BTC has 8 decimals
    
    const numValue = parseFloat(cleanValue) || 0;
    const usdValue = numValue * BTC_PRICE;

    setDepositState(prev => ({
      ...prev,
      amount: cleanValue,
      usdValue,
      error: null,
    }));
  };

  const executeDeposit = async () => {
    if (!depositState.amount || parseFloat(depositState.amount) <= 0) {
      setDepositState(prev => ({
        ...prev,
        error: 'Please enter a valid amount',
      }));
      return false;
    }

    setDepositState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // TODO: Replace with actual Atomiq bridge integration
      // 1. Bridge BTC to Starknet
      // 2. Deploy to Vesu/Troves yield strategy
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      
      setDepositState(prev => ({
        ...prev,
        isLoading: false,
        txHash: mockTxHash,
      }));

      return true;
    } catch (error) {
      setDepositState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Deposit failed. Please try again.',
      }));
      return false;
    }
  };

  const reset = () => {
    setDepositState({
      amount: '',
      usdValue: 0,
      isLoading: false,
      error: null,
      txHash: null,
    });
  };

  return {
    ...depositState,
    setAmount,
    executeDeposit,
    reset,
  };
};