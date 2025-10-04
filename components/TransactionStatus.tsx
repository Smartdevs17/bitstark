import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from 'react-native';
import { BridgeTransaction } from '../utils/atomiqService';
import { getExplorerUrl } from '../utils/config';

interface TransactionStatusProps {
  transaction: BridgeTransaction;
  onStatusUpdate?: (status: BridgeTransaction['status']) => void;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  transaction,
  onStatusUpdate,
}) => {
  const [currentStatus, setCurrentStatus] = useState(transaction.status);

  useEffect(() => {
    setCurrentStatus(transaction.status);
    onStatusUpdate?.(transaction.status);
  }, [transaction.status]);

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'completed':
        return 'emerald';
      case 'failed':
        return 'red';
      case 'pending':
      case 'bridging':
        return 'yellow';
      default:
        return 'zinc';
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✕';
      case 'pending':
      case 'confirmed':
      case 'bridging':
        return '⟳';
      default:
        return '•';
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'pending':
        return 'Pending Confirmation';
      case 'confirmed':
        return 'Confirmed on Bitcoin';
      case 'bridging':
        return 'Bridging to Starknet';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const colorClass = getStatusColor();

  return (
    <View className="bg-zinc-900 rounded-2xl p-6">
      {/* Status Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 bg-${colorClass}-500/20 rounded-full items-center justify-center mr-3`}>
            <Text className={`text-${colorClass}-400 text-lg font-bold`}>
              {getStatusIcon()}
            </Text>
          </View>
          <View>
            <Text className="text-white text-base font-semibold">
              {getStatusText()}
            </Text>
            <Text className="text-zinc-500 text-xs">
              {new Date(transaction.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>

        {(currentStatus === 'pending' || currentStatus === 'bridging') && (
          <ActivityIndicator size="small" color="#F7931A" />
        )}
      </View>

      {/* Progress Steps */}
      <View className="space-y-3 mb-4">
        <StatusStep
          title="Bitcoin Transaction"
          completed={['confirmed', 'bridging', 'completed'].includes(currentStatus)}
          active={currentStatus === 'pending'}
          txHash={transaction.btcTxHash}
          network="bitcoin"
        />
        <StatusStep
          title="Bridge Processing"
          completed={currentStatus === 'completed'}
          active={currentStatus === 'bridging'}
        />
        <StatusStep
          title="Starknet Deposit"
          completed={currentStatus === 'completed'}
          active={false}
          txHash={transaction.starknetTxHash}
          network="starknet"
        />
      </View>

      {/* Transaction Details */}
      <View className="border-t border-zinc-800 pt-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-zinc-500 text-sm">Amount</Text>
          <Text className="text-white text-sm font-medium">
            {transaction.amount.toFixed(8)} BTC
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-zinc-500 text-sm">Fee</Text>
          <Text className="text-white text-sm font-medium">
            {transaction.fee.toFixed(8)} BTC
          </Text>
        </View>
      </View>
    </View>
  );
};

interface StatusStepProps {
  title: string;
  completed: boolean;
  active: boolean;
  txHash?: string;
  network?: 'bitcoin' | 'starknet';
}

const StatusStep: React.FC<StatusStepProps> = ({
  title,
  completed,
  active,
  txHash,
  network,
}) => {
  const handlePress = () => {
    if (txHash && network) {
      const url = getExplorerUrl(network, txHash);
      Linking.openURL(url);
    }
  };

  return (
    <View className="flex-row items-center">
      <View
        className={`w-6 h-6 rounded-full items-center justify-center ${
          completed
            ? 'bg-emerald-500'
            : active
            ? 'bg-[#F7931A]'
            : 'bg-zinc-800'
        }`}
      >
        {completed ? (
          <Text className="text-black text-xs font-bold">✓</Text>
        ) : active ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <View className="w-2 h-2 bg-zinc-600 rounded-full" />
        )}
      </View>

      <View className="ml-3 flex-1">
        <Text
          className={`text-sm font-medium ${
            completed || active ? 'text-white' : 'text-zinc-500'
          }`}
        >
          {title}
        </Text>
        {txHash && (
          <TouchableOpacity onPress={handlePress}>
            <Text className="text-[#F7931A] text-xs font-mono mt-1">
              View TX →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};