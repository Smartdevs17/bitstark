import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function ImportAccountScreen() {
  const router = useRouter();
  const auth = useAuth();

  const [importType, setImportType] = useState<'mnemonic' | 'privateKey'>('mnemonic');
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleImport = async () => {
    const success = await auth.importStarknetAccount(inputValue);
    if (success) {
      router.replace('/(tabs)/home');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-8">
            <TouchableOpacity onPress={handleBack} className="mb-4">
              <Text className="text-[#F7931A] text-base">← Back</Text>
            </TouchableOpacity>
            
            <Text className="text-white text-3xl font-bold mb-2">
              Import Account
            </Text>
            <Text className="text-zinc-400 text-base">
              Import your existing Starknet account
            </Text>
          </View>

          {/* Import Type Selector */}
          <View className="flex-row mb-6 bg-zinc-900 rounded-xl p-1">
            <TouchableOpacity
              onPress={() => setImportType('mnemonic')}
              className={`flex-1 py-3 rounded-lg ${
                importType === 'mnemonic' ? 'bg-[#F7931A]' : ''
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  importType === 'mnemonic' ? 'text-black' : 'text-zinc-400'
                }`}
              >
                Recovery Phrase
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setImportType('privateKey')}
              className={`flex-1 py-3 rounded-lg ${
                importType === 'privateKey' ? 'bg-[#F7931A]' : ''
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  importType === 'privateKey' ? 'text-black' : 'text-zinc-400'
                }`}
              >
                Private Key
              </Text>
            </TouchableOpacity>
          </View>

          {/* Warning */}
          <View className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">⚠️</Text>
              <View className="flex-1">
                <Text className="text-yellow-400 text-sm font-semibold mb-1">
                  Security Warning
                </Text>
                <Text className="text-yellow-400/80 text-xs">
                  Never share your recovery phrase or private key. BitStark will never ask for it outside this screen.
                </Text>
              </View>
            </View>
          </View>

          {/* Input Field */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm mb-2 font-medium">
              {importType === 'mnemonic' ? 'Recovery Phrase (12-24 words)' : 'Private Key'}
            </Text>
            
            <View className="relative">
              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={
                  importType === 'mnemonic'
                    ? 'word1 word2 word3 ...'
                    : '0x...'
                }
                placeholderTextColor="#71717a"
                secureTextEntry={!showInput}
                multiline={importType === 'mnemonic'}
                numberOfLines={importType === 'mnemonic' ? 4 : 1}
                autoCapitalize="none"
                autoCorrect={false}
                className={`bg-zinc-900 text-white rounded-xl px-4 py-4 text-base ${
                  importType === 'mnemonic' ? 'min-h-[120px]' : ''
                } pr-20`}
              />
              
              <TouchableOpacity
                onPress={() => setShowInput(!showInput)}
                className="absolute right-4 top-4"
              >
                <Text className="text-zinc-500 text-sm">
                  {showInput ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-zinc-500 text-xs mt-2">
              {importType === 'mnemonic'
                ? 'Enter your 12 or 24 word recovery phrase separated by spaces'
                : 'Enter your Starknet private key (starts with 0x)'}
            </Text>
          </View>

          {/* Error Message */}
          {auth.error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <Text className="text-red-400 text-sm">
                {auth.error}
              </Text>
            </View>
          )}

          {/* Info Box */}
          <View className="bg-zinc-900 rounded-xl p-4 mb-8">
            <Text className="text-white text-sm font-semibold mb-2">
              What happens next?
            </Text>
            <Text className="text-zinc-400 text-xs mb-2">
              • Your account will be securely stored on your device
            </Text>
            <Text className="text-zinc-400 text-xs mb-2">
              • We'll derive your Bitcoin address automatically
            </Text>
            <Text className="text-zinc-400 text-xs">
              • You can set up biometric authentication for quick access
            </Text>
          </View>

          {/* Import Button */}
          <TouchableOpacity
            onPress={handleImport}
            disabled={auth.isLoading || !inputValue.trim()}
            className={`bg-[#F7931A] rounded-xl py-4 mb-4 ${
              auth.isLoading || !inputValue.trim() ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-black text-center text-base font-bold">
              {auth.isLoading ? 'Importing...' : 'Import Account'}
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={handleBack}
            disabled={auth.isLoading}
            className="py-4"
          >
            <Text className="text-zinc-500 text-center text-base">
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}