import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import MockBalanceManager, { Transaction } from '../../utils/mockBalanceManager';

export default function ActivityScreen() {
  const router = useRouter();
  const auth = useAuth();
  const balanceManager = MockBalanceManager.getInstance();
  
  // Use MockBalanceManager for real transaction history
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Listen for balance changes to update transaction history
  useEffect(() => {
    // Initialize transactions on first load
    const loadTransactions = async () => {
      const txHistory = await balanceManager.getTransactionHistory();
      setTransactions(txHistory);
    };
    loadTransactions();

    const handleBalanceChange = async () => {
      const txHistory = await balanceManager.getTransactionHistory();
      setTransactions(txHistory);
    };

    balanceManager.addListener(handleBalanceChange);

    return () => {
      balanceManager.removeListener(handleBalanceChange);
    };
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '📥';
      case 'withdrawal': return '📤';
      case 'yield': return '💰';
      default: return '📊';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-green-400';
      case 'withdrawal': return 'text-red-400';
      case 'yield': return 'text-emerald-400';
      default: return 'text-zinc-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-white text-4xl font-black mb-2">
            Activity
          </Text>
          <Text className="text-zinc-400 text-lg font-medium">
            Your transaction history
          </Text>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <LinearGradient
              colors={['#064E3B', '#065F46']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-4 border border-emerald-500/30"
            >
              <Text className="text-emerald-200 text-xs mb-1 font-medium">
                Total Deposits
              </Text>
              <Text className="text-white text-lg font-bold">
                0.035 BTC
              </Text>
            </LinearGradient>
          </View>
          
          <View className="flex-1">
            <LinearGradient
              colors={['#1E3A8A', '#1E40AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-4 border border-blue-500/30"
            >
              <Text className="text-blue-200 text-xs mb-1 font-medium">
                Total Earned
              </Text>
              <Text className="text-white text-lg font-bold">
                0.000234 BTC
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Transaction List */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-bold">
              Recent Transactions
            </Text>
            <TouchableOpacity>
              <Text className="text-blue-400 text-sm font-medium">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <View key={tx.id} className="mb-3">
                <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-700">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-zinc-800 p-2 rounded-xl mr-3">
                        <Text className="text-lg">
                          {getTransactionIcon(tx.type)}
                        </Text>
                      </View>
                      
                      <View className="flex-1">
                        <Text className="text-white text-base font-semibold capitalize">
                          {tx.type}
                        </Text>
                        <Text className="text-zinc-400 text-sm">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="items-end">
                      <Text className={`text-base font-bold ${getTransactionColor(tx.type)}`}>
                        {tx.type === 'deposit' ? '+' : tx.type === 'withdrawal' ? '-' : '+'}
                        {tx.amount.toFixed(6)} BTC
                      </Text>
                      <Text className={`text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  {tx.txHash && (
                    <View className="mt-3 pt-3 border-t border-zinc-800">
                      <Text className="text-zinc-500 text-xs font-mono">
                        {tx.txHash}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View className="bg-zinc-900 rounded-2xl p-8 items-center">
              <Text className="text-zinc-500 text-sm mb-2">
                No transactions yet
              </Text>
              <Text className="text-zinc-600 text-xs text-center">
                Your transaction history will appear here
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-700">
          <Text className="text-white text-lg font-bold mb-4">
            Quick Actions
          </Text>
          
          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 bg-orange-500 rounded-xl py-3 px-4"
              onPress={() => router.push('/deposit')}
            >
              <Text className="text-white text-center font-bold">
                New Deposit
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-1 bg-blue-500 rounded-xl py-3 px-4">
              <Text className="text-white text-center font-bold">
                Export Data
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
