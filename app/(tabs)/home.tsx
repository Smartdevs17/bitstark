import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { BalanceCard } from '../../components/BalanceCard';
import { DepositButton } from '../../components/DepositButton';
import { YieldCard } from '../../components/YieldCard';
import { useAuth } from '../../hooks/useAuth';
import { useYield } from '../../hooks/useYield';

export default function HomeScreen() {
  const router = useRouter();
  const auth = useAuth();
  const yieldData = useYield();

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
        <Text className="text-white text-lg">Loading...</Text>
      </SafeAreaView>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!auth.isAuthenticated) {
    return null;
  }

  // Mock balance from auth (in production, fetch from blockchain)
  const btcBalance = 0.05432;
  const btcPrice = 95000;
  const usdValue = btcBalance * btcPrice;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        className="flex-1"
        contentContainerClassName="p-6"
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-white text-3xl font-bold mb-2">
            BitStark
          </Text>
          <Text className="text-zinc-400 text-base font-medium">
            Bitcoin yield on Starknet
          </Text>
        </View>

        {/* Account Info */}
        <View className="bg-zinc-900 rounded-2xl p-4 mb-4">
          <Text className="text-zinc-400 text-xs mb-1">Starknet Account</Text>
          <Text className="text-white text-sm font-mono">
            {auth.starknetAddress?.slice(0, 6)}...{auth.starknetAddress?.slice(-4)}
          </Text>
          {auth.bitcoinAddress && (
            <>
              <Text className="text-zinc-400 text-xs mb-1 mt-2">Bitcoin Address</Text>
              <Text className="text-white text-sm font-mono">
                {auth.bitcoinAddress?.slice(0, 8)}...{auth.bitcoinAddress?.slice(-8)}
              </Text>
            </>
          )}
        </View>

        {/* Balance Card */}
        <BalanceCard
          btcBalance={btcBalance}
          usdValue={usdValue}
          isLoading={false}
        />

        {/* Yield Card */}
        <YieldCard
          apy={yieldData.apy}
          earned={yieldData.earned}
          earnedUsd={yieldData.earnedUsd}
          isLoading={yieldData.isLoading}
        />

        {/* Primary Action */}
        <View className="mb-6">
          <DepositButton
            onPress={handleDeposit}
            title="Deposit BTC"
          />
        </View>

        {/* Recent Activity */}
        <View className="bg-zinc-900 rounded-2xl p-6">
          <Text className="text-white text-lg font-semibold mb-4">
            Recent Activity
          </Text>
          
          <View className="items-center py-8">
            <Text className="text-zinc-500 text-sm">
              No recent activity
            </Text>
          </View>
        </View>

        {/* Settings Link */}
        <View className="mt-4 items-center">
          <Text 
            className="text-zinc-600 text-xs font-mono"
            onPress={() => router.push('/settings' as any)}
          >
            {auth.email}
          </Text>
        </View>

        {/* Error State */}
        {auth.error && (
          <View className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <Text className="text-red-400 text-sm font-medium">
              {auth.error}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}