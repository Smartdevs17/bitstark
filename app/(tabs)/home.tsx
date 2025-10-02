import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { BalanceCard } from '../../components/BalanceCard';
import { DepositButton } from '../../components/DepositButton';
import { YieldCard } from '../../components/YieldCard';
import { useWallet } from '../../hooks/useWallet';
import { useYield } from '../../hooks/useYield';

export default function HomeScreen() {
  const router = useRouter();
  const wallet = useWallet();
  const yieldData = useYield();

  const handleDeposit = () => {
    router.push('/deposit' as any);
  };

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

        {/* Wallet Connection Status */}
        {!wallet.connected ? (
          <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
            <Text className="text-white text-lg font-semibold mb-2">
              Connect Wallet
            </Text>
            <Text className="text-zinc-400 text-sm mb-4">
              Connect your Xverse wallet to start earning
            </Text>
            <DepositButton
              title="Connect Xverse"
              onPress={wallet.connectWallet}
              isLoading={wallet.isLoading}
            />
          </View>
        ) : (
          <>
            {/* Balance Card */}
            <BalanceCard
              btcBalance={wallet.btcBalance}
              usdValue={wallet.usdValue}
              isLoading={wallet.isLoading}
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
              
              {/* Placeholder - will be replaced with actual transactions */}
              <View className="items-center py-8">
                <Text className="text-zinc-500 text-sm">
                  No recent activity
                </Text>
              </View>
            </View>

            {/* Wallet Address */}
            {wallet.address && (
              <View className="mt-4 items-center">
                <Text className="text-zinc-600 text-xs font-mono">
                  {wallet.address}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Error State */}
        {wallet.error && (
          <View className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <Text className="text-red-400 text-sm font-medium">
              {wallet.error}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}