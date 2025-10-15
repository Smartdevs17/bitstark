/**
 * PSBT (Partially Signed Bitcoin Transaction) service
 * React Native compatible implementation for creating Bitcoin transactions
 */

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: string;
  address: string;
}

export interface TransactionInput {
  txid: string;
  vout: number;
  value: number;
  address: string;
}

export interface TransactionOutput {
  address: string;
  value: number;
}

export interface PSBTData {
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  fee: number;
  totalInputValue: number;
  totalOutputValue: number;
}

export class PSBTService {
  private static instance: PSBTService;
  private readonly MEMPOOL_API = 'https://mempool.space/api';

  static getInstance(): PSBTService {
    if (!PSBTService.instance) {
      PSBTService.instance = new PSBTService();
    }
    return PSBTService.instance;
  }

  /**
   * Get UTXOs for an address
   */
  async getUTXOs(address: string): Promise<UTXO[]> {
    try {
      const response = await fetch(`${this.MEMPOOL_API}/address/${address}/utxo`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const utxos = await response.json();
      
      return utxos.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value / 100000000, // Convert sats to BTC
        scriptPubKey: utxo.scriptpubkey,
        address: address,
      }));
    } catch (error) {
      console.error('Failed to fetch UTXOs:', error);
      throw new Error('Failed to fetch UTXOs');
    }
  }

  /**
   * Get current Bitcoin fee rate
   */
  async getFeeRate(): Promise<number> {
    try {
      const response = await fetch(`${this.MEMPOOL_API}/v1/fees/recommended`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.fastestFee; // sats per vbyte
    } catch (error) {
      console.error('Failed to fetch fee rate:', error);
      return 10; // Default fee rate
    }
  }

  /**
   * Create PSBT for a Bitcoin transaction
   */
  async createPSBT(
    fromAddress: string,
    toAddress: string,
    amount: number,
    feeRate?: number
  ): Promise<PSBTData> {
    try {
      // Get UTXOs for the sender
      const utxos = await this.getUTXOs(fromAddress);
      
      if (utxos.length === 0) {
        throw new Error('No UTXOs found for address');
      }

      // Get fee rate if not provided
      const currentFeeRate = feeRate || await this.getFeeRate();

      // Calculate transaction size and fee
      const estimatedSize = this.estimateTransactionSize(utxos.length, 2); // 2 outputs (recipient + change)
      const fee = (estimatedSize * currentFeeRate) / 100000000; // Convert to BTC

      // Select UTXOs to cover amount + fee
      const selectedUTXOs = this.selectUTXOs(utxos, amount + fee);
      
      if (selectedUTXOs.length === 0) {
        throw new Error('Insufficient funds');
      }

      const totalInputValue = selectedUTXOs.reduce((sum, utxo) => sum + utxo.value, 0);
      const change = totalInputValue - amount - fee;

      // Create transaction inputs
      const inputs: TransactionInput[] = selectedUTXOs.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        address: fromAddress,
      }));

      // Create transaction outputs
      const outputs: TransactionOutput[] = [
        {
          address: toAddress,
          value: amount,
        },
      ];

      // Add change output if needed
      if (change > 0.00001) { // Dust threshold
        outputs.push({
          address: fromAddress,
          value: change,
        });
      }

      return {
        inputs,
        outputs,
        fee,
        totalInputValue,
        totalOutputValue: amount + (change > 0.00001 ? change : 0),
      };
    } catch (error) {
      console.error('Failed to create PSBT:', error);
      throw error;
    }
  }

  /**
   * Create PSBT for bridge transaction
   */
  async createBridgePSBT(
    fromAddress: string,
    bridgeAddress: string,
    amount: number,
    memo?: string
  ): Promise<PSBTData> {
    try {
      // Get UTXOs for the sender
      const utxos = await this.getUTXOs(fromAddress);
      
      if (utxos.length === 0) {
        throw new Error('No UTXOs found for address');
      }

      // Get current fee rate
      const feeRate = await this.getFeeRate();

      // Calculate transaction size (bridge transactions might be larger due to memo)
      const estimatedSize = this.estimateBridgeTransactionSize(utxos.length, memo);
      const fee = (estimatedSize * feeRate) / 100000000; // Convert to BTC

      // Select UTXOs to cover amount + fee
      const selectedUTXOs = this.selectUTXOs(utxos, amount + fee);
      
      if (selectedUTXOs.length === 0) {
        throw new Error('Insufficient funds');
      }

      const totalInputValue = selectedUTXOs.reduce((sum, utxo) => sum + utxo.value, 0);
      const change = totalInputValue - amount - fee;

      // Create transaction inputs
      const inputs: TransactionInput[] = selectedUTXOs.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        address: fromAddress,
      }));

      // Create transaction outputs
      const outputs: TransactionOutput[] = [
        {
          address: bridgeAddress,
          value: amount,
        },
      ];

      // Add change output if needed
      if (change > 0.00001) { // Dust threshold
        outputs.push({
          address: fromAddress,
          value: change,
        });
      }

      return {
        inputs,
        outputs,
        fee,
        totalInputValue,
        totalOutputValue: amount + (change > 0.00001 ? change : 0),
      };
    } catch (error) {
      console.error('Failed to create bridge PSBT:', error);
      throw error;
    }
  }

  /**
   * Estimate transaction size in vbytes
   */
  private estimateTransactionSize(inputCount: number, outputCount: number): number {
    // Base transaction size
    const baseSize = 4 + 4; // version + locktime
    
    // Input size (P2WPKH)
    const inputSize = 32 + 4 + 1 + 4; // txid + vout + scriptSig length + sequence
    const witnessSize = 1 + 72 + 33; // witness stack count + signature + pubkey
    
    // Output size
    const outputSize = 8 + 1 + 22; // value + script length + script (P2WPKH)
    
    return baseSize + (inputCount * inputSize) + (outputCount * outputSize) + (inputCount * witnessSize);
  }

  /**
   * Estimate bridge transaction size (includes memo)
   */
  private estimateBridgeTransactionSize(inputCount: number, memo?: string): number {
    const baseSize = this.estimateTransactionSize(inputCount, 2); // 2 outputs
    
    // Add memo size if present
    if (memo) {
      const memoSize = 1 + memo.length; // OP_RETURN + memo data
      return baseSize + memoSize;
    }
    
    return baseSize;
  }

  /**
   * Select UTXOs to cover the required amount
   */
  private selectUTXOs(utxos: UTXO[], requiredAmount: number): UTXO[] {
    // Sort UTXOs by value (largest first)
    const sortedUTXOs = [...utxos].sort((a, b) => b.value - a.value);
    
    const selected: UTXO[] = [];
    let totalValue = 0;
    
    for (const utxo of sortedUTXOs) {
      selected.push(utxo);
      totalValue += utxo.value;
      
      if (totalValue >= requiredAmount) {
        break;
      }
    }
    
    return totalValue >= requiredAmount ? selected : [];
  }

  /**
   * Validate transaction data
   */
  validateTransaction(psbtData: PSBTData): { valid: boolean; error?: string } {
    if (psbtData.inputs.length === 0) {
      return { valid: false, error: 'No inputs provided' };
    }
    
    if (psbtData.outputs.length === 0) {
      return { valid: false, error: 'No outputs provided' };
    }
    
    if (psbtData.totalInputValue < psbtData.totalOutputValue + psbtData.fee) {
      return { valid: false, error: 'Insufficient input value' };
    }
    
    // Check for dust outputs
    for (const output of psbtData.outputs) {
      if (output.value < 0.00001) { // Dust threshold
        return { valid: false, error: 'Output value too small (dust)' };
      }
    }
    
    return { valid: true };
  }

  /**
   * Convert PSBT data to hex format for signing
   */
  psbtToHex(psbtData: PSBTData): string {
    // This is a simplified implementation
    // In production, you would use a proper PSBT library
    const data = {
      inputs: psbtData.inputs,
      outputs: psbtData.outputs,
      fee: psbtData.fee,
    };
    
    return Buffer.from(JSON.stringify(data)).toString('hex');
  }

  /**
   * Parse hex PSBT back to data
   */
  hexToPsbt(hex: string): PSBTData {
    try {
      const data = JSON.parse(Buffer.from(hex, 'hex').toString());
      return data as PSBTData;
    } catch (error) {
      throw new Error('Invalid PSBT hex format');
    }
  }
}
