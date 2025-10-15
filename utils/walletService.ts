import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAddress, request } from '@sats-connect/core';
import { BlockchainService } from './blockchainService';
import { CONFIG } from './config';

export interface WalletAddress {
  address: string;
  publicKey: string;
  purpose: 'payment' | 'ordinals';
}

export interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

const STORAGE_KEYS = {
  WALLET_CONNECTED: 'wallet_connected',
  WALLET_ADDRESS: 'wallet_address',
  WALLET_PUBLIC_KEY: 'wallet_public_key',
};

export class WalletService {
  private static instance: WalletService;
  private isConnected: boolean = false;
  private currentAddress: string | null = null;
  private publicKey: string | null = null;

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const connected = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_CONNECTED);
      const address = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
      const pubKey = await AsyncStorage.getItem(STORAGE_KEYS.WALLET_PUBLIC_KEY);

      if (connected === 'true' && address && pubKey) {
        this.isConnected = true;
        this.currentAddress = address;
        this.publicKey = pubKey;
      }
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
    }
  }

  async connectWallet(): Promise<WalletAddress> {
    try {
      // Use Sats Connect to trigger Xverse wallet
      const response = await getAddress({
        payload: {
          purposes: ['payment' as any],
          message: 'Connect to BitStark',
          network: {
            type: (CONFIG.network === 'mainnet' ? 'Mainnet' : 'Testnet') as any,
          },
        },
        onFinish: async (response) => {
          const paymentAddress = response.addresses.find(
            (addr) => addr.purpose === 'payment'
          );

          if (paymentAddress) {
            this.currentAddress = paymentAddress.address;
            this.publicKey = paymentAddress.publicKey;
            this.isConnected = true;

            // Persist connection
            await AsyncStorage.multiSet([
              [STORAGE_KEYS.WALLET_CONNECTED, 'true'],
              [STORAGE_KEYS.WALLET_ADDRESS, paymentAddress.address],
              [STORAGE_KEYS.WALLET_PUBLIC_KEY, paymentAddress.publicKey],
            ]);
          }
        },
        onCancel: () => {
          throw new Error('User cancelled wallet connection');
        },
      });

      if (!this.currentAddress) {
        throw new Error('Failed to get wallet address');
      }

      return {
        address: this.currentAddress,
        publicKey: this.publicKey || '',
        purpose: 'payment',
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async getBalance(): Promise<WalletBalance> {
    if (!this.currentAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const blockchainService = BlockchainService.getInstance();
      const balance = await blockchainService.getBitcoinBalance(this.currentAddress);
      
      return {
        confirmed: balance.confirmed,
        unconfirmed: balance.unconfirmed,
        total: balance.total,
      };
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      // Return fallback data if API fails
      return {
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
      };
    }
  }

  async signTransaction(txHex: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Use Sats Connect to sign transaction
      const response = await request('signTransaction' as any, {
        payload: {
          network: {
            type: (CONFIG.network === 'mainnet' ? 'Mainnet' : 'Testnet') as any,
          },
          message: 'Sign BitStark deposit transaction',
          psbtBase64: txHex,
          broadcast: true,
          inputsToSign: [
            {
              address: this.currentAddress!,
              signingIndexes: [0],
            },
          ],
        },
      });

      return (response as any).txId || (response as any).txid || 'mock_tx_id';
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.currentAddress = null;
    this.publicKey = null;

    await AsyncStorage.multiRemove([
      STORAGE_KEYS.WALLET_CONNECTED,
      STORAGE_KEYS.WALLET_ADDRESS,
      STORAGE_KEYS.WALLET_PUBLIC_KEY,
    ]);
  }

  getAddress(): string | null {
    return this.currentAddress;
  }

  getPublicKey(): string | null {
    return this.publicKey;
  }

  isWalletConnected(): boolean {
    return this.isConnected;
  }
}