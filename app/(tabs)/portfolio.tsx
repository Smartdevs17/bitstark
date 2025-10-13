import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { DepositButton } from '../../components/DepositButton';
import { useAuth } from '../../hooks/useAuth';
import MockBalanceManager from '../../utils/mockBalanceManager';

export default function PortfolioScreen() {
  const router = useRouter();
  const auth = useAuth();
  const balanceManager = MockBalanceManager.getInstance();
  
  // Use MockBalanceManager for real-time balance tracking
  const [balanceState, setBalanceState] = useState({
    walletBalance: 0,
    portfolioBalance: 0,
    totalBalance: 0,
    depositedAmount: 0,
    earnedAmount: 0,
  });
  const [positions, setPositions] = useState(balanceManager.getPortfolioPositions());

  // Listen for balance changes
  useEffect(() => {
    // Initialize balance state
    const initializeBalance = async () => {
      const balance = await balanceManager.getBalanceState();
      setBalanceState(balance);
    };
    
    initializeBalance();

    const handleBalanceChange = (newState: any) => {
      setBalanceState(newState);
      setPositions(balanceManager.getPortfolioPositions());
    };

    balanceManager.addListener(handleBalanceChange);

    return () => {
      balanceManager.removeListener(handleBalanceChange);
    };
  }, []);

  const totalValue = balanceState.portfolioBalance;
  const totalValueUsd = totalValue * 95000;

  const handleWithdraw = () => {
    if (balanceState.portfolioBalance <= 0) {
      Alert.alert('No Funds', 'You have no funds to withdraw from your portfolio.');
      return;
    }

    Alert.alert(
      'Withdraw Funds',
      `You have ${balanceState.portfolioBalance.toFixed(6)} BTC available to withdraw.\n\nHow much would you like to withdraw?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Withdraw All',
          onPress: () => withdrawAmount(balanceState.portfolioBalance),
        },
        {
          text: 'Custom Amount',
          onPress: () => {
            // For now, just withdraw 50% as a demo
            const halfAmount = balanceState.portfolioBalance * 0.5;
            withdrawAmount(halfAmount);
          },
        },
      ]
    );
  };

  const withdrawAmount = async (amount: number) => {
    try {
      const success = await balanceManager.withdrawFromPortfolio(amount);
      
      if (success) {
        Alert.alert(
          'Withdrawal Successful!',
          `${amount.toFixed(6)} BTC has been moved back to your wallet.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Withdrawal Failed', 'Unable to withdraw the specified amount.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during withdrawal.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-white text-4xl font-black mb-2">
            Portfolio
          </Text>
          <Text className="text-zinc-400 text-lg font-medium">
            Your yield farming positions
          </Text>
        </View>

        {/* Total Value Card */}
        <View className="relative mb-6">
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-6 border border-blue-500/30"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-blue-200 text-sm mb-2 font-medium">
                  Total Portfolio Value
          </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-4xl font-black">
                    {totalValue.toFixed(8)}
            </Text>
                  <Text className="text-blue-300 text-xl font-bold ml-3">
              BTC
            </Text>
          </View>
              </View>
              
              <View className="bg-blue-500/20 p-3 rounded-2xl">
                <Text className="text-blue-300 text-2xl">
                  💎
                </Text>
              </View>
            </View>
            
            <View className="bg-black/20 rounded-2xl p-4 border border-blue-500/20">
              <Text className="text-blue-200 text-sm mb-1 font-medium">
                USD Value
              </Text>
              <Text className="text-white text-2xl font-black">
                ${totalValueUsd.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>
          </LinearGradient>
          
          {/* Floating Elements */}
          <View className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full opacity-60" />
          <View className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-300 rounded-full opacity-40" />
        </View>


        {/* Yield Positions */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-bold">
              🏦 Active Positions
            </Text>
            <Text className="text-zinc-400 text-sm">
              {positions.length} position{positions.length !== 1 ? 's' : ''}
          </Text>
          </View>

          {positions.length > 0 ? (
            positions.map((position, index) => (
              <View key={position.id} className="mb-4">
                <LinearGradient
                  colors={['#374151', '#4B5563']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-2xl p-5 border border-zinc-600"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold">
                        Position #{index + 1}
                      </Text>
                      <Text className="text-zinc-400 text-sm">
                        {new Date(position.startTime).toLocaleDateString()}
              </Text>
            </View>
                    
                    <View className="bg-emerald-500/20 px-3 py-1 rounded-full">
                      <Text className="text-emerald-400 text-xs font-bold">
                        {position.status.toUpperCase()}
              </Text>
            </View>
          </View>

                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-zinc-400 text-xs mb-1">Amount</Text>
                      <Text className="text-white text-lg font-bold">
                        {position.amount.toFixed(6)} BTC
                      </Text>
                    </View>
                    
                    <View className="items-end">
                      <Text className="text-zinc-400 text-xs mb-1">APY</Text>
                      <Text className="text-emerald-400 text-lg font-bold">
                        {position.apy.toFixed(2)}%
                      </Text>
                    </View>
                    
                    <View className="items-end">
                      <Text className="text-zinc-400 text-xs mb-1">Earned</Text>
                      <Text className="text-green-400 text-lg font-bold">
                        +{position.earned.toFixed(6)}
              </Text>
            </View>
          </View>
                </LinearGradient>
        </View>
            ))
          ) : (
            <View className="bg-zinc-900 rounded-2xl p-8 items-center">
              <Text className="text-zinc-500 text-sm mb-2">
                No active positions
          </Text>
              <Text className="text-zinc-600 text-xs text-center">
                Start earning yield by depositing BTC
            </Text>
          </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <DepositButton
              title="Deposit More"
              onPress={() => router.push('/deposit')}
            />
          </View>
          <View className="flex-1">
            <TouchableOpacity
              className="bg-gradient-to-r from-red-500 to-red-600 rounded-3xl py-5 px-8 items-center justify-center border border-red-400/30"
              activeOpacity={0.8}
              onPress={handleWithdraw}
            >
              <Text className="text-white text-xl font-black">
                Withdraw
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}