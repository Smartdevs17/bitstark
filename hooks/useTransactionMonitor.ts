import { useCallback, useEffect, useState } from 'react';
import { AtomiqService, BridgeTransaction } from '../utils/atomiqService';

interface TransactionMonitorState {
  transactions: BridgeTransaction[];
  isLoading: boolean;
  error: string | null;
}

export const useTransactionMonitor = (autoRefresh: boolean = true) => {
  const [state, setState] = useState<TransactionMonitorState>({
    transactions: [],
    isLoading: false,
    error: null,
  });

  const atomiqService = AtomiqService.getInstance();

  const addTransaction = useCallback((transaction: BridgeTransaction) => {
    setState(prev => ({
      ...prev,
      transactions: [transaction, ...prev.transactions],
    }));
  }, []);

  const updateTransactionStatus = useCallback(async (txHash: string) => {
    try {
      const updatedTx = await atomiqService.getTransactionStatus(txHash);
      
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(tx =>
          tx.txHash === txHash ? updatedTx : tx
        ),
      }));

      return updatedTx;
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      return null;
    }
  }, []);

  const refreshAllTransactions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const updates = await Promise.all(
        state.transactions
          .filter(tx => tx.status !== 'completed' && tx.status !== 'failed')
          .map(tx => atomiqService.getTransactionStatus(tx.txHash))
      );

      setState(prev => {
        const updatedTransactions = prev.transactions.map(tx => {
          const update = updates.find(u => u.txHash === tx.txHash);
          return update || tx;
        });

        return {
          ...prev,
          transactions: updatedTransactions,
          isLoading: false,
          error: null,
        };
      });
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to refresh transactions',
      }));
    }
  }, [state.transactions]);

  // Auto-refresh pending transactions every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const hasPendingTransactions = state.transactions.some(
      tx => tx.status !== 'completed' && tx.status !== 'failed'
    );

    if (!hasPendingTransactions) return;

    const interval = setInterval(() => {
      refreshAllTransactions();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [state.transactions, autoRefresh, refreshAllTransactions]);

  const getPendingTransactions = useCallback(() => {
    return state.transactions.filter(
      tx => tx.status === 'pending' || tx.status === 'confirmed' || tx.status === 'bridging'
    );
  }, [state.transactions]);

  const getCompletedTransactions = useCallback(() => {
    return state.transactions.filter(tx => tx.status === 'completed');
  }, [state.transactions]);

  const getFailedTransactions = useCallback(() => {
    return state.transactions.filter(tx => tx.status === 'failed');
  }, [state.transactions]);

  const clearTransactions = useCallback(() => {
    setState({
      transactions: [],
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    transactions: state.transactions,
    isLoading: state.isLoading,
    error: state.error,
    addTransaction,
    updateTransactionStatus,
    refreshAllTransactions,
    getPendingTransactions,
    getCompletedTransactions,
    getFailedTransactions,
    clearTransactions,
  };
};