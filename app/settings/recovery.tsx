import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { AuthService } from '../../utils/authService';
import { StarknetAccountService } from '../../utils/starknetAccountService';

export default function RecoveryPhraseScreen() {
  const router = useRouter();
  const starknetService = StarknetAccountService.getInstance();
  const authService = AuthService.getInstance();

  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    authenticateUser();
  }, []);

  const authenticateUser = async () => {
    // Check if biometric is available
    const biometric = await authService.isBiometricAvailable();
    
    if (biometric.available) {
      const authenticated = await authService.authenticateWithBiometric();
      if (authenticated) {
        setIsAuthenticated(true);
        loadMnemonic();
      } else {
        Alert.alert('Authentication Failed', 'Please try again', [
          { text: 'Cancel', onPress: () => router.back() },
          { text: 'Retry', onPress: authenticateUser },
        ]);
      }
    } else {
      // No biometric, require password (not implemented in this demo)
      setIsAuthenticated(true);
      loadMnemonic();
    }
  };

  const loadMnemonic = async () => {
    const phrase = await starknetService.getMnemonic();
    setMnemonic(phrase);
  };

  const handleReveal = () => {
    Alert.alert(
      'Security Warning',
      'Never share your recovery phrase with anyone. Anyone with this phrase can access your funds.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'I Understand', onPress: () => setIsRevealed(true) },
      ]
    );
  };

  const handleCopy = async () => {
    if (mnemonic) {
      await Clipboard.setStringAsync(mnemonic);
      Alert.alert('Copied', 'Recovery phrase copied to clipboard');
    }
  };

  const mnemonicWords = mnemonic?.split(' ') || [];

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
            Recovery Phrase
          </Text>
          <Text className="text-zinc-400 text-base">
            Your key to account recovery
          </Text>
        </View>

        {/* Warning */}
        <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <View className="flex-row items-start">
            <Text className="text-2xl mr-3">⚠️</Text>
            <View className="flex-1">
              <Text className="text-red-400 text-sm font-semibold mb-2">
                Critical Security Information
              </Text>
              <Text className="text-red-400/80 text-xs mb-1">
                • Never share this phrase with anyone
              </Text>
              <Text className="text-red-400/80 text-xs mb-1">
                • Store it in a secure location offline
              </Text>
              <Text className="text-red-400/80 text-xs">
                • Anyone with this phrase can access your funds
              </Text>
            </View>
          </View>
        </View>

        {!isRevealed ? (
          /* Reveal Button */
          <View className="items-center py-12">
            <View className="bg-zinc-900 rounded-full p-8 mb-6">
              <Text className="text-6xl">🔒</Text>
            </View>
            <Text className="text-white text-lg font-semibold mb-2">
              Recovery Phrase Hidden
            </Text>
            <Text className="text-zinc-400 text-sm text-center mb-8 px-4">
              Tap below to reveal your 12-word recovery phrase
            </Text>
            <TouchableOpacity
              onPress={handleReveal}
              className="bg-[#F7931A] rounded-xl py-4 px-8"
            >
              <Text className="text-black text-base font-bold">
                Reveal Recovery Phrase
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Recovery Phrase Display */
          <>
            <View className="bg-zinc-900 rounded-xl p-6 mb-6">
              <View className="flex-row flex-wrap">
                {mnemonicWords.map((word, index) => (
                  <View
                    key={index}
                    className="w-1/3 p-2"
                  >
                    <View className="bg-zinc-800 rounded-lg p-3">
                      <Text className="text-zinc-500 text-xs mb-1">
                        {index + 1}
                      </Text>
                      <Text className="text-white text-base font-medium">
                        {word}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Copy Button */}
            <TouchableOpacity
              onPress={handleCopy}
              className="bg-zinc-900 rounded-xl py-4 mb-4 border border-zinc-800"
            >
              <Text className="text-white text-center text-base font-semibold">
                📋 Copy to Clipboard
              </Text>
            </TouchableOpacity>

            {/* Instructions */}
            <View className="bg-zinc-900 rounded-xl p-4">
              <Text className="text-white text-sm font-semibold mb-3">
                How to use your recovery phrase:
              </Text>
              <Text className="text-zinc-400 text-xs mb-2">
                1. Write down these 12 words in order
              </Text>
              <Text className="text-zinc-400 text-xs mb-2">
                2. Store them in a secure, offline location
              </Text>
              <Text className="text-zinc-400 text-xs mb-2">
                3. Never take a screenshot or save digitally
              </Text>
              <Text className="text-zinc-400 text-xs">
                4. Use this phrase to recover your account on any device
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}