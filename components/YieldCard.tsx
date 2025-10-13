import { LinearGradient } from 'expo-linear-gradient';
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
      <View className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl p-6 mb-6 border border-emerald-500/20">
        <View className="flex-row items-center justify-center py-8">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-emerald-400 text-sm font-medium ml-3">
            Loading yield data...
          </Text>
        </View>
      </View>
    );
  }

  const getApyColor = (apy: number) => {
    if (apy >= 10) return 'text-emerald-400';
    if (apy >= 8) return 'text-green-400';
    if (apy >= 6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getApyGradient = (apy: number) => {
    if (apy >= 10) return ['#10B981', '#059669'];
    if (apy >= 8) return ['#22C55E', '#16A34A'];
    if (apy >= 6) return ['#EAB308', '#CA8A04'];
    return ['#F97316', '#EA580C'];
  };

  return (
    <View className="relative mb-6">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#064E3B', '#065F46', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl p-6 border border-emerald-500/30"
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1">
            <Text className="text-emerald-200 text-sm mb-2 font-medium">
              Current APY
            </Text>
            <View className="flex-row items-baseline">
              <Text className={`${getApyColor(apy)} text-4xl font-black`}>
                {apy.toFixed(2)}%
              </Text>
              <View className="ml-3 bg-emerald-500/20 px-3 py-1 rounded-full">
                <Text className="text-emerald-300 text-xs font-bold">
                  🔥 HOT
                </Text>
              </View>
            </View>
          </View>
          
          {/* APY Trend Indicator */}
          <View className="bg-emerald-500/20 px-4 py-2 rounded-2xl">
            <Text className="text-emerald-300 text-xs font-bold">
              +2.3%
            </Text>
            <Text className="text-emerald-400 text-xs">
              vs last week
            </Text>
          </View>
        </View>
        
        {/* Earnings Section */}
        <View className="bg-black/20 rounded-2xl p-4 border border-emerald-500/20">
          <Text className="text-emerald-200 text-sm mb-3 font-medium">
            Total Earned
          </Text>
          <View className="flex-row items-baseline mb-2">
            <Text className="text-white text-3xl font-black">
              {earned.toFixed(8)}
            </Text>
            <Text className="text-emerald-300 text-lg font-bold ml-2">
              BTC
            </Text>
          </View>
          <Text className="text-emerald-300 text-lg font-semibold">
            ≈ ${earnedUsd.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="mt-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-emerald-200 text-xs font-medium">
              Monthly Progress
            </Text>
            <Text className="text-emerald-300 text-xs font-bold">
              73%
            </Text>
          </View>
          <View className="bg-black/30 rounded-full h-2">
            <View 
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full h-2"
              style={{ width: '73%' }}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Floating Elements */}
      <View className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full opacity-60" />
      <View className="absolute -bottom-1 -left-1 w-4 h-4 bg-emerald-300 rounded-full opacity-40" />
    </View>
  );
};