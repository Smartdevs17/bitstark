import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

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
      className={`bg-[#F7931A] rounded-2xl py-4 px-6 items-center justify-center ${
        (disabled || isLoading) ? 'opacity-50' : 'active:opacity-80'
      }`}
    >
      {isLoading ? (
        <ActivityIndicator color="#000000" />
      ) : (
        <Text className="text-black text-lg font-bold">
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};