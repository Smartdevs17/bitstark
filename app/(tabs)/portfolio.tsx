import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { DepositButton } from '../../components/DepositButton';
import { useWallet } from '../../hooks/useWallet';
import { useYield } from '../../hooks/useYield';

export default function PortfolioScreen() {
  const wallet = useWallet();
  const yieldData = useYield();

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
            Portfolio
          </Text>
          <Text className="text-zinc-400 text-base font-medium">
            Your BitStark positions
          </Text>
        </View>

        {/* Total Value */}
        <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
          <Text className="text-zinc-400 text-sm mb-2 font-medium">
            Total Value
          </Text>
          <View className="flex-row items-baseline mb-1">
            <Text className="text-white text-4xl font-bold">
              {(yieldData.deposited + yieldData.earned).toFixed(8)}
            </Text>
            <Text className="text-zinc-400 text-xl font-semibold ml-2">
              BTC
            </Text>
          </View>
          <Text className="text-zinc-500 text-base">
            ≈ ${((yieldData.deposited + yieldData.earned) * 95000).toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>

        {/* Breakdown */}
        <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
          <Text className="text-white text-lg font-semibold mb-4">
            Position Breakdown
          </Text>

          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-zinc-400 text-sm">Deposited</Text>
              <Text className="text-white text-sm font-medium">
                {yieldData.deposited.toFixed(8)} BTC
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-zinc-400 text-sm">Earned</Text>
              <Text className="text-emerald-400 text-sm font-medium">
                +{yieldData.earned.toFixed(8)} BTC
              </Text>
            </View>
          </View>

          <View className="border-t border-zinc-800 pt-4">
            <View className="flex-row justify-between">
              <Text className="text-zinc-400 text-sm">Current APY</Text>
              <Text className="text-emerald-400 text-sm font-semibold">
                {yieldData.apy.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Performance Chart Placeholder */}
        <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
          <Text className="text-white text-lg font-semibold mb-4">
            Performance
          </Text>
          
          <View className="items-center py-12">
            <Text className="text-zinc-500 text-sm">
              Chart coming soon
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1">
            <DepositButton
              title="Deposit More"
              onPress={() => {}}
            />
          </View>
          <View className="flex-1">
            <DepositButton
              title="Withdraw"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Strategy Info */}
        <View className="bg-zinc-900 rounded-2xl p-6">
          <Text className="text-white text-base font-semibold mb-2">
            Active Strategy
          </Text>
          <Text className="text-zinc-400 text-sm mb-3">
            Vesu Optimized Yield
          </Text>
          
          <View className="bg-zinc-800 rounded-lg p-3">
            <Text className="text-zinc-500 text-xs mb-1">Risk Level</Text>
            <Text className="text-emerald-400 text-sm font-semibold">Low</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}