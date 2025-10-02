import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface BalanceCardProps {
  btcBalance: number;
  usdValue: number;
  isLoading?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  btcBalance,
  usdValue,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
        <ActivityIndicator size="large" color="#F7931A" />
      </View>
    );
  }

  return (
    <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
      <Text className="text-zinc-400 text-sm mb-2 font-medium">
        Total Balance
      </Text>
      
      <View className="flex-row items-baseline mb-1">
        <Text className="text-white text-5xl font-bold">
          {btcBalance.toFixed(8)}
        </Text>
        <Text className="text-zinc-400 text-xl font-semibold ml-2">
          BTC
        </Text>
      </View>
      
      <Text className="text-zinc-500 text-lg font-medium">
        ≈ ${usdValue.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}
      </Text>
    </View>
  );
};