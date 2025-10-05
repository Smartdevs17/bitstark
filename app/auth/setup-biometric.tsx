import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function SetupBiometricScreen() {
  const router = useRouter();
  const auth = useAuth();

  const handleEnableBiometric = async () => {
    const success = await auth.enableBiometric();
    if (success) {
      router.replace('/(tabs)/home');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  const getBiometricIcon = () => {
    switch (auth.biometricType) {
      case 'faceId':
        return '🔒';
      case 'touchId':
      case 'fingerprint':
        return '👆';
      default:
        return '🔐';
    }
  };

  const getBiometricName = () => {
    switch (auth.biometricType) {
      case 'faceId':
        return 'Face ID';
      case 'touchId':
        return 'Touch ID';
      case 'fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <View className="flex-1 p-6 justify-between">
        <View className="flex-1 justify-center items-center">
          {/* Icon */}
          <Text className="text-8xl mb-8">{getBiometricIcon()}</Text>

          {/* Title */}
          <Text className="text-white text-3xl font-bold text-center mb-4">
            Enable {getBiometricName()}
          </Text>

          {/* Description */}
          <Text className="text-zinc-400 text-base text-center mb-8 px-4">
            Use {getBiometricName()} to quickly and securely access your BitStark account
          </Text>

          {/* Benefits */}
          <View className="bg-zinc-900 rounded-2xl p-6 w-full mb-8">
            <View className="flex-row items-start mb-4">
              <Text className="text-2xl mr-3">⚡</Text>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold mb-1">
                  Instant Access
                </Text>
                <Text className="text-zinc-400 text-sm">
                  Sign in with just a glance or touch
                </Text>
              </View>
            </View>

            <View className="flex-row items-start mb-4">
              <Text className="text-2xl mr-3">🔐</Text>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold mb-1">
                  Extra Security
                </Text>
                <Text className="text-zinc-400 text-sm">
                  Your biometric data never leaves your device
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">🚀</Text>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold mb-1">
                  Faster Transactions
                </Text>
                <Text className="text-zinc-400 text-sm">
                  Approve deposits and withdrawals instantly
                </Text>
              </View>
            </View>
          </View>

          {/* Error */}
          {auth.error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 w-full mb-4">
              <Text className="text-red-400 text-sm text-center">
                {auth.error}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View>
          <TouchableOpacity
            onPress={handleEnableBiometric}
            disabled={auth.isLoading}
            className={`bg-[#F7931A] rounded-xl py-4 mb-4 ${
              auth.isLoading ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-black text-center text-base font-bold">
              {auth.isLoading ? 'Setting up...' : `Enable ${getBiometricName()}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            disabled={auth.isLoading}
            className="py-4"
          >
            <Text className="text-zinc-500 text-center text-base">
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}