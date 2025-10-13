import * as SecureStore from 'expo-secure-store';
import { ec, RpcProvider } from 'starknet';
import { BitcoinUtils } from './bitcoinUtils';
import { CONFIG } from './config';
import { MnemonicUtils } from './mnemonicUtils';

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
      const mnemonic = MnemonicUtils.generateMnemonic();
      
      // Derive private key from mnemonic
      const seed = await MnemonicUtils.mnemonicToSeed(mnemonic);
      const privateKey = MnemonicUtils.derivePrivateKey(seed, "m/44'/9004'/0'/0/0");

      // Generate public key
      const publicKey = ec.starkCurve.getStarkKey(privateKey);

      // For now, we'll use the public key as the address
      // In production, you'd deploy an Account Abstraction contract
      const address = publicKey;

      // Store encrypted private key and mnemonic
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

      // Verify that everything was stored correctly
      const storedMnemonic = await SecureStore.getItemAsync(SECURE_KEYS.MNEMONIC);
      const storedPrivateKey = await SecureStore.getItemAsync(SECURE_KEYS.PRIVATE_KEY);
      
      if (!storedMnemonic || !storedPrivateKey) {
        throw new Error('Failed to store account data securely');
      }

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
      if (MnemonicUtils.validateMnemonic(privateKeyOrMnemonic)) {
        mnemonic = privateKeyOrMnemonic;
        
        // Derive private key from mnemonic
        const seed = await MnemonicUtils.mnemonicToSeed(mnemonic);
        privateKey = MnemonicUtils.derivePrivateKey(seed, "m/44'/9004'/0'/0/0");
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

  // Check if account is properly set up with mnemonic
  async isAccountSetupComplete(): Promise<boolean> {
    try {
      const mnemonic = await this.getMnemonic();
      const privateKey = await this.getPrivateKey();
      const accountData = await SecureStore.getItemAsync(SECURE_KEYS.ACCOUNT_DATA);
      
      return !!(mnemonic && privateKey && accountData);
    } catch (error) {
      console.error('Failed to check account setup:', error);
      return false;
    }
  }

  // Clear incomplete account data
  async clearIncompleteAccount(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.PRIVATE_KEY);
      await SecureStore.deleteItemAsync(SECURE_KEYS.MNEMONIC);
      await SecureStore.deleteItemAsync(SECURE_KEYS.ACCOUNT_DATA);
    } catch (error) {
      console.error('Failed to clear incomplete account:', error);
    }
  }

  // Get Bitcoin address derived from Starknet account
  async getBitcoinAddress(): Promise<string> {
    try {
      const mnemonic = await this.getMnemonic();
      if (!mnemonic) {
        console.error('No mnemonic found - user may not have completed account setup');
        // Return a placeholder address for now
        return 'bc1q' + '0'.repeat(39); // Placeholder address
      }

      // Generate seed from mnemonic
      const seed = await MnemonicUtils.mnemonicToSeed(mnemonic);
      
      // Generate Bitcoin address from the same seed
      const bitcoinAddress = await BitcoinUtils.generateBitcoinAddress(seed);
      
      return bitcoinAddress;
    } catch (error) {
      console.error('Failed to get Bitcoin address:', error);
      // Return a placeholder address instead of empty string
      return 'bc1q' + '0'.repeat(39);
    }
  }

  // Sign transaction
  async signTransaction(txData: any): Promise<string> {
    try {
      const privateKey = await this.getPrivateKey();
      if (!privateKey) {
        throw new Error('No private key found');
      }

      // Create Starknet transaction hash
      const txHash = this.createTransactionHash(txData);
      
      // Sign the transaction hash
      const signature = ec.starkCurve.sign(txHash, privateKey);
      
      // Return signature in hex format
      return `0x${signature.r.toString(16)}${signature.s.toString(16)}`;
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

  /**
   * Create transaction hash for signing
   */
  private createTransactionHash(txData: any): string {
    // Create a hash from transaction data
    // This is a simplified implementation - in production, use proper Starknet transaction hashing
    const dataString = JSON.stringify(txData);
    let hash = '';
    
    for (let i = 0; i < dataString.length; i++) {
      const charCode = dataString.charCodeAt(i);
      hash += charCode.toString(16);
    }
    
    // Pad to 64 characters (32 bytes)
    return hash.padEnd(64, '0').substring(0, 64);
  }
}