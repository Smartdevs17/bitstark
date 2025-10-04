export const CONFIG = {
    // Network
    network: process.env.EXPO_PUBLIC_NETWORK || 'mainnet',
    starknetRpcUrl: process.env.EXPO_PUBLIC_STARKNET_RPC_URL || '',
    starknetChainId: process.env.EXPO_PUBLIC_STARKNET_CHAIN_ID || 'SN_MAIN',
    
    // APIs
    atomiqApiUrl: process.env.EXPO_PUBLIC_ATOMIQ_API_URL || '',
    atomiqApiKey: process.env.EXPO_PUBLIC_ATOMIQ_API_KEY || '',
    priceApiUrl: process.env.EXPO_PUBLIC_PRICE_API_URL || '',
    
    // App
    appName: process.env.EXPO_PUBLIC_APP_NAME || 'BitStark',
    appScheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'bitstark',
    
    // Limits
    minDepositBtc: parseFloat(process.env.EXPO_PUBLIC_MIN_DEPOSIT_BTC || '0.0001'),
    maxDepositBtc: parseFloat(process.env.EXPO_PUBLIC_MAX_DEPOSIT_BTC || '10'),
    
    // Feature Flags
    enableTestnet: process.env.EXPO_PUBLIC_ENABLE_TESTNET === 'true',
  } as const;
  
  export const EXPLORER_URLS = {
    starknet: {
      mainnet: 'https://starkscan.co',
      testnet: 'https://testnet.starkscan.co',
    },
    bitcoin: {
      mainnet: 'https://mempool.space',
      testnet: 'https://mempool.space/testnet',
    },
  } as const;
  
  export const getExplorerUrl = (network: 'starknet' | 'bitcoin', txHash: string) => {
    const baseUrl = CONFIG.network === 'mainnet' 
      ? EXPLORER_URLS[network].mainnet 
      : EXPLORER_URLS[network].testnet;
    return `${baseUrl}/tx/${txHash}`;
  };