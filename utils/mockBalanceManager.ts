/**
 * Mock Balance Manager
 * Manages user's BTC balance across wallet and portfolio
 * Simulates real balance tracking for demo purposes with persistent storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BalanceState {
  walletBalance: number;      // Available BTC for deposits
  portfolioBalance: number;   // BTC deposited in yield positions
  totalBalance: number;       // Total BTC (wallet + portfolio)
  depositedAmount: number;    // Total amount ever deposited
  earnedAmount: number;       // Total yield earned
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'yield';
  amount: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  btcTxHash?: string;
}

class MockBalanceManager {
  private static instance: MockBalanceManager;
  private balanceState: BalanceState;
  private listeners: ((state: BalanceState) => void)[] = [];
  private transactions: Transaction[] = [];
  private isInitialized: boolean = false;

  // Storage keys
  private readonly BALANCE_STATE_KEY = 'mock_balance_state';
  private readonly TRANSACTIONS_KEY = 'mock_transactions';

  private constructor() {
    // Initialize with default values - will be overridden by loadPersistedData
    this.balanceState = {
      walletBalance: 0.125,     // User starts with 0.125 BTC
      portfolioBalance: 0.025,  // User has 0.025 BTC in yield positions
      totalBalance: 0.15,       // Total: 0.125 + 0.025 = 0.15 BTC
      depositedAmount: 0.025,   // User has deposited 0.025 BTC
      earnedAmount: 0.000234,   // User has earned 0.000234 BTC in yield
    };

    // Initialize with some mock transaction history
    this.transactions = [
      {
        id: 'tx_1',
        type: 'deposit',
        amount: 0.025,
        timestamp: Date.now() - 86400000 * 7, // 7 days ago
        status: 'completed',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        btcTxHash: 'btc_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
      {
        id: 'tx_2',
        type: 'yield',
        amount: 0.000234,
        timestamp: Date.now() - 86400000 * 3, // 3 days ago
        status: 'completed',
      },
    ];

    // Load persisted data
    this.loadPersistedData();
  }

  public static getInstance(): MockBalanceManager {
    if (!MockBalanceManager.instance) {
      MockBalanceManager.instance = new MockBalanceManager();
    }
    return MockBalanceManager.instance;
  }

  /**
   * Load persisted data from AsyncStorage
   */
  private async loadPersistedData(): Promise<void> {
    try {
      const [balanceData, transactionData] = await Promise.all([
        AsyncStorage.getItem(this.BALANCE_STATE_KEY),
        AsyncStorage.getItem(this.TRANSACTIONS_KEY),
      ]);

      if (balanceData) {
        const parsedBalance = JSON.parse(balanceData);
        this.balanceState = { ...this.balanceState, ...parsedBalance };
        console.log('📱 Loaded persisted balance state:', this.balanceState);
      }

      if (transactionData) {
        const parsedTransactions = JSON.parse(transactionData);
        this.transactions = parsedTransactions;
        console.log('📱 Loaded persisted transactions:', this.transactions.length, 'transactions');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to load persisted data:', error);
      this.isInitialized = true; // Continue with default data
    }
  }

  /**
   * Save balance state to AsyncStorage
   */
  private async saveBalanceState(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.BALANCE_STATE_KEY, JSON.stringify(this.balanceState));
      console.log('💾 Saved balance state to storage');
    } catch (error) {
      console.error('❌ Failed to save balance state:', error);
    }
  }

  /**
   * Save transactions to AsyncStorage
   */
  private async saveTransactions(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(this.transactions));
      console.log('💾 Saved transactions to storage');
    } catch (error) {
      console.error('❌ Failed to save transactions:', error);
    }
  }

  /**
   * Wait for initialization to complete
   */
  private async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Get current balance state
   */
  public async getBalanceState(): Promise<BalanceState> {
    await this.waitForInitialization();
    return { ...this.balanceState };
  }

  /**
   * Simulate a deposit from wallet to portfolio
   */
  public async depositToPortfolio(amount: number, txHash?: string, btcTxHash?: string): Promise<boolean> {
    await this.waitForInitialization();
    
    if (amount <= 0 || amount > this.balanceState.walletBalance) {
      return false;
    }

    // Update balances
    this.balanceState.walletBalance -= amount;
    this.balanceState.portfolioBalance += amount;
    this.balanceState.depositedAmount += amount;
    this.balanceState.totalBalance = this.balanceState.walletBalance + this.balanceState.portfolioBalance;

    // Add transaction to history
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'deposit',
      amount,
      timestamp: Date.now(),
      status: 'completed',
      txHash,
      btcTxHash,
    };
    this.transactions.unshift(transaction); // Add to beginning of array

    // Save to persistent storage
    await Promise.all([
      this.saveBalanceState(),
      this.saveTransactions(),
    ]);

    // Notify listeners
    this.notifyListeners();

    console.log(`💰 Mock Deposit: ${amount} BTC moved from wallet to portfolio`);
    console.log(`📊 New Balances:`, this.balanceState);
    console.log(`📝 Transaction added:`, transaction);

    return true;
  }

  /**
   * Simulate a withdrawal from portfolio to wallet
   */
  public async withdrawFromPortfolio(amount: number): Promise<boolean> {
    await this.waitForInitialization();
    
    if (amount <= 0 || amount > this.balanceState.portfolioBalance) {
      return false;
    }

    // Update balances
    this.balanceState.walletBalance += amount;
    this.balanceState.portfolioBalance -= amount;
    this.balanceState.totalBalance = this.balanceState.walletBalance + this.balanceState.portfolioBalance;

    // Add transaction to history
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'withdrawal',
      amount,
      timestamp: Date.now(),
      status: 'completed',
    };
    this.transactions.unshift(transaction); // Add to beginning of array

    // Save to persistent storage
    await Promise.all([
      this.saveBalanceState(),
      this.saveTransactions(),
    ]);

    // Notify listeners
    this.notifyListeners();

    console.log(`💰 Mock Withdrawal: ${amount} BTC moved from portfolio to wallet`);
    console.log(`📊 New Balances:`, this.balanceState);
    console.log(`📝 Transaction added:`, transaction);

    return true;
  }

  /**
   * Simulate yield earnings (called periodically)
   */
  public addYieldEarnings(amount: number): void {
    this.balanceState.earnedAmount += amount;
    this.balanceState.portfolioBalance += amount;
    this.balanceState.totalBalance = this.balanceState.walletBalance + this.balanceState.portfolioBalance;

    // Notify listeners
    this.notifyListeners();

    console.log(`🌱 Mock Yield: +${amount} BTC earned`);
  }

  /**
   * Add a balance change listener
   */
  public addListener(listener: (state: BalanceState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a balance change listener
   */
  public removeListener(listener: (state: BalanceState) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of balance changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.balanceState });
      } catch (error) {
        console.error('Error notifying balance listener:', error);
      }
    });
  }

  /**
   * Add BTC to wallet (for demo purposes)
   */
  public async addToWallet(amount: number): Promise<boolean> {
    await this.waitForInitialization();
    
    if (amount <= 0) {
      return false;
    }

    // Update wallet balance
    this.balanceState.walletBalance += amount;
    this.balanceState.totalBalance = this.balanceState.walletBalance + this.balanceState.portfolioBalance;

    // Add transaction to history
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'deposit', // This represents adding BTC to wallet
      amount,
      timestamp: Date.now(),
      status: 'completed',
    };
    this.transactions.unshift(transaction);

    // Save to persistent storage
    await Promise.all([
      this.saveBalanceState(),
      this.saveTransactions(),
    ]);

    // Notify listeners
    this.notifyListeners();

    console.log(`💰 Mock: Added ${amount} BTC to wallet`);
    console.log(`📊 New Balances:`, this.balanceState);

    return true;
  }

  /**
   * Reset balances to initial state (for testing)
   */
  public async resetBalances(): Promise<void> {
    await this.waitForInitialization();
    
    this.balanceState = {
      walletBalance: 0.125,
      portfolioBalance: 0.025,
      totalBalance: 0.15,
      depositedAmount: 0.025,
      earnedAmount: 0.000234,
    };

    // Reset transactions to initial state
    this.transactions = [
      {
        id: 'tx_1',
        type: 'deposit',
        amount: 0.025,
        timestamp: Date.now() - 86400000 * 7, // 7 days ago
        status: 'completed',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        btcTxHash: 'btc_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
      {
        id: 'tx_2',
        type: 'yield',
        amount: 0.000234,
        timestamp: Date.now() - 86400000 * 3, // 3 days ago
        status: 'completed',
      },
    ];

    // Save to persistent storage
    await Promise.all([
      this.saveBalanceState(),
      this.saveTransactions(),
    ]);

    this.notifyListeners();
    console.log('🔄 Mock Balances reset to initial state');
  }

  /**
   * Clear all persisted data (for testing)
   */
  public async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.BALANCE_STATE_KEY),
        AsyncStorage.removeItem(this.TRANSACTIONS_KEY),
      ]);
      console.log('🗑️ Cleared all persisted mock data');
    } catch (error) {
      console.error('❌ Failed to clear persisted data:', error);
    }
  }

  /**
   * Get transaction history
   */
  public async getTransactionHistory(): Promise<Transaction[]> {
    await this.waitForInitialization();
    return [...this.transactions]; // Return a copy
  }

  /**
   * Get portfolio positions based on current balance
   */
  public getPortfolioPositions() {
    const totalDeposited = this.balanceState.depositedAmount;
    const totalEarned = this.balanceState.earnedAmount;
    
    // If no deposits, return empty array
    if (totalDeposited <= 0) {
      return [];
    }
    
    // Split the portfolio into 2 positions for demo
    const position1Amount = totalDeposited * 0.6; // 60% in first position
    const position2Amount = totalDeposited * 0.4; // 40% in second position
    
    const positions = [
      {
        id: 'position_1',
        amount: position1Amount,
        apy: 9.2,
        earned: totalEarned * 0.6,
        startTime: Date.now() - 86400000 * 7, // 7 days ago
        status: 'active',
      },
      {
        id: 'position_2', 
        amount: position2Amount,
        apy: 8.7,
        earned: totalEarned * 0.4,
        startTime: Date.now() - 86400000 * 3, // 3 days ago
        status: 'active',
      },
    ];

    console.log('📊 Portfolio Positions:', positions);
    return positions;
  }
}

export default MockBalanceManager;
