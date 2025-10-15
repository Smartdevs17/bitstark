import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';
import '../global.css'; // NativeWind styles

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="deposit/index"
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </Stack>
      <Toast config={toastConfig} />
    </>
  );
}