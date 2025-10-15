import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { BalanceCard } from '../../components/BalanceCard';
import { DepositButton } from '../../components/DepositButton';
import { YieldCard } from '../../components/YieldCard';
import { useAuth } from '../../hooks/useAuth';
import MockBalanceManager from '../../utils/mockBalanceManager';

export default function HomeScreen() {
  const router = useRouter();
  const auth = useAuth();
  const balanceManager = MockBalanceManager.getInstance();
  
  // Use MockBalanceManager for real-time balance tracking
  const [balanceState, setBalanceState] = useState({
    walletBalance: 0,
    portfolioBalance: 0,
    totalBalance: 0,
    depositedAmount: 0,
    earnedAmount: 0,
  });

  // Listen for balance changes
  useEffect(() => {
    // Initialize balance state
    const initializeBalance = async () => {
      try {
        const balance = await balanceManager.getBalanceState();
        setBalanceState(balance);
      } catch (error) {
        console.error('Failed to load balance:', error);
      }
    };
    
    initializeBalance();

    const handleBalanceChange = (newState: any) => {
      setBalanceState(newState);
    };

    balanceManager.addListener(handleBalanceChange);

    return () => {
      balanceManager.removeListener(handleBalanceChange);
    };
  }, []);

  // Calculate data for display
  const mockBalanceData = {
    btcBalance: balanceState.walletBalance,
    btcPrice: 95000,
    usdValue: balanceState.walletBalance * 95000,
  };
  
  const mockYieldData = {
    apy: 9.2,
    earned: balanceState.earnedAmount,
    earnedUsd: balanceState.earnedAmount * 95000,
    isLoading: false,
  };

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.replace('/auth' as any);
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  const handleDeposit = () => {
    router.push('/deposit');
  };


  // Show loading while checking auth
  if (auth.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-lg mb-4">Loading...</Text>
        <Text className="text-zinc-400 text-sm text-center px-6">
          Checking authentication status...
        </Text>
        {auth.error && (
          <Text className="text-red-400 text-sm text-center px-6 mt-4">
            Error: {auth.error}
          </Text>
        )}
      </SafeAreaView>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!auth.isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-lg mb-4">Not Authenticated</Text>
        <Text className="text-zinc-400 text-sm text-center px-6">
          Redirecting to login...
        </Text>
        {auth.error && (
          <Text className="text-red-400 text-sm text-center px-6 mt-4">
            Error: {auth.error}
          </Text>
        )}
      </SafeAreaView>
    );
  }


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
            BitStark
          </Text>
          <Text className="text-zinc-400 text-lg font-medium">
            Earn yield on your BTC with one tap
          </Text>
        </View>

        {/* Account Status */}
        <View className="bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl p-4 mb-6 border border-zinc-700">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-green-500/20 p-2 rounded-full mr-3">
                <Text className="text-green-400 text-sm">✓</Text>
              </View>
              <View>
                <Text className="text-white text-sm font-semibold">
                  Account Connected
                </Text>
                <Text className="text-zinc-400 text-xs">
                  {auth.starknetAddress?.slice(0, 6)}...{auth.starknetAddress?.slice(-4)}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={() => router.push('/settings' as any)}
              className="bg-zinc-700 p-2 rounded-full"
            >
              <Text className="text-white text-sm">⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <BalanceCard
          btcBalance={mockBalanceData.btcBalance}
          usdValue={mockBalanceData.usdValue}
          btcPrice={mockBalanceData.btcPrice}
          isLoading={false}
        />

        {/* Yield Card */}
        <YieldCard
          apy={mockYieldData.apy}
          earned={mockYieldData.earned}
          earnedUsd={mockYieldData.earnedUsd}
          isLoading={mockYieldData.isLoading}
        />

        {/* Primary Action */}
        <View className="mb-8">
          <DepositButton
            onPress={handleDeposit}
            title="Deposit BTC"
          />
        </View>



        {/* Footer */}
        <View className="items-center py-4">
          <Text className="text-zinc-600 text-xs font-mono">
            {auth.email}
          </Text>
          <Text className="text-zinc-700 text-xs mt-1">
            Powered by Atomiq Bridge
          </Text>
        </View>

        {/* Error State */}
        {auth.error && (
          <View className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <Text className="text-red-400 text-sm font-medium">
              {auth.error}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}