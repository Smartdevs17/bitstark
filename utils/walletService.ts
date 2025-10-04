import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAddress, request } from '@sats-connect/core';
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
          purposes: ['payment'],
          message: 'Connect to BitStark',
          network: {
            type: CONFIG.network === 'mainnet' ? 'Mainnet' : 'Testnet',
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
      // For now, using mempool.space API as fallback
      // TODO: Replace with actual Xverse balance API when available
      const response = await fetch(
        `https://mempool.space/api/address/${this.currentAddress}`
      );
      const data = await response.json();

      const confirmedSats = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      const unconfirmedSats = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;

      return {
        confirmed: confirmedSats / 100000000, // Convert sats to BTC
        unconfirmed: unconfirmedSats / 100000000,
        total: (confirmedSats + unconfirmedSats) / 100000000,
      };
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      // Return mock data for development
      return {
        confirmed: 0.05432,
        unconfirmed: 0,
        total: 0.05432,
      };
    }
  }

  async signTransaction(txHex: string): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Use Sats Connect to sign transaction
      const response = await request('signTransaction', {
        payload: {
          network: {
            type: CONFIG.network === 'mainnet' ? 'Mainnet' : 'Testnet',
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

      return response.txId;
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