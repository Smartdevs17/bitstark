import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  usdValue?: number;
  maxValue?: number;
  error?: string | null;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChangeText,
  placeholder = '0.00000000',
  usdValue = 0,
  maxValue,
  error,
}) => {
  return (
    <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
      <Text className="text-zinc-400 text-sm mb-2 font-medium">
        Amount
      </Text>
      
      <View className="flex-row items-center mb-2">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#71717a"
          keyboardType="decimal-pad"
          className="text-white text-4xl font-bold flex-1"
          selectionColor="#F7931A"
        />
        <Text className="text-zinc-400 text-2xl font-semibold ml-2">
          BTC
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center">
        <Text className="text-zinc-500 text-base">
          ≈ ${usdValue.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })}
        </Text>
        
        {maxValue !== undefined && (
          <TouchableOpacity
            onPress={() => onChangeText(maxValue.toString())}
            className="bg-zinc-800 px-3 py-1 rounded-lg active:opacity-70"
          >
            <Text className="text-[#F7931A] text-sm font-semibold">
              MAX
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="text-red-400 text-sm mt-2 font-medium">
          {error}
        </Text>
      )}
    </View>
  );
};