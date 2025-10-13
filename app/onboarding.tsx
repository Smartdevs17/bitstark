import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "Earn Yield on Your BTC",
      subtitle: "With One Tap",
      description: "Bridge your Bitcoin to Starknet and automatically earn yield in the best DeFi protocols.",
      icon: "⚡",
      gradient: ['#1E3A8A', '#1E40AF', '#2563EB'] as const,
    },
    {
      id: 2,
      title: "Secure & Fast",
      subtitle: "Built on Starknet",
      description: "Leverage Starknet's zero-knowledge technology for secure, fast, and cheap transactions.",
      icon: "🔒",
      gradient: ['#064E3B', '#065F46', '#047857'] as const,
    },
    {
      id: 3,
      title: "Auto-Compound",
      subtitle: "Your Earnings",
      description: "Your yield automatically compounds in Vesu and Troves vaults for maximum returns.",
      icon: "📈",
      gradient: ['#7C2D12', '#EA580C', '#F97316'] as const,
    },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Go to auth screen
      router.push('/auth');
    }
  };

  const skipToAuth = () => {
    router.push('/auth');
  };

  const currentSlideData = slides[currentSlide];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-4">
          <View className="flex-row items-center">
            <Text className="text-white text-2xl font-black">BitStark</Text>
            <View className="bg-orange-500/20 px-2 py-1 rounded-full ml-2">
              <Text className="text-orange-400 text-xs font-bold">BETA</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={skipToAuth}>
            <Text className="text-zinc-400 text-sm font-medium">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View className="flex-1 justify-center px-6">
          {/* Slide Content */}
          <View className="items-center mb-12">
            {/* Icon */}
            <View className="mb-8">
              <LinearGradient
                colors={currentSlideData.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-32 h-32 rounded-full items-center justify-center"
              >
                <Text className="text-6xl">{currentSlideData.icon}</Text>
              </LinearGradient>
            </View>

            {/* Title */}
            <Text className="text-white text-4xl font-black text-center mb-2">
              {currentSlideData.title}
            </Text>
            
            {/* Subtitle */}
            <Text className="text-zinc-300 text-xl font-bold text-center mb-6">
              {currentSlideData.subtitle}
            </Text>
            
            {/* Description */}
            <Text className="text-zinc-400 text-lg text-center leading-7 px-4">
              {currentSlideData.description}
            </Text>
          </View>

          {/* Progress Indicators */}
          <View className="flex-row justify-center items-center mb-12">
            {slides.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index === currentSlide ? 'bg-white' : 'bg-zinc-600'
                }`}
              />
            ))}
          </View>
        </View>

        {/* Bottom Actions */}
        <View className="px-6 pb-8">
          {/* Primary Button */}
          <TouchableOpacity
            onPress={nextSlide}
            className="mb-4"
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={currentSlideData.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-3xl py-5 px-8 items-center"
            >
              <Text className="text-white text-xl font-black">
                {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Button */}
          {currentSlide === slides.length - 1 && (
            <TouchableOpacity
              onPress={skipToAuth}
              className="border border-zinc-700 rounded-3xl py-4 px-8 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-zinc-400 text-lg font-semibold">
                I already have an account
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



