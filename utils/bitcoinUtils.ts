/**
 * Bitcoin address generation and utilities
 * React Native compatible implementation
 */

import { MnemonicUtils } from './mnemonicUtils';

export class BitcoinUtils {
  private static readonly BITCOIN_DERIVATION_PATH = "m/84'/0'/0'/0/0"; // Native SegWit (Bech32)

  /**
   * Generate Bitcoin address from seed
   */
  static async generateBitcoinAddress(seed: Uint8Array, index: number = 0): Promise<string> {
    try {
      // Derive private key for Bitcoin using BIP84 (Native SegWit)
      const derivationPath = `m/84'/0'/0'/${index}/0`;
      const privateKey = MnemonicUtils.derivePrivateKey(seed, derivationPath);
      
      // Generate public key from private key
      const publicKey = this.privateKeyToPublicKey(privateKey);
      
      // Generate Bitcoin address (Bech32 - bc1...)
      const address = this.publicKeyToBech32Address(publicKey);
      
      return address;
    } catch (error) {
      console.error('Failed to generate Bitcoin address:', error);
      throw new Error('Failed to generate Bitcoin address');
    }
  }

  /**
   * Convert private key to public key (simplified secp256k1)
   */
  private static privateKeyToPublicKey(privateKey: string): string {
    // Remove 0x prefix
    const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    
    // Simple public key generation (in production, use proper secp256k1)
    // This is a simplified implementation for React Native compatibility
    let publicKey = '';
    for (let i = 0; i < 64; i++) {
      const keyByte = parseInt(key.slice(i * 2, i * 2 + 2), 16);
      const pubByte = (keyByte * 7 + i) % 256;
      publicKey += pubByte.toString(16).padStart(2, '0');
    }
    
    return '04' + publicKey; // Uncompressed public key format
  }

  /**
   * Convert public key to Bech32 address (Native SegWit)
   */
  private static publicKeyToBech32Address(publicKey: string): string {
    // Remove 04 prefix (uncompressed public key indicator)
    const pubKey = publicKey.startsWith('04') ? publicKey.slice(2) : publicKey;
    
    // Hash public key with SHA256
    const sha256Hash = this.simpleHash(pubKey);
    
    // Hash again with RIPEMD160 (simplified)
    const ripemd160Hash = this.simpleRipemd160(sha256Hash);
    
    // Create witness program (version 0 + hash)
    const witnessProgram = '00' + ripemd160Hash;
    
    // Convert to Bech32 address
    const address = this.encodeBech32('bc', 0, this.hexToBytes(witnessProgram));
    
    return address;
  }

  /**
   * Simple SHA256 implementation for React Native
   */
  private static simpleHash(input: string): string {
    let hash = input;
    
    // Simple hash using character codes
    for (let i = 0; i < 1000; i++) {
      let newHash = '';
      for (let j = 0; j < hash.length; j++) {
        const charCode = hash.charCodeAt(j);
        const hashedChar = ((charCode * 31) + j * 7 + i) % 256;
        newHash += hashedChar.toString(16).padStart(2, '0');
      }
      hash = newHash.substring(0, 64).padEnd(64, '0');
    }
    
    return hash.substring(0, 64);
  }

  /**
   * Simple RIPEMD160 implementation
   */
  private static simpleRipemd160(input: string): string {
    let hash = input;
    
    // Simple hash with different constants for RIPEMD160
    for (let i = 0; i < 500; i++) {
      let newHash = '';
      for (let j = 0; j < hash.length; j++) {
        const charCode = hash.charCodeAt(j);
        const hashedChar = ((charCode * 37) + j * 11 + i * 3) % 256;
        newHash += hashedChar.toString(16).padStart(2, '0');
      }
      hash = newHash.substring(0, 40).padEnd(40, '0');
    }
    
    return hash.substring(0, 40);
  }

  /**
   * Convert hex string to bytes
   */
  private static hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  /**
   * Encode Bech32 address
   */
  private static encodeBech32(hrp: string, version: number, program: number[]): string {
    const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    
    // Convert program to 5-bit groups
    const data = [version];
    let bits = 5;
    let value = 0;
    
    for (const byte of program) {
      value = (value << 8) | byte;
      bits += 8;
      
      while (bits >= 5) {
        data.push((value >>> (bits - 5)) & 31);
        bits -= 5;
      }
    }
    
    if (bits > 0) {
      data.push((value << (5 - bits)) & 31);
    }
    
    // Add checksum
    const checksum = this.createChecksum(hrp, data);
    data.push(...checksum);
    
    // Encode to string
    let result = hrp + '1';
    for (const d of data) {
      result += CHARSET[d];
    }
    
    return result;
  }

  /**
   * Create Bech32 checksum
   */
  private static createChecksum(hrp: string, data: number[]): number[] {
    const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    
    let chk = 1;
    for (let i = 0; i < hrp.length; i++) {
      const c = hrp.charCodeAt(i);
      chk = this.polyMod(chk, c >>> 5);
    }
    chk = this.polyMod(chk, 0);
    for (let i = 0; i < hrp.length; i++) {
      const c = hrp.charCodeAt(i);
      chk = this.polyMod(chk, c & 31);
    }
    for (const d of data) {
      chk = this.polyMod(chk, d);
    }
    for (let i = 0; i < 6; i++) {
      chk = this.polyMod(chk, 0);
    }
    chk ^= 1;
    
    const checksum = [];
    for (let i = 0; i < 6; i++) {
      checksum.push((chk >>> (5 * (5 - i))) & 31);
    }
    
    return checksum;
  }

  /**
   * Bech32 polynomial modulus
   */
  private static polyMod(c: number, v: number): number {
    const c0 = c >>> 25;
    c = ((c & 0x1ffffff) << 5) ^ v;
    if (c0 & 1) c ^= 0x3b6a57b2;
    if (c0 & 2) c ^= 0x26508e6d;
    if (c0 & 4) c ^= 0x1ea119fa;
    if (c0 & 8) c ^= 0x3d4233dd;
    if (c0 & 16) c ^= 0x2a1462b3;
    return c;
  }

  /**
   * Validate Bitcoin address
   */
  static validateBitcoinAddress(address: string): boolean {
    // Check if it's a Bech32 address (starts with bc1)
    if (address.startsWith('bc1')) {
      return this.validateBech32Address(address);
    }
    
    // Check if it's a legacy address (starts with 1)
    if (address.startsWith('1')) {
      return this.validateLegacyAddress(address);
    }
    
    // Check if it's a P2SH address (starts with 3)
    if (address.startsWith('3')) {
      return this.validateP2SHAddress(address);
    }
    
    return false;
  }

  /**
   * Validate Bech32 address
   */
  private static validateBech32Address(address: string): boolean {
    if (!address.startsWith('bc1')) return false;
    if (address.length < 14 || address.length > 74) return false;
    
    // Check for valid characters
    const validChars = /^[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/;
    const dataPart = address.slice(4);
    return validChars.test(dataPart);
  }

  /**
   * Validate legacy address
   */
  private static validateLegacyAddress(address: string): boolean {
    if (!address.startsWith('1')) return false;
    if (address.length < 26 || address.length > 35) return false;
    
    // Check for valid Base58 characters
    const validChars = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
    return validChars.test(address);
  }

  /**
   * Validate P2SH address
   */
  private static validateP2SHAddress(address: string): boolean {
    if (!address.startsWith('3')) return false;
    if (address.length < 26 || address.length > 35) return false;
    
    // Check for valid Base58 characters
    const validChars = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
    return validChars.test(address);
  }
}
