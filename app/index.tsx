import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function IndexScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure the component is mounted and ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100); // Small delay to ensure Root Layout is mounted

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Wait for both auth check and component readiness
    if (isReady && !auth.isLoading) {
      if (auth.isAuthenticated) {
        // User is already authenticated, go to home
        router.replace('/(tabs)/home');
      } else {
        // User is not authenticated, show onboarding
        router.replace('/onboarding');
      }
    }
  }, [isReady, auth.isLoading, auth.isAuthenticated, router]);

  // Show loading screen while checking auth
  return (
    <SafeAreaView className="flex-1 bg-black items-center justify-center">
      <StatusBar barStyle="light-content" />
      
      <View className="items-center">
        <Text className="text-white text-3xl font-black mb-2">BitStark</Text>
        <Text className="text-zinc-400 text-lg font-medium mb-8">
          Earn yield on your BTC with one tap
        </Text>
        
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
          <View className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
          <View className="w-2 h-2 bg-orange-500 rounded-full" />
        </View>
      </View>
    </SafeAreaView>
  );
}


