import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function EarnScreen() {
  const auth = useAuth();
  
  // Use static mock data for instant loading - no API calls
  const mockYieldData = {
    apy: 9.2,
  };
  
  const mockYieldPools = [
    {
      id: 'vesu-btc-pool-1',
      name: 'Vesu BTC Yield Pool',
      apy: 9.2,
      tvl: 1250000,
      minDeposit: 0.001,
      maxDeposit: 10,
      lockPeriod: 30,
    },
    {
      id: 'troves-btc-pool-1',
      name: 'Troves BTC Vault',
      apy: 8.7,
      tvl: 890000,
      minDeposit: 0.005,
      maxDeposit: 5,
      lockPeriod: 14,
    },
    {
      id: 'starknet-btc-pool-1',
      name: 'Starknet BTC Pool',
      apy: 10.1,
      tvl: 2100000,
      minDeposit: 0.002,
      maxDeposit: 15,
      lockPeriod: 7,
    },
  ];

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
            Earn Yield
          </Text>
          <Text className="text-zinc-400 text-lg font-medium">
            Choose your yield strategy
          </Text>
        </View>

        {/* Current APY Overview */}
        <View className="relative mb-6">
          <LinearGradient
            colors={['#064E3B', '#065F46', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-6 border border-emerald-500/30"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-emerald-200 text-sm mb-2 font-medium">
                  Current APY
                </Text>
                <Text className="text-emerald-400 text-4xl font-black">
                  {mockYieldData.apy.toFixed(1)}%
                </Text>
              </View>
              
              <View className="bg-emerald-500/20 p-3 rounded-2xl">
                <Text className="text-emerald-300 text-2xl">
                  🔥
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Available Pools */}
        <View className="mb-6">
          <Text className="text-white text-xl font-bold mb-4">
            Available Pools
          </Text>

          {mockYieldPools.map((pool) => (
            <View key={pool.id} className="mb-4">
              <LinearGradient
                colors={['#374151', '#4B5563']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl p-5 border border-zinc-600"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-white text-lg font-bold">
                      {pool.name}
                    </Text>
                    <Text className="text-zinc-400 text-sm">
                      Min: {pool.minDeposit} BTC • Max: {pool.maxDeposit} BTC
                    </Text>
                  </View>
                  
                  <View className="bg-emerald-500/20 px-3 py-1 rounded-full">
                    <Text className="text-emerald-400 text-sm font-bold">
                      {pool.apy.toFixed(1)}% APY
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-zinc-400 text-xs mb-1">TVL</Text>
                    <Text className="text-white text-sm font-semibold">
                      ${(pool.tvl / 1000000).toFixed(1)}M
                    </Text>
                  </View>
                  
                  <View className="items-end">
                    <Text className="text-zinc-400 text-xs mb-1">Lock Period</Text>
                    <Text className="text-white text-sm font-semibold">
                      {pool.lockPeriod} days
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-emerald-500 rounded-xl py-3 px-4"
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-center font-bold">
                    Deposit Now
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-700">
          <Text className="text-white text-lg font-bold mb-4">
            Quick Actions
          </Text>
          
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-orange-500 rounded-xl py-3 px-4">
              <Text className="text-white text-center font-bold">
                Deposit BTC
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-1 bg-blue-500 rounded-xl py-3 px-4">
              <Text className="text-white text-center font-bold">
                View Strategy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}