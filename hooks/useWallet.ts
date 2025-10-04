import { useCallback, useEffect, useState } from 'react';
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
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    address: null,
    publicKey: null,
    btcBalance: 0,
    usdValue: 0,
    isLoading: true,
    error: null,
  });

  const walletService = WalletService.getInstance();
  const priceService = PriceService.getInstance();

  // Initialize wallet on mount
  useEffect(() => {
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