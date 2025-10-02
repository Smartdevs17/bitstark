import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { AmountInput } from '../../components/AmountInput';
import { DepositButton } from '../../components/DepositButton';
import { useDeposit } from '../../hooks/useDeposit';
import { useWallet } from '../../hooks/useWallet';

export default function DepositScreen() {
  const router = useRouter();
  const wallet = useWallet();
  const deposit = useDeposit();

  const handleDeposit = async () => {
    const success = await deposit.executeDeposit();
    
    if (success) {
      Alert.alert(
        'Deposit Successful',
        'Your BTC is now earning yield on Starknet!',
        [
          {
            text: 'View Portfolio',
            onPress: () => router.push('/(tabs)/home' as any),
          },
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        className="flex-1"
        contentContainerClassName="p-6"
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-white text-3xl font-bold mb-2">
            Deposit BTC
          </Text>
          <Text className="text-zinc-400 text-base font-medium">
            Start earning {deposit.isLoading ? '...' : '8.5%'} APY on Starknet
          </Text>
        </View>

        {/* Available Balance */}
        <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
          <Text className="text-zinc-400 text-sm mb-1 font-medium">
            Available Balance
          </Text>
          <View className="flex-row items-baseline">
            <Text className="text-white text-2xl font-bold">
              {wallet.btcBalance.toFixed(8)}
            </Text>
            <Text className="text-zinc-400 text-base font-semibold ml-2">
              BTC
            </Text>
          </View>
          <Text className="text-zinc-500 text-sm mt-1">
            ≈ ${wallet.usdValue.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </Text>
        </View>

        {/* Amount Input */}
        <AmountInput
          value={deposit.amount}
          onChangeText={deposit.setAmount}
          usdValue={deposit.usdValue}
          maxValue={wallet.btcBalance}
          error={deposit.error}
        />

        {/* Bridge Info */}
        <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
          <Text className="text-zinc-400 text-sm mb-3 font-medium">
            Transaction Details
          </Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-zinc-500 text-sm">Bridge Fee</Text>
            <Text className="text-white text-sm font-medium">
              ~0.0001 BTC
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-zinc-500 text-sm">Network</Text>
            <Text className="text-white text-sm font-medium">
              Starknet
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-zinc-500 text-sm">Time to Deposit</Text>
            <Text className="text-white text-sm font-medium">
              ~2-5 minutes
            </Text>
          </View>
        </View>

        {/* Yield Strategy Info */}
        <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
          <Text className="text-emerald-400 text-sm font-semibold mb-2">
            ⚡ Powered by Vesu & Troves
          </Text>
          <Text className="text-zinc-400 text-sm">
            Your BTC will be allocated to battle-tested yield strategies on Starknet. 
            Withdraw anytime with no lock-up period.
          </Text>
        </View>

        {/* Deposit Button */}
        <DepositButton
          onPress={handleDeposit}
          isLoading={deposit.isLoading}
          disabled={!deposit.amount || parseFloat(deposit.amount) <= 0}
          title={deposit.isLoading ? 'Processing...' : 'Confirm Deposit'}
        />

        {/* Success State */}
        {deposit.txHash && (
          <View className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <Text className="text-emerald-400 text-sm font-medium mb-1">
              Deposit Successful!
            </Text>
            <Text className="text-zinc-400 text-xs font-mono">
              {deposit.txHash}
            </Text>
          </View>
        )}

        {/* Info Footer */}
        <View className="mt-6 items-center">
          <Text className="text-zinc-600 text-xs text-center">
            By depositing, you agree to BitStark's terms.{'\n'}
            Your funds are secured by Starknet's cryptography.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}