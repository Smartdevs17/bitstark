import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface BalanceCardProps {
  btcBalance: number;
  usdValue: number;
  btcPrice?: number;
  isLoading?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  btcBalance,
  usdValue,
  btcPrice,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-3xl p-6 mb-6 border border-orange-500/20">
        <View className="flex-row items-center justify-center py-8">
          <ActivityIndicator size="large" color="#F7931A" />
          <Text className="text-orange-400 text-sm font-medium ml-3">
            Loading balance...
          </Text>
        </View>
      </View>
    );
  }

  const formatBalance = (balance: number) => {
    if (balance >= 1) {
      return balance.toFixed(4);
    } else if (balance >= 0.01) {
      return balance.toFixed(6);
    } else {
      return balance.toFixed(8);
    }
  };

  return (
    <View className="relative mb-6">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#7C2D12', '#9A3412', '#C2410C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl p-6 border border-orange-500/30"
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1">
            <Text className="text-orange-200 text-sm mb-2 font-medium">
              Total Balance
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-5xl font-black">
                {formatBalance(btcBalance)}
              </Text>
              <Text className="text-orange-300 text-2xl font-bold ml-3">
                BTC
              </Text>
            </View>
          </View>
          
          {/* Bitcoin Icon */}
          <View className="bg-orange-500/20 p-3 rounded-2xl">
            <Text className="text-orange-300 text-2xl">
              ₿
            </Text>
          </View>
        </View>
        
        {/* USD Value Section */}
        <View className="bg-black/20 rounded-2xl p-4 border border-orange-500/20">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-orange-200 text-sm mb-1 font-medium">
                USD Value
              </Text>
              <Text className="text-white text-2xl font-black">
                ${usdValue.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </Text>
            </View>
            
            {btcPrice && (
              <View className="items-end">
                <Text className="text-orange-200 text-xs font-medium">
                  BTC Price
                </Text>
                <Text className="text-orange-300 text-lg font-bold">
                  ${btcPrice.toLocaleString('en-US', { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Balance Trend */}
        <View className="mt-4 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Text className="text-orange-200 text-xs font-medium">
              Portfolio Performance
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-green-400 text-xs font-bold">
              +12.5%
            </Text>
            <Text className="text-orange-300 text-xs ml-1">
              this month
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Floating Elements */}
      <View className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full opacity-60" />
      <View className="absolute -bottom-1 -left-1 w-4 h-4 bg-yellow-400 rounded-full opacity-40" />
    </View>
  );
};