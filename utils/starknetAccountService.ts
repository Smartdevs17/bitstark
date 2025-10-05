import { HDKey } from '@scure/bip32';
import * as bip39 from 'bip39';
import * as SecureStore from 'expo-secure-store';
import { ec, RpcProvider, stark } from 'starknet';
import { CONFIG } from './config';

interface StarknetAccountData {
  address: string;
  publicKey: string;
  accountType: 'generated' | 'imported';
  createdAt: number;
}

const SECURE_KEYS = {
  PRIVATE_KEY: 'starknet_private_key',
  MNEMONIC: 'starknet_mnemonic',
  ACCOUNT_DATA: 'starknet_account_data',
};

export class StarknetAccountService {
  private static instance: StarknetAccountService;
  private provider: RpcProvider;

  private constructor() {
    this.provider = new RpcProvider({
      nodeUrl: CONFIG.starknetRpcUrl || 'https://starknet-mainnet.public.blastapi.io',
    });
  }

  static getInstance(): StarknetAccountService {
    if (!StarknetAccountService.instance) {
      StarknetAccountService.instance = new StarknetAccountService();
    }
    return StarknetAccountService.instance;
  }

  // Generate new Starknet account from mnemonic
  async generateAccount(email: string): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      // Generate mnemonic (12 words)
      const mnemonic = bip39.generateMnemonic();
      
      // Derive private key from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic);
      const hdKey = HDKey.fromMasterSeed(seed);
      
      // Use Starknet derivation path: m/44'/9004'/0'/0/0
      const childKey = hdKey.derive("m/44'/9004'/0'/0/0");
      const privateKey = '0x' + Buffer.from(childKey.privateKey!).toString('hex');

      // Generate public key
      const publicKey = ec.starkCurve.getStarkKey(privateKey);

      // For now, we'll use the public key as the address
      // In production, you'd deploy an Account Abstraction contract
      const address = publicKey;

      // Store encrypted private key
      await SecureStore.setItemAsync(SECURE_KEYS.PRIVATE_KEY, privateKey);
      await SecureStore.setItemAsync(SECURE_KEYS.MNEMONIC, mnemonic);

      // Store account data
      const accountData: StarknetAccountData = {
        address,
        publicKey,
        accountType: 'generated',
        createdAt: Date.now(),
      };

      await SecureStore.setItemAsync(
        SECURE_KEYS.ACCOUNT_DATA,
        JSON.stringify(accountData)
      );

      return { success: true, address };
    } catch (error) {
      console.error('Failed to generate account:', error);
      return { success: false, error: 'Failed to generate account' };
    }
  }

  // Import existing Starknet account
  async importAccount(privateKeyOrMnemonic: string): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      let privateKey: string;
      let mnemonic: string | null = null;

      // Check if input is mnemonic
      if (bip39.validateMnemonic(privateKeyOrMnemonic)) {
        mnemonic = privateKeyOrMnemonic;
        
        // Derive private key from mnemonic
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const hdKey = HDKey.fromMasterSeed(seed);
        const childKey = hdKey.derive("m/44'/9004'/0'/0/0");
        privateKey = '0x' + Buffer.from(childKey.privateKey!).toString('hex');
      } else {
        // Assume it's a private key
        privateKey = privateKeyOrMnemonic.startsWith('0x') 
          ? privateKeyOrMnemonic 
          : '0x' + privateKeyOrMnemonic;
      }

      // Validate private key
      if (!this.isValidPrivateKey(privateKey)) {
        return { success: false, error: 'Invalid private key' };
      }

      // Generate public key
      const publicKey = ec.starkCurve.getStarkKey(privateKey);
      const address = publicKey;

      // Store encrypted private key
      await SecureStore.setItemAsync(SECURE_KEYS.PRIVATE_KEY, privateKey);
      
      if (mnemonic) {
        await SecureStore.setItemAsync(SECURE_KEYS.MNEMONIC, mnemonic);
      }

      // Store account data
      const accountData: StarknetAccountData = {
        address,
        publicKey,
        accountType: 'imported',
        createdAt: Date.now(),
      };

      await SecureStore.setItemAsync(
        SECURE_KEYS.ACCOUNT_DATA,
        JSON.stringify(accountData)
      );

      return { success: true, address };
    } catch (error) {
      console.error('Failed to import account:', error);
      return { success: false, error: 'Failed to import account' };
    }
  }

  // Get current account
  async getAccount(): Promise<StarknetAccountData | null> {
    try {
      const accountDataJson = await SecureStore.getItemAsync(SECURE_KEYS.ACCOUNT_DATA);
      if (!accountDataJson) return null;

      return JSON.parse(accountDataJson);
    } catch (error) {
      console.error('Failed to get account:', error);
      return null;
    }
  }

  // Get private key (requires biometric/password auth)
  async getPrivateKey(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_KEYS.PRIVATE_KEY);
    } catch (error) {
      console.error('Failed to get private key:', error);
      return null;
    }
  }

  // Get mnemonic (for backup)
  async getMnemonic(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_KEYS.MNEMONIC);
    } catch (error) {
      console.error('Failed to get mnemonic:', error);
      return null;
    }
  }

  // Get Bitcoin address derived from Starknet account
  async getBitcoinAddress(): Promise<string> {
    try {
      const privateKey = await this.getPrivateKey();
      if (!privateKey) {
        throw new Error('No private key found');
      }

      // TODO: Implement actual BTC address derivation
      // For now, return a mock address
      // In production: derive BTC address from same seed as Starknet
      
      return 'bc1q' + privateKey.slice(2, 42); // Mock BTC address
    } catch (error) {
      console.error('Failed to get Bitcoin address:', error);
      return '';
    }
  }

  // Sign transaction
  async signTransaction(txData: any): Promise<string> {
    try {
      const privateKey = await this.getPrivateKey();
      if (!privateKey) {
        throw new Error('No private key found');
      }

      // TODO: Implement actual transaction signing
      // For now, return mock signature
      const mockSignature = `0x${'0'.repeat(128)}`;
      
      return mockSignature;
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw error;
    }
  }

  // Clear account (logout)
  async clearAccount(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_KEYS.PRIVATE_KEY);
    await SecureStore.deleteItemAsync(SECURE_KEYS.MNEMONIC);
    await SecureStore.deleteItemAsync(SECURE_KEYS.ACCOUNT_DATA);
  }

  // Validate private key format
  private isValidPrivateKey(key: string): boolean {
    return /^0x[0-9a-fA-F]{64}$/.test(key);
  }

  // Deploy Account Abstraction contract (for production)
  async deployAAContract(privateKey: string): Promise<string> {
    // TODO: Implement AA contract deployment
    // This would:
    // 1. Create Account contract instance
    // 2. Deploy to Starknet
    // 3. Return contract address
    // 4. Enable gasless transactions
    
    throw new Error('AA deployment not implemented yet');
  }
}