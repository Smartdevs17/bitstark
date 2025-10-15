import { useEffect, useState } from 'react';
import { AtomiqService, BridgeTransaction } from '../utils/atomiqService';
import MockBalanceManager from '../utils/mockBalanceManager';
import { PriceService } from '../utils/priceService';
import { PSBTService } from '../utils/psbtService';
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
  // Mock mode for instant loading - set to true to use mock data
  const MOCK_MODE = true;
  
  const [depositState, setDepositState] = useState<DepositState>({
    amount: '',
    usdValue: 0,
    estimatedFee: MOCK_MODE ? 0.0001 : 0, // Mock fee estimate
    estimatedTime: 180,
    isLoading: false,
    error: null,
    transaction: null,
    step: 'input',
  });

  const priceService = PriceService.getInstance();
  const atomiqService = AtomiqService.getInstance();
  const walletService = WalletService.getInstance();
  const balanceManager = MockBalanceManager.getInstance();

  // Update fees when amount changes
  useEffect(() => {
    if (MOCK_MODE) {
      // Mock fee calculation - simple percentage
      if (depositState.amount && parseFloat(depositState.amount) > 0) {
        const amount = parseFloat(depositState.amount);
        const mockFee = Math.max(0.0001, amount * 0.001); // 0.1% fee, minimum 0.0001 BTC
        setDepositState(prev => ({ ...prev, estimatedFee: mockFee }));
      }
      return;
    }
    
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
    
    if (MOCK_MODE) {
      // Mock price calculation
      const mockBtcPrice = 95000; // Mock BTC price
      const usdValue = numValue * mockBtcPrice;
      
      // Get current wallet balance for validation
      const currentBalance = await balanceManager.getBalanceState();
      const availableBalance = currentBalance.walletBalance;
      
      // Mock validation - check against actual wallet balance and config limits
      let error: string | null = null;
      
      if (numValue <= 0) {
        error = 'Amount must be greater than 0';
      } else if (numValue > availableBalance) {
        error = `Insufficient balance. Available: ${availableBalance.toFixed(8)} BTC`;
      } else if (numValue > 10) { // Max 10 BTC for demo
        error = 'Maximum deposit is 10 BTC';
      }
      
      setDepositState(prev => ({
        ...prev,
        amount: cleanValue,
        usdValue,
        error,
      }));
      return;
    }
    
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

    if (MOCK_MODE) {
      // Get current balance to validate before deposit
      const currentBalance = await balanceManager.getBalanceState();
      const depositAmount = parseFloat(depositState.amount);
      
      // Final validation before execution
      if (depositAmount > currentBalance.walletBalance) {
        setDepositState(prev => ({
          ...prev,
          error: `Insufficient balance. Available: ${currentBalance.walletBalance.toFixed(8)} BTC`,
        }));
        return false;
      }

      // Mock deposit execution - simulate the process
      setDepositState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        step: 'confirming',
      }));

      // Simulate the deposit process with delays
      setTimeout(() => {
        setDepositState(prev => ({ ...prev, step: 'signing' }));
      }, 1000);

      setTimeout(() => {
        setDepositState(prev => ({ ...prev, step: 'bridging' }));
      }, 2000);

      setTimeout(async () => {
        try {
          // Move the deposited amount from wallet to portfolio
          const txHash = '0x' + Math.random().toString(16).substr(2, 64);
          const btcTxHash = 'btc_' + Math.random().toString(16).substr(2, 64);
          
          const success = await balanceManager.depositToPortfolio(depositAmount, txHash, btcTxHash);
          
          if (success) {
            setDepositState(prev => ({
              ...prev,
              isLoading: false,
              step: 'completed',
              transaction: {
                txHash,
                btcTxHash,
                amount: depositAmount,
                timestamp: Date.now(),
                status: 'completed' as const,
                fee: prev.estimatedFee,
              },
            }));
          } else {
            setDepositState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Deposit failed. Please try again.',
              step: 'input',
            }));
          }
        } catch (error) {
          console.error('Mock deposit error:', error);
          setDepositState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Deposit failed. Please try again.',
            step: 'input',
          }));
        }
      }, 3000);

      return true;
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
      const psbtService = PSBTService.getInstance();
      const psbtData = await psbtService.createBridgePSBT(
        fromAddress,
        quote.destinationAddress,
        amount,
        `BitStark Bridge: ${quote.quoteId}`
      );
      
      // Convert PSBT to hex for signing
      const psbtHex = psbtService.psbtToHex(psbtData);
      const signedTx = await walletService.signTransaction(psbtHex);

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