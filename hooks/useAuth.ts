import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { AuthService } from '../utils/authService';
import { StarknetAccountService } from '../utils/starknetAccountService';

export interface AuthHookState {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  starknetAddress: string | null;
  bitcoinAddress: string | null;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  biometricType: 'faceId' | 'touchId' | 'fingerprint' | 'none';
  error: string | null;
}

// Global auth state - shared across all components
let globalAuthState: AuthHookState = {
  isAuthenticated: false,
  isLoading: false,
  email: null,
  starknetAddress: null,
  bitcoinAddress: null,
  biometricEnabled: true,
  biometricAvailable: true,
  biometricType: 'faceId' as const,
  error: null,
};

// Global listeners for state changes
const globalListeners: ((state: AuthHookState) => void)[] = [];

// Function to update global state and notify listeners
const updateGlobalAuthState = (newState: Partial<AuthHookState>) => {
  globalAuthState = { ...globalAuthState, ...newState };
  globalListeners.forEach(listener => listener(globalAuthState));
};

export const useAuth = () => {
  // Mock mode for instant loading - set to true to use mock data
  const MOCK_MODE = true;
  
  const [state, setState] = useState<AuthHookState>(globalAuthState);

  const authService = AuthService.getInstance();
  const starknetService = StarknetAccountService.getInstance();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Set up global state listener
  useEffect(() => {
    const listener = (newState: AuthHookState) => {
      setState(newState);
    };
    
    globalListeners.push(listener);
    
    return () => {
      const index = globalListeners.indexOf(listener);
      if (index > -1) {
        globalListeners.splice(index, 1);
      }
    };
  }, []);

  // Check if user has ever signed up before
  const checkFirstTimeUser = async (): Promise<boolean> => {
    try {
      const hasSignedUp = await AsyncStorage.getItem('user_has_signed_up');
      return hasSignedUp === null; // null means first time user
    } catch (error) {
      console.error('Failed to check first time user:', error);
      return true; // Default to first time user if error
    }
  };

  const checkAuthStatus = useCallback(async () => {
    if (isCheckingAuth) {
      console.log('⏭️ Auth check already in progress, skipping...');
      return;
    }
    
    setIsCheckingAuth(true);
    try {
      console.log('🔍 Checking auth status...');
      const authState = await authService.isAuthenticated();
      console.log('📊 Auth state:', authState);
      
      if (authState.isAuthenticated) {
        // Check if account setup is complete
        console.log('✅ User is authenticated, checking account setup...');
        const isSetupComplete = await starknetService.isAccountSetupComplete();
        console.log('🔧 Account setup complete:', isSetupComplete);
        
        if (!isSetupComplete) {
          // Account setup incomplete, clear data and sign out user
          console.log('❌ Account setup incomplete, clearing data...');
          await starknetService.clearIncompleteAccount();
          await authService.signOut();
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            error: 'Account setup incomplete. Please sign up again.',
          }));
          return;
        }

        console.log('🔑 Getting account data...');
        const account = await starknetService.getAccount();
        const btcAddress = await starknetService.getBitcoinAddress();
        console.log('💰 Account data:', { account, btcAddress });

        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          email: authState.email,
          starknetAddress: account?.address || null,
          bitcoinAddress: btcAddress,
          biometricEnabled: authState.biometricEnabled,
        }));
        console.log('✅ Auth state updated successfully');
      } else {
        console.log('❌ User not authenticated');
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Authentication check failed',
      }));
    } finally {
      setIsCheckingAuth(false);
    }
  }, [authService, starknetService]);

  const checkBiometricAvailability = useCallback(async () => {
    const biometric = await authService.isBiometricAvailable();
    setState(prev => ({
      ...prev,
      biometricAvailable: biometric.available,
      biometricType: biometric.type,
    }));
  }, []);

  // Check auth status on mount
  useEffect(() => {
    if (MOCK_MODE) {
      // In mock mode, check if this is a first-time user
      const checkFirstTime = async () => {
        const isFirstTime = await checkFirstTimeUser();
        
        if (isFirstTime) {
          // First time user - show onboarding
          updateGlobalAuthState({
            isAuthenticated: false,
            isLoading: false,
          });
        } else {
          // Returning user - auto sign in with mock data
          updateGlobalAuthState({
            isAuthenticated: true,
            isLoading: false,
            email: 'user@example.com',
            starknetAddress: '0x3112c1f22c3a6f0df112e7e9a5a0a0ab198d6efa45de29a4e61af292c0ba777',
            bitcoinAddress: 'bc1qqqrhdgppyvsa9s9jxg895tpma0pceutwfrcf8za0f',
          });
        }
      };
      
      checkFirstTime();
      return;
    }
    
    console.log('🚀 useAuth: Starting auth check...');
    checkAuthStatus();
    checkBiometricAvailability();
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ useAuth: Timeout reached, setting loading to false');
      setState(prev => {
        if (prev.isLoading && !prev.isAuthenticated) {
          return {
            ...prev,
            isLoading: false,
            error: 'Authentication timeout. Please try again.',
          };
        }
        return prev;
      });
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, []); // Empty dependency array to run only on mount

  const signUp = async (email: string, password: string): Promise<boolean> => {
    if (MOCK_MODE) {
      try {
        // Mark user as having signed up
        await AsyncStorage.setItem('user_has_signed_up', 'true');
        
        // Save user credentials for validation during sign in
        const userCredentials = {
          email,
          password, // In real app, this would be hashed
          signedUpAt: Date.now(),
        };
        
        await AsyncStorage.setItem('user_credentials', JSON.stringify(userCredentials));
      } catch (error) {
        console.error('Failed to save sign up status:', error);
        return false;
      }
      
      updateGlobalAuthState({
        isAuthenticated: true,
        isLoading: false,
        email,
        starknetAddress: '0x3112c1f22c3a6f0df112e7e9a5a0a0ab198d6efa45de29a4e61af292c0ba777',
        bitcoinAddress: 'bc1qqqrhdgppyvsa9s9jxg895tpma0pceutwfrcf8za0f',
      });
      
      return true;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Sign up user
      const result = await authService.signUp(email, password);
      
      if (!result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Sign up failed',
        }));
        return false;
      }

      // Clear any incomplete account data first
      await starknetService.clearIncompleteAccount();
      
      // Generate Starknet account
      const accountResult = await starknetService.generateAccount(email);
      
      if (!accountResult.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: accountResult.error || 'Failed to create account',
        }));
        return false;
      }

      // Check if account setup is complete
      const isSetupComplete = await starknetService.isAccountSetupComplete();
      if (!isSetupComplete) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Account setup incomplete. Please try signing up again.',
        }));
        return false;
      }

      // Get Bitcoin address
      const btcAddress = await starknetService.getBitcoinAddress();

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        email,
        starknetAddress: accountResult.address || null,
        bitcoinAddress: btcAddress,
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Sign up failed',
      }));
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    if (MOCK_MODE) {
      try {
        const savedCredentials = await AsyncStorage.getItem('user_credentials');
        
        if (!savedCredentials) {
          updateGlobalAuthState({
            isLoading: false,
            error: 'No account found. Please sign up first.',
          });
          return false;
        }
        
        const credentials = JSON.parse(savedCredentials);
        
        if (credentials.email !== email || credentials.password !== password) {
          updateGlobalAuthState({
            isLoading: false,
            error: 'Invalid email or password.',
          });
          return false;
        }
        
        // Credentials match - sign in successful
        updateGlobalAuthState({
          isAuthenticated: true,
          isLoading: false,
          email,
          starknetAddress: '0x3112c1f22c3a6f0df112e7e9a5a0a0ab198d6efa45de29a4e61af292c0ba777',
          bitcoinAddress: 'bc1qqqrhdgppyvsa9s9jxg895tpma0pceutwfrcf8za0f',
          biometricEnabled: true,
          error: null,
        });
        
        return true;
      } catch (error) {
        console.error('Sign in validation failed:', error);
        updateGlobalAuthState({
          isLoading: false,
          error: 'Sign in failed. Please try again.',
        });
        return false;
      }
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await authService.signIn(email, password);
      
      if (!result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Sign in failed',
        }));
        return false;
      }

      // Get account info
      const account = await starknetService.getAccount();
      const btcAddress = await starknetService.getBitcoinAddress();
      const authState = await authService.isAuthenticated();

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        email,
        starknetAddress: account?.address || null,
        bitcoinAddress: btcAddress,
        biometricEnabled: authState.biometricEnabled,
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Sign in failed',
      }));
      return false;
    }
  };

  const signInWithBiometric = async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await authService.signInWithBiometric();
      
      if (!result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Biometric authentication failed',
        }));
        return false;
      }

      // Get account info
      const account = await starknetService.getAccount();
      const btcAddress = await starknetService.getBitcoinAddress();
      const authState = await authService.isAuthenticated();

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        email: authState.email,
        starknetAddress: account?.address || null,
        bitcoinAddress: btcAddress,
        biometricEnabled: true,
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Biometric sign in failed',
      }));
      return false;
    }
  };

  const enableBiometric = async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await authService.enableBiometric();
      
      if (!result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to enable biometric',
        }));
        return false;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        biometricEnabled: true,
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to enable biometric',
      }));
      return false;
    }
  };

  const disableBiometric = async (): Promise<void> => {
    await authService.disableBiometric();
    setState(prev => ({ ...prev, biometricEnabled: false }));
  };

  const importStarknetAccount = async (privateKeyOrMnemonic: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await starknetService.importAccount(privateKeyOrMnemonic);
      
      if (!result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to import account',
        }));
        return false;
      }

      const btcAddress = await starknetService.getBitcoinAddress();

      setState(prev => ({
        ...prev,
        isLoading: false,
        starknetAddress: result.address || null,
        bitcoinAddress: btcAddress,
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to import account',
      }));
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    await authService.signOut();
    await starknetService.clearAccount();
    
    setState({
      isAuthenticated: false,
      isLoading: false,
      email: null,
      starknetAddress: null,
      bitcoinAddress: null,
      biometricEnabled: false,
      biometricAvailable: state.biometricAvailable,
      biometricType: state.biometricType,
      error: null,
    });
  };


  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const clearSignUpStatus = async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('user_has_signed_up'),
        AsyncStorage.removeItem('user_credentials'),
      ]);
    } catch (error) {
      console.error('Failed to clear sign up status:', error);
    }
  };

  return {
    ...state,
    signUp,
    signIn,
    signInWithBiometric,
    enableBiometric,
    disableBiometric,
    importStarknetAccount,
    signOut,
    clearError,
    clearSignUpStatus,
  };
};