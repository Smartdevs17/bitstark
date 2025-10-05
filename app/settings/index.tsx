import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsScreen() {
  const router = useRouter();
  const auth = useAuth();

  const handleToggleBiometric = async () => {
    if (auth.biometricEnabled) {
      await auth.disableBiometric();
    } else {
      const success = await auth.enableBiometric();
      if (!success && auth.error) {
        Alert.alert('Error', auth.error);
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await auth.signOut();
            router.replace('/auth' as any);
          },
        },
      ]
    );
  };

  const handleViewRecovery = () => {
    router.push('/settings/recovery' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        {/* Header */}
        <View className="mb-8">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-[#F7931A] text-base">← Back</Text>
          </TouchableOpacity>
          
          <Text className="text-white text-3xl font-bold mb-2">
            Settings
          </Text>
          <Text className="text-zinc-400 text-base">
            Manage your account and preferences
          </Text>
        </View>

        {/* Account Section */}
        <View className="mb-6">
          <Text className="text-zinc-400 text-sm font-semibold mb-3 uppercase">
            Account
          </Text>

          <View className="bg-zinc-900 rounded-xl overflow-hidden">
            <View className="p-4 border-b border-zinc-800">
              <Text className="text-zinc-400 text-xs mb-1">Email</Text>
              <Text className="text-white text-base">{auth.email}</Text>
            </View>

            <View className="p-4 border-b border-zinc-800">
              <Text className="text-zinc-400 text-xs mb-1">Starknet Address</Text>
              <Text className="text-white text-sm font-mono">
                {auth.starknetAddress?.slice(0, 10)}...{auth.starknetAddress?.slice(-8)}
              </Text>
            </View>

            {auth.bitcoinAddress && (
              <View className="p-4">
                <Text className="text-zinc-400 text-xs mb-1">Bitcoin Address</Text>
                <Text className="text-white text-sm font-mono">
                  {auth.bitcoinAddress?.slice(0, 12)}...{auth.bitcoinAddress?.slice(-12)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Security Section */}
        <View className="mb-6">
          <Text className="text-zinc-400 text-sm font-semibold mb-3 uppercase">
            Security
          </Text>

          <View className="bg-zinc-900 rounded-xl overflow-hidden">
            {auth.biometricAvailable && (
              <View className="p-4 flex-row items-center justify-between border-b border-zinc-800">
                <View className="flex-1">
                  <Text className="text-white text-base font-medium mb-1">
                    {auth.biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}
                  </Text>
                  <Text className="text-zinc-400 text-sm">
                    Quick and secure authentication
                  </Text>
                </View>
                <Switch
                  value={auth.biometricEnabled}
                  onValueChange={handleToggleBiometric}
                  trackColor={{ false: '#3f3f46', true: '#F7931A' }}
                  thumbColor="#ffffff"
                />
              </View>
            )}

            <TouchableOpacity
              onPress={handleViewRecovery}
              className="p-4 flex-row items-center justify-between"
            >
              <View className="flex-1">
                <Text className="text-white text-base font-medium mb-1">
                  Recovery Phrase
                </Text>
                <Text className="text-zinc-400 text-sm">
                  View and backup your recovery phrase
                </Text>
              </View>
              <Text className="text-zinc-500 text-lg">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View className="mb-8">
          <Text className="text-zinc-400 text-sm font-semibold mb-3 uppercase">
            About
          </Text>

          <View className="bg-zinc-900 rounded-xl overflow-hidden">
            <View className="p-4 flex-row items-center justify-between border-b border-zinc-800">
              <Text className="text-white text-base">Version</Text>
              <Text className="text-zinc-400 text-base">1.0.0</Text>
            </View>

            <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-zinc-800">
              <Text className="text-white text-base">Terms of Service</Text>
              <Text className="text-zinc-500 text-lg">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="p-4 flex-row items-center justify-between">
              <Text className="text-white text-base">Privacy Policy</Text>
              <Text className="text-zinc-500 text-lg">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500/10 border border-red-500/20 rounded-xl py-4 mb-4"
        >
          <Text className="text-red-400 text-center text-base font-semibold">
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text className="text-zinc-600 text-xs text-center">
          Made with ❤️ for Bitcoiners
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}