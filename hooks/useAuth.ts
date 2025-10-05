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

export const useAuth = () => {
  const [state, setState] = useState<AuthHookState>({
    isAuthenticated: false,
    isLoading: true,
    email: null,
    starknetAddress: null,
    bitcoinAddress: null,
    biometricEnabled: false,
    biometricAvailable: false,
    biometricType: 'none',
    error: null,
  });

  const authService = AuthService.getInstance();
  const starknetService = StarknetAccountService.getInstance();

  const checkAuthStatus = useCallback(async () => {
    try {
      const authState = await authService.isAuthenticated();
      
      if (authState.isAuthenticated) {
        const account = await starknetService.getAccount();
        const btcAddress = await starknetService.getBitcoinAddress();

        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          email: authState.email,
          starknetAddress: account?.address || null,
          bitcoinAddress: btcAddress,
          biometricEnabled: authState.biometricEnabled,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Authentication check failed',
      }));
    }
  }, [authService, starknetService]);

  const checkBiometricAvailability = useCallback(async () => {
    const biometric = await authService.isBiometricAvailable();
    setState(prev => ({
      ...prev,
      biometricAvailable: biometric.available,
      biometricType: biometric.type,
    }));
  }, [authService]);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
    checkBiometricAvailability();
  }, [checkAuthStatus, checkBiometricAvailability]);

  const signUp = async (email: string, password: string): Promise<boolean> => {
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
  };
};