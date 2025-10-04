import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';

export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#10b981',
        backgroundColor: '#18181b',
        borderLeftWidth: 5,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
      }}
      text2Style={{
        fontSize: 14,
        color: '#a1a1aa',
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#ef4444',
        backgroundColor: '#18181b',
        borderLeftWidth: 5,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
      }}
      text2Style={{
        fontSize: 14,
        color: '#a1a1aa',
      }}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#F7931A',
        backgroundColor: '#18181b',
        borderLeftWidth: 5,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
      }}
      text2Style={{
        fontSize: 14,
        color: '#a1a1aa',
      }}
    />
  ),
  txSuccess: ({ text1, text2, props }: any) => (
    <View className="bg-zinc-900 border-l-4 border-emerald-500 rounded-r-xl p-4 mx-4 shadow-lg">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white text-base font-semibold">{text1}</Text>
        <View className="bg-emerald-500/20 px-2 py-1 rounded">
          <Text className="text-emerald-400 text-xs font-bold">✓</Text>
        </View>
      </View>
      {text2 && (
        <Text className="text-zinc-400 text-sm mb-2">{text2}</Text>
      )}
      {props?.txHash && (
        <TouchableOpacity
          onPress={() => props.onPress?.(props.txHash)}
          className="bg-zinc-800 rounded-lg py-2 px-3 mt-2"
        >
          <Text className="text-[#F7931A] text-xs font-mono">
            View on Explorer →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  ),
};

export const showSuccessToast = (title: string, message?: string) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
  });
};

export const showErrorToast = (title: string, message?: string) => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 5000,
  });
};

export const showInfoToast = (title: string, message?: string) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

export const showTransactionToast = (
  title: string,
  message: string,
  txHash: string,
  onPress: (hash: string) => void
) => {
  Toast.show({
    type: 'txSuccess',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 8000,
    props: { txHash, onPress },
  });
};