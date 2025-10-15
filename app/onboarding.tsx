import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
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

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const skipToAuth = () => {
    router.push('/auth');
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlide(viewableItems[0].index);
    }
  };

  const renderSlide = ({ item, index }: { item: any; index: number }) => (
    <View style={{ width }} className="flex-1 justify-center px-6">
      {/* Slide Content */}
      <View className="items-center mb-12">
        {/* Icon */}
        <View className="mb-8">
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-32 h-32 rounded-full items-center justify-center"
          >
            <Text className="text-6xl">{item.icon}</Text>
          </LinearGradient>
        </View>

        {/* Title */}
        <Text className="text-white text-4xl font-black text-center mb-2">
          {item.title}
        </Text>
        
        {/* Subtitle */}
        <Text className="text-zinc-300 text-xl font-bold text-center mb-6">
          {item.subtitle}
        </Text>
        
        {/* Description */}
        <Text className="text-zinc-400 text-lg text-center leading-7 px-4">
          {item.description}
        </Text>
      </View>
    </View>
  );

  const currentSlideData = slides[currentSlide];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" hidden={false} />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-8 pb-4">
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

      {/* Main Content - Horizontal Scrollable Slides */}
      <View className="flex-1">
        <FlatList
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </View>

      {/* Progress Indicators */}
      <View className="flex-row justify-center items-center mb-8">
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full mx-1 ${
              index === currentSlide ? 'bg-white' : 'bg-zinc-600'
            }`}
          />
        ))}
      </View>

      {/* Bottom Actions */}
      <View className={`px-6 ${currentSlide === slides.length - 1 ? 'pb-20' : 'pb-8'}`}>
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
    </SafeAreaView>
  );
}



