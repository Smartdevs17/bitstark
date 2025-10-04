import { useEffect, useState } from 'react';
import { AtomiqService, BridgeTransaction } from '../utils/atomiqService';
import { PriceService } from '../utils/priceService';
import { WalletService } from '../utils/walletService';

export interface DepositState {
  amount: string;
  usdValue: number;
  estimatedFee: number;
  estimatedTime: number;
  isLoading: boolean;
  error: string | null;
  transaction: BridgeTransaction | null;
  step: 'input' | 'confirming' | 'signing' | 'bridging' | 'completed';
}

export const useDeposit = (starknetAddress?: string) => {
  const [depositState, setDepositState] = useState<DepositState>({
    amount: '',
    usdValue: 0,
    estimatedFee: 0,
    estimatedTime: 180,
    isLoading: false,
    error: null,
    transaction: null,
    step: 'input',
  });

  const priceService = PriceService.getInstance();
  const atomiqService = AtomiqService.getInstance();
  const walletService = WalletService.getInstance();

  // Update fees when amount changes
  useEffect(() => {
    if (depositState.amount && parseFloat(depositState.amount) > 0) {
      updateFeeEstimate(parseFloat(depositState.amount));
    }
  }, [depositState.amount]);

  const updateFeeEstimate = async (amount: number) => {
    try {
      const fee = await atomiqService.estimateBridgeFee(amount);
      setDepositState(prev => ({ ...prev, estimatedFee: fee }));
    } catch (error) {
      console.error('Failed to estimate fee:', error);
    }
  };

  const setAmount = async (value: string) => {
    // Validate BTC amount input
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 8) return; // BTC has 8 decimals
    
    const numValue = parseFloat(cleanValue) || 0;
    const btcPrice = await priceService.getBtcPrice();
    const usdValue = numValue * btcPrice;

    // Validate amount
    const validation = atomiqService.validateDepositAmount(numValue);
    
    setDepositState(prev => ({
      ...prev,
      amount: cleanValue,
      usdValue,
      error: validation.valid ? null : validation.error || null,
    }));
  };

  const executeDeposit = async (): Promise<boolean> => {
    if (!depositState.amount || parseFloat(depositState.amount) <= 0) {
      setDepositState(prev => ({
        ...prev,
        error: 'Please enter a valid amount',
      }));
      return false;
    }

    // Validate amount
    const validation = atomiqService.validateDepositAmount(parseFloat(depositState.amount));
    if (!validation.valid) {
      setDepositState(prev => ({
        ...prev,
        error: validation.error || 'Invalid amount',
      }));
      return false;
    }

    setDepositState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      step: 'confirming',
    }));

    try {
      const amount = parseFloat(depositState.amount);
      const fromAddress = walletService.getAddress();
      const toAddress = starknetAddress || '0x...'; // TODO: Get user's Starknet address

      if (!fromAddress) {
        throw new Error('Wallet not connected');
      }

      // Step 1: Get bridge quote
      setDepositState(prev => ({ ...prev, step: 'confirming' }));
      const quote = await atomiqService.getQuote(amount, fromAddress, toAddress);

      // Step 2: Sign transaction
      setDepositState(prev => ({ ...prev, step: 'signing' }));
      
      // Create PSBT (Partially Signed Bitcoin Transaction)
      // TODO: Implement actual PSBT creation with quote data
      const mockPsbt = 'mock_psbt_hex_' + quote.quoteId;
      
      const signedTx = await walletService.signTransaction(mockPsbt);

      // Step 3: Initiate bridge
      setDepositState(prev => ({ ...prev, step: 'bridging' }));
      const transaction = await atomiqService.initiateBridge(quote.quoteId, signedTx);

      // Step 4: Complete
      setDepositState(prev => ({
        ...prev,
        isLoading: false,
        transaction,
        step: 'completed',
      }));

      return true;
    } catch (error: any) {
      console.error('Deposit failed:', error);
      
      let errorMessage = 'Deposit failed. Please try again.';
      if (error.message?.includes('cancelled')) {
        errorMessage = 'Transaction cancelled';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient balance';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setDepositState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        step: 'input',
      }));

      return false;
    }
  };

  const reset = () => {
    setDepositState({
      amount: '',
      usdValue: 0,
      estimatedFee: 0,
      estimatedTime: 180,
      isLoading: false,
      error: null,
      transaction: null,
      step: 'input',
    });
  };

  const checkTransactionStatus = async (txHash: string) => {
    try {
      const status = await atomiqService.getTransactionStatus(txHash);
      setDepositState(prev => ({
        ...prev,
        transaction: status,
      }));
      return status;
    } catch (error) {
      console.error('Failed to check transaction status:', error);
      return null;
    }
  };

  return {
    ...depositState,
    setAmount,
    executeDeposit,
    reset,
    checkTransactionStatus,
  };
};