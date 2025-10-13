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

export default function AuthScreen() {
  const router = useRouter();
  const auth = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        auth.clearError();
        return;
      }
      const success = await auth.signUp(email, password);
      if (success) {
        // Add a small delay to ensure auth state is updated
        setTimeout(() => {
          // Prompt for biometric setup if available
          if (auth.biometricAvailable) {
            router.push('/auth/setup-biometric' as any);
          } else {
            router.replace('/(tabs)/home');
          }
        }, 100);
      }
    } else {
      const success = await auth.signIn(email, password);
      if (success) {
        // Add a small delay to ensure auth state is updated
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 100);
      }
    }
  };

  const handleBiometricSignIn = async () => {
    const success = await auth.signInWithBiometric();
    if (success) {
      router.replace('/(tabs)/home');
    }
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
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-12 mt-8">
            <Text className="text-white text-4xl font-bold mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </Text>
            <Text className="text-zinc-400 text-base">
              {mode === 'signin' 
                ? 'Sign in to start earning Bitcoin yield' 
                : 'Start earning Bitcoin yield on Starknet'}
            </Text>
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2 font-medium">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#71717a"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-zinc-900 text-white rounded-xl px-4 py-4 text-base"
            />
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2 font-medium">
              Password
            </Text>
            <View className="relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#71717a"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="bg-zinc-900 text-white rounded-xl px-4 py-4 text-base pr-12"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
              >
                <Text className="text-zinc-500 text-sm">
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password (Sign Up only) */}
          {mode === 'signup' && (
            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-2 font-medium">
                Confirm Password
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#71717a"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="bg-zinc-900 text-white rounded-xl px-4 py-4 text-base"
              />
              {password && confirmPassword && password !== confirmPassword && (
                <Text className="text-red-400 text-sm mt-2">
                  Passwords do not match
                </Text>
              )}
            </View>
          )}

          {/* Error Message */}
          {auth.error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <Text className="text-red-400 text-sm">
                {auth.error}
              </Text>
            </View>
          )}

          {/* Password Requirements (Sign Up only) */}
          {mode === 'signup' && (
            <View className="bg-zinc-900 rounded-xl p-4 mb-6">
              <Text className="text-zinc-400 text-sm mb-2">
                Password must contain:
              </Text>
              <Text className="text-zinc-500 text-xs">
                • At least 8 characters
              </Text>
              <Text className="text-zinc-500 text-xs">
                • One uppercase letter
              </Text>
              <Text className="text-zinc-500 text-xs">
                • One number
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleAuth}
            disabled={
              auth.isLoading ||
              !email ||
              !password ||
              (mode === 'signup' && password !== confirmPassword)
            }
            className={`bg-[#F7931A] rounded-xl py-4 mb-4 ${
              auth.isLoading ||
              !email ||
              !password ||
              (mode === 'signup' && password !== confirmPassword)
                ? 'opacity-50'
                : ''
            }`}
          >
            <Text className="text-black text-center text-base font-bold">
              {auth.isLoading
                ? 'Loading...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Biometric Sign In (if available and enabled) */}
          {mode === 'signin' && auth.biometricEnabled && auth.biometricAvailable && (
            <TouchableOpacity
              onPress={handleBiometricSignIn}
              className="bg-zinc-900 rounded-xl py-4 mb-6 border border-zinc-800"
            >
              <Text className="text-white text-center text-base font-semibold">
                {auth.biometricType === 'faceId'
                  ? '🔒 Sign in with Face ID'
                  : '👆 Sign in with Touch ID'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Toggle Mode */}
          <View className="flex-row items-center justify-center mb-4">
            <Text className="text-zinc-500 text-sm">
              {mode === 'signin'
                ? "Don't have an account? "
                : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              <Text className="text-[#F7931A] text-sm font-semibold">
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>


          {/* Import Account Link */}
          {mode === 'signup' && (
            <TouchableOpacity
              onPress={() => router.push('/auth/import' as any)}
              className="mt-6"
            >
              <Text className="text-zinc-500 text-sm text-center">
                Have an existing Starknet account?{' '}
                <Text className="text-[#F7931A] font-semibold">Import it</Text>
              </Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}