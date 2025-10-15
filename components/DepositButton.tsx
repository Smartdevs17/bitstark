import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface DepositButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  title?: string;
}

export const DepositButton: React.FC<DepositButtonProps> = ({
  onPress,
  isLoading = false,
  disabled = false,
  title = 'Deposit BTC',
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`${(disabled || isLoading) ? 'opacity-50' : 'active:opacity-90'}`}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#F7931A', '#FF8C00', '#FF7F00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl py-5 px-8 items-center justify-center border border-orange-400/30 shadow-lg"
      >
        {isLoading ? (
          <View className="flex-row items-center">
            <ActivityIndicator color="#000000" size="small" />
            <Text className="text-black text-lg font-black ml-3">
              Processing...
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Text className="text-black text-xl font-black">
              {title}
            </Text>
            <View className="ml-3 bg-black/20 px-3 py-1 rounded-full">
              <Text className="text-black text-sm font-bold">
                →
              </Text>
            </View>
          </View>
        )}
        
        {/* Subtle glow effect */}
        <View className="absolute inset-0 rounded-3xl bg-orange-400/20 opacity-0" />
      </LinearGradient>
    </TouchableOpacity>
  );
};