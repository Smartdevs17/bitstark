import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface YieldCardProps {
  apy: number;
  earned: number;
  earnedUsd: number;
  isLoading?: boolean;
}

export const YieldCard: React.FC<YieldCardProps> = ({
  apy,
  earned,
  earnedUsd,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
        <ActivityIndicator size="small" color="#F7931A" />
      </View>
    );
  }

  return (
    <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-zinc-400 text-sm mb-1 font-medium">
            Current APY
          </Text>
          <Text className="text-emerald-400 text-3xl font-bold">
            {apy.toFixed(2)}%
          </Text>
        </View>
        
        <View className="bg-emerald-500/10 px-3 py-1 rounded-full">
          <Text className="text-emerald-400 text-xs font-semibold">
            Active
          </Text>
        </View>
      </View>
      
      <View className="border-t border-zinc-800 pt-4">
        <Text className="text-zinc-400 text-sm mb-1 font-medium">
          Total Earned
        </Text>
        <View className="flex-row items-baseline">
          <Text className="text-white text-2xl font-bold">
            {earned.toFixed(8)}
          </Text>
          <Text className="text-zinc-400 text-sm font-semibold ml-2">
            BTC
          </Text>
        </View>
        <Text className="text-zinc-500 text-sm mt-1">
          ≈ ${earnedUsd.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </Text>
      </View>
    </View>
  );
};