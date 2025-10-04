import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { AmountInput } from '../../components/AmountInput';
import { DepositButton } from '../../components/DepositButton';
import { showErrorToast, showTransactionToast } from '../../components/ToastConfig';
import { useDeposit } from '../../hooks/useDeposit';
import { useWallet } from '../../hooks/useWallet';
import { getExplorerUrl } from '../../utils/config';

export default function DepositScreen() {
  const router = useRouter();
  const wallet = useWallet();
  const deposit = useDeposit(); // TODO: Pass Starknet address
  const [showDetails, setShowDetails] = useState(false);

  const handleDeposit = async () => {
    const success = await deposit.executeDeposit();
    
    if (success && deposit.transaction) {
      // Show success notification with explorer link
      showTransactionToast(
        'Deposit Initiated!',
        `Bridging ${deposit.amount} BTC to Starknet`,
        deposit.transaction.txHash,
        (txHash) => {
          const url = getExplorerUrl('bitcoin', deposit.transaction!.btcTxHash!);
          Linking.openURL(url);
        }
      );

      // Refresh wallet balance
      await wallet.refreshBalance();

      // Navigate to portfolio after 2 seconds
      setTimeout(() => {
        router.push('/(tabs)/portfolio');
      }, 2000);
    } else if (deposit.error) {
      showErrorToast('Deposit Failed', deposit.error);
    }
  };

  const openExplorer = (txHash: string) => {
    const url = getExplorerUrl('starknet', txHash);
    Linking.openURL(url);
  };

  const getStepDescription = () => {
    switch (deposit.step) {
      case 'confirming':
        return 'Getting bridge quote...';
      case 'signing':
        return 'Please sign the transaction in Xverse';
      case 'bridging':
        return 'Bridging BTC to Starknet...';
      case 'completed':
        return 'Deposit successful!';
      default:
        return '';
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
            Start earning yield on Starknet
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

        {/* Transaction Details */}
        <View className="bg-zinc-900 rounded-2xl p-6 mb-4">
          <Text className="text-zinc-400 text-sm mb-3 font-medium">
            Transaction Details
          </Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-zinc-500 text-sm">Bridge Fee</Text>
            <Text className="text-white text-sm font-medium">
              {deposit.estimatedFee > 0 
                ? `~${deposit.estimatedFee.toFixed(8)} BTC` 
                : 'Calculating...'}
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-zinc-500 text-sm">Network</Text>
            <Text className="text-white text-sm font-medium">
              Bitcoin → Starknet
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-zinc-500 text-sm">Est. Time</Text>
            <Text className="text-white text-sm font-medium">
              ~{Math.floor(deposit.estimatedTime / 60)} minutes
            </Text>
          </View>

          {deposit.amount && parseFloat(deposit.amount) > 0 && (
            <>
              <View className="border-t border-zinc-800 my-3" />
              <View className="flex-row justify-between">
                <Text className="text-zinc-400 text-sm font-semibold">You'll Receive</Text>
                <Text className="text-emerald-400 text-sm font-bold">
                  ~{(parseFloat(deposit.amount) - deposit.estimatedFee).toFixed(8)} BTC
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Yield Strategy Info */}
        <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
          <Text className="text-emerald-400 text-sm font-semibold mb-2">
            ⚡ Powered by Atomiq Bridge
          </Text>
          <Text className="text-zinc-400 text-sm leading-5">
            Your BTC will be bridged to Starknet and automatically allocated to 
            battle-tested yield strategies. Withdraw anytime with no lock-up period.
          </Text>
        </View>

        {/* Progress Indicator */}
        {deposit.isLoading && deposit.step !== 'input' && (
          <View className="bg-[#F7931A]/10 border border-[#F7931A]/20 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center mb-2">
              <View className="w-2 h-2 bg-[#F7931A] rounded-full mr-2 animate-pulse" />
              <Text className="text-[#F7931A] text-sm font-semibold">
                {getStepDescription()}
              </Text>
            </View>
            
            <View className="flex-row space-x-2 mt-3">
              {['confirming', 'signing', 'bridging', 'completed'].map((step, index) => (
                <View
                  key={step}
                  className={`flex-1 h-1 rounded-full ${
                    ['confirming', 'signing', 'bridging', 'completed'].indexOf(deposit.step) >= index
                      ? 'bg-[#F7931A]'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </View>
          </View>
        )}

        {/* Deposit Button */}
        <DepositButton
          onPress={handleDeposit}
          isLoading={deposit.isLoading}
          disabled={
            !deposit.amount || 
            parseFloat(deposit.amount) <= 0 ||
            !!deposit.error ||
            wallet.btcBalance === 0
          }
          title={
            deposit.isLoading 
              ? getStepDescription()
              : deposit.step === 'completed'
              ? 'Completed ✓'
              : 'Confirm Deposit'
          }
        />

        {/* Success State */}
        {deposit.transaction && deposit.step === 'completed' && (
          <View className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <Text className="text-emerald-400 text-sm font-medium mb-2">
              Deposit Successful!
            </Text>
            <Text className="text-zinc-400 text-xs mb-2">
              Transaction Hash:
            </Text>
            <Text 
              className="text-[#F7931A] text-xs font-mono"
              onPress={() => openExplorer(deposit.transaction!.txHash)}
            >
              {deposit.transaction.txHash}
            </Text>
          </View>
        )}

        {/* Info Footer */}
        <View className="mt-6 items-center">
          <Text className="text-zinc-600 text-xs text-center leading-5">
            By depositing, you agree to BitStark's terms.{'\n'}
            Your funds are secured by Starknet's cryptography.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}