import { useCallback, useEffect, useState } from 'react';
import MockBalanceManager from '../utils/mockBalanceManager';
import { PriceService } from '../utils/priceService';
import { WalletService } from '../utils/walletService';

export interface WalletState {
  connected: boolean;
  address: string | null;
  publicKey: string | null;
  btcBalance: number;
  usdValue: number;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  // Mock mode for instant loading - set to true to use mock data
  const MOCK_MODE = true;
  
  const [walletState, setWalletState] = useState<WalletState>({
    connected: MOCK_MODE ? true : false,
    address: MOCK_MODE ? 'bc1qqqrhdgppyvsa9s9jxg895tpma0pceutwfrcf8za0f' : null,
    publicKey: MOCK_MODE ? '02a1633cafcc01ebfb6d78e39f687a1f0995c62fc95f51ead10a02ee0be551b5dc' : null,
    btcBalance: MOCK_MODE ? 0.125 : 0, // Will be updated by MockBalanceManager
    usdValue: MOCK_MODE ? 11875 : 0, // Will be updated by MockBalanceManager
    isLoading: MOCK_MODE ? false : true,
    error: null,
  });

  const walletService = WalletService.getInstance();
  const priceService = PriceService.getInstance();
  const balanceManager = MockBalanceManager.getInstance();

  // Initialize wallet on mount
  useEffect(() => {
    if (MOCK_MODE) {
      console.log('🚀 useWallet: Mock mode enabled, initializing with MockBalanceManager...');
      
      // Initialize with current balance from MockBalanceManager
      const initializeWallet = async () => {
        const balanceState = await balanceManager.getBalanceState();
        const btcPrice = 95000; // Mock BTC price
        
        setWalletState(prev => ({
          ...prev,
          btcBalance: balanceState.walletBalance,
          usdValue: balanceState.walletBalance * btcPrice,
          isLoading: false,
        }));
      };
      
      initializeWallet();

      // Listen for balance changes
      const handleBalanceChange = (newState: any) => {
        const btcPrice = 95000; // Mock BTC price
        setWalletState(prev => ({
          ...prev,
          btcBalance: newState.walletBalance,
          usdValue: newState.walletBalance * btcPrice,
        }));
      };

      balanceManager.addListener(handleBalanceChange);

      return () => {
        balanceManager.removeListener(handleBalanceChange);
      };
    }
    initializeWallet();
  }, []);

  const initializeWallet = async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));

      await walletService.initialize();
      
      if (walletService.isWalletConnected()) {
        await refreshBalance();
      } else {
        setWalletState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Wallet initialization failed:', error);
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initialize wallet',
      }));
    }
  };

  const refreshBalance = async () => {
    if (MOCK_MODE) {
      // Mock refresh - get current balance from MockBalanceManager
      console.log('🚀 useWallet: Mock mode - refreshing balance from MockBalanceManager');
      const balanceState = await balanceManager.getBalanceState();
      const btcPrice = 95000; // Mock BTC price
      
      setWalletState(prev => ({
        ...prev,
        btcBalance: balanceState.walletBalance,
        usdValue: balanceState.walletBalance * btcPrice,
      }));
      return;
    }

    try {
      const [balance, btcPrice] = await Promise.all([
        walletService.getBalance(),
        priceService.getBtcPrice(),
      ]);

      const address = walletService.getAddress();
      const publicKey = walletService.getPublicKey();

      setWalletState({
        connected: true,
        address,
        publicKey,
        btcBalance: balance.total,
        usdValue: balance.total * btcPrice,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch balance',
      }));
    }
  };

  const connectWallet = async () => {
    if (MOCK_MODE) {
      // Mock wallet connection - instant success
      console.log('🚀 useWallet: Mock mode - wallet connection successful');
      setWalletState(prev => ({
        ...prev,
        connected: true,
        isLoading: false,
        error: null,
      }));
      return true;
    }

    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const walletAddress = await walletService.connectWallet();
      
      // Fetch balance and price
      const [balance, btcPrice] = await Promise.all([
        walletService.getBalance(),
        priceService.getBtcPrice(),
      ]);

      setWalletState({
        connected: true,
        address: walletAddress.address,
        publicKey: walletAddress.publicKey,
        btcBalance: balance.total,
        usdValue: balance.total * btcPrice,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      
      let errorMessage = 'Failed to connect wallet';
      if (error.message?.includes('cancelled')) {
        errorMessage = 'Connection cancelled';
      } else if (error.message?.includes('Xverse')) {
        errorMessage = 'Xverse wallet not found. Please install it first.';
      }

      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return false;
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletService.disconnect();
      
      setWalletState({
        connected: false,
        address: null,
        publicKey: null,
        btcBalance: 0,
        usdValue: 0,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const signTransaction = async (txHex: string): Promise<string> => {
    try {
      const txId = await walletService.signTransaction(txHex);
      return txId;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  };

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    refreshBalance: useCallback(refreshBalance, []),
    signTransaction,
  };
};