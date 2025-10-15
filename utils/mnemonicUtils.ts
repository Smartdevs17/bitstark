/**
 * React Native compatible mnemonic and key derivation utilities
 * Custom implementation that works without Node.js dependencies
 */

// BIP39 wordlist (first 100 words for simplicity - in production, use full 2048 word list)
const BIP39_WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
  'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
  'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
  'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
  'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
  'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic',
  'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest'
];

export class MnemonicUtils {
  private static readonly WORD_COUNT = 12;
  private static readonly ENTROPY_BITS = 128; // 12 words = 128 bits of entropy

  /**
   * Generate a random mnemonic phrase
   */
  static generateMnemonic(): string {
    const words: string[] = [];
    
    for (let i = 0; i < this.WORD_COUNT; i++) {
      const randomIndex = Math.floor(Math.random() * BIP39_WORDLIST.length);
      words.push(BIP39_WORDLIST[randomIndex]);
    }
    
    return words.join(' ');
  }

  /**
   * Convert mnemonic to seed (simplified implementation)
   * In production, this should use proper PBKDF2 with 2048 iterations
   */
  static async mnemonicToSeed(mnemonic: string, passphrase: string = ''): Promise<Uint8Array> {
    const combined = mnemonic + passphrase;
    const seed = new Uint8Array(64);
    
    // Simple seed generation using iterative hashing
    let hash = combined;
    for (let i = 0; i < 2048; i++) {
      hash = await this.simpleHash(hash + i.toString());
    }
    
    // Convert hash to seed bytes
    for (let i = 0; i < 64; i++) {
      const charIndex = i % hash.length;
      seed[i] = hash.charCodeAt(charIndex) % 256;
    }
    
    return seed;
  }

  /**
   * Simple hash function for seed generation
   */
  private static async simpleHash(input: string): Promise<string> {
    let hash = input;
    
    // Simple hash using character codes and string manipulation
    for (let i = 0; i < 1000; i++) {
      let newHash = '';
      for (let j = 0; j < hash.length; j++) {
        const charCode = hash.charCodeAt(j);
        const hashedChar = ((charCode * 31) + j * 7 + i) % 256;
        newHash += hashedChar.toString(16).padStart(2, '0');
      }
      hash = newHash.substring(0, 64).padEnd(64, '0');
    }
    
    return hash;
  }

  /**
   * Derive private key from seed using HD key derivation
   * Simplified implementation for Starknet
   */
  static derivePrivateKey(seed: Uint8Array, derivationPath: string = "m/44'/9004'/0'/0/0"): string {
    // Parse derivation path
    const pathParts = derivationPath.split('/');
    const indices = pathParts.slice(1).map(part => {
      if (part.endsWith("'")) {
        return parseInt(part.slice(0, -1)) + 0x80000000;
      }
      return parseInt(part);
    });

    // Simple key derivation (in production, use proper HMAC-SHA512)
    let key = new Uint8Array(seed);
    
    for (const index of indices) {
      key = this.deriveKey(key, index);
    }
    
    // Convert to hex string
    return '0x' + Array.from(key.slice(0, 32))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Simple key derivation function
   */
  private static deriveKey(parentKey: Uint8Array, index: number): Uint8Array {
    const combined = new Uint8Array(parentKey.length + 4);
    combined.set(parentKey);
    
    // Add index as big-endian bytes
    combined[parentKey.length] = (index >>> 24) & 0xff;
    combined[parentKey.length + 1] = (index >>> 16) & 0xff;
    combined[parentKey.length + 2] = (index >>> 8) & 0xff;
    combined[parentKey.length + 3] = index & 0xff;
    
    // Simple hash of combined data
    const result = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      let hash = 0;
      for (let j = 0; j < combined.length; j++) {
        hash = ((hash * 31) + combined[j] + i) % 256;
      }
      result[i] = hash;
    }
    
    return result;
  }

  /**
   * Validate mnemonic phrase
   */
  static validateMnemonic(mnemonic: string): boolean {
    const words = mnemonic.trim().split(/\s+/);
    
    if (words.length !== this.WORD_COUNT) {
      return false;
    }
    
    // Check if all words are in the wordlist
    return words.every(word => BIP39_WORDLIST.includes(word.toLowerCase()));
  }
}
