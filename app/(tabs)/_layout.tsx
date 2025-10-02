import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#27272a',
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#F7931A',
        tabBarInactiveTintColor: '#71717a',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size }}>
              <HomeIcon color={color} size={size} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: size, height: size }}>
              <PortfolioIcon color={color} size={size} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

// Simple icon components (will be replaced with proper icons later)
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <View 
    style={{ 
      width: size, 
      height: size, 
      backgroundColor: color,
      borderRadius: size / 4,
    }} 
  />
);

const PortfolioIcon = ({ color, size }: { color: string; size: number }) => (
  <View 
    style={{ 
      width: size, 
      height: size, 
      backgroundColor: color,
      borderRadius: size / 2,
    }} 
  />
);