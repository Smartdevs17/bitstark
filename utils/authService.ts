import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { CryptoUtils } from './cryptoUtils';

interface UserCredentials {
  email: string;
  passwordHash: string;
  biometricEnabled: boolean;
  createdAt: number;
}

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  biometricEnabled: boolean;
}

const STORAGE_KEYS = {
  USER_CREDENTIALS: 'user_credentials',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  SESSION_TOKEN: 'session_token',
};

export class AuthService {
  private static instance: AuthService;
  // Mock mode for development - set to true for instant auth
  private readonly MOCK_MODE = false; // Set to false to test improved performance

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Check if biometric authentication is available
  async isBiometricAvailable(): Promise<{
    available: boolean;
    type: 'faceId' | 'touchId' | 'fingerprint' | 'none';
  }> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!compatible || !enrolled) {
        return { available: false, type: 'none' };
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return { available: true, type: 'faceId' };
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return { available: true, type: 'touchId' };
      }

      return { available: false, type: 'none' };
    } catch (error) {
      console.error('Biometric check failed:', error);
      return { available: false, type: 'none' };
    }
  }

  // Authenticate with biometric
  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock BitStark',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  // Sign up new user
  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Use mock mode for development
    if (this.MOCK_MODE) {
      console.log('🎭 Using mock signup for development');
      return this.mockSignUp(email, password);
    }

    try {
      // Validate input parameters
      if (!email || typeof email !== 'string') {
        return { success: false, error: 'Email is required' };
      }

      if (!password || typeof password !== 'string') {
        return { success: false, error: 'Password is required' };
      }

      // Validate email
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Invalid email address' };
      }

      // Validate password (min 8 chars, 1 uppercase, 1 number)
      if (!this.isValidPassword(password)) {
        return { success: false, error: 'Password must be at least 8 characters with 1 uppercase and 1 number' };
      }

      // Check if user already exists
      const existingUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
      if (existingUser) {
        return { 
          success: false, 
          error: 'An account already exists on this device. Please sign in or use "Switch Account" to create a new account.' 
        };
      }

      // Hash password with proper error handling
      let passwordHash: string;
      try {
        passwordHash = await CryptoUtils.hashPassword(password);
      } catch (hashError) {
        console.error('Password hashing failed:', hashError);
        return { success: false, error: 'Failed to process password. Please try again.' };
      }

      // Store credentials
      const credentials: UserCredentials = {
        email,
        passwordHash,
        biometricEnabled: false,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_CREDENTIALS,
        JSON.stringify(credentials)
      );

      // Create session
      await this.createSession(email);

      return { success: true };
    } catch (error) {
      console.error('Sign up failed:', error);
      return { success: false, error: 'Sign up failed. Please try again.' };
    }
  }

  // Sign in existing user
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Use mock mode for development
    if (this.MOCK_MODE) {
      console.log('🎭 Using mock signin for development');
      return this.mockSignIn(email, password);
    }

    try {
      // Validate input parameters
      if (!email || typeof email !== 'string') {
        return { success: false, error: 'Email is required' };
      }

      if (!password || typeof password !== 'string') {
        return { success: false, error: 'Password is required' };
      }

      // Get stored credentials
      const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
      if (!credentialsJson) {
        return { success: false, error: 'No account found. Please sign up.' };
      }

      const credentials: UserCredentials = JSON.parse(credentialsJson);

      // Verify email
      if (credentials.email !== email) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password with proper error handling
      let passwordMatch: boolean;
      try {
        passwordMatch = await CryptoUtils.verifyPassword(password, credentials.passwordHash);
      } catch (compareError) {
        console.error('Password comparison failed:', compareError);
        return { success: false, error: 'Failed to verify password. Please try again.' };
      }
      if (!passwordMatch) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Create session
      await this.createSession(email);

      return { success: true };
    } catch (error) {
      console.error('Sign in failed:', error);
      return { success: false, error: 'Sign in failed. Please try again.' };
    }
  }

  // Sign in with biometric
  async signInWithBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if biometric is enabled
      const biometricEnabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      if (biometricEnabled !== 'true') {
        return { success: false, error: 'Biometric authentication not enabled' };
      }

      // Authenticate
      const authenticated = await this.authenticateWithBiometric();
      if (!authenticated) {
        return { success: false, error: 'Biometric authentication failed' };
      }

      // Get user email
      const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
      if (!credentialsJson) {
        return { success: false, error: 'No account found' };
      }

      const credentials: UserCredentials = JSON.parse(credentialsJson);

      // Create session
      await this.createSession(credentials.email);

      return { success: true };
    } catch (error) {
      console.error('Biometric sign in failed:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  // Enable biometric authentication
  async enableBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      const biometric = await this.isBiometricAvailable();
      if (!biometric.available) {
        return { success: false, error: 'Biometric authentication not available on this device' };
      }

      // Authenticate once to confirm
      const authenticated = await this.authenticateWithBiometric();
      if (!authenticated) {
        return { success: false, error: 'Biometric authentication failed' };
      }

      // Enable biometric
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');

      // Update credentials
      const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
      if (credentialsJson) {
        const credentials: UserCredentials = JSON.parse(credentialsJson);
        credentials.biometricEnabled = true;
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_CREDENTIALS,
          JSON.stringify(credentials)
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Enable biometric failed:', error);
      return { success: false, error: 'Failed to enable biometric' };
    }
  }

  // Disable biometric
  async disableBiometric(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');
    
    const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
    if (credentialsJson) {
      const credentials: UserCredentials = JSON.parse(credentialsJson);
      credentials.biometricEnabled = false;
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_CREDENTIALS,
        JSON.stringify(credentials)
      );
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<AuthState> {
    try {
      const sessionToken = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
      const biometricEnabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);

      if (!sessionToken || !credentialsJson) {
        return { isAuthenticated: false, email: null, biometricEnabled: false };
      }

      const credentials: UserCredentials = JSON.parse(credentialsJson);

      return {
        isAuthenticated: true,
        email: credentials.email,
        biometricEnabled: biometricEnabled === 'true',
      };
    } catch (error) {
      return { isAuthenticated: false, email: null, biometricEnabled: false };
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
  }

  // Switch account - completely reset all data
  async switchAccount(): Promise<void> {
    try {
      // Clear all auth data
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_CREDENTIALS);
      await AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
      
      // Clear Starknet account data
      const starknetService = (await import('./starknetAccountService')).StarknetAccountService.getInstance();
      await starknetService.clearIncompleteAccount();
      
      console.log('Account data cleared successfully');
    } catch (error) {
      console.error('Failed to switch account:', error);
      throw new Error('Failed to clear account data');
    }
  }

  // Create session
  private async createSession(email: string): Promise<void> {
    const sessionToken = this.generateSessionToken();
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, sessionToken);
  }

  // Validate email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password
  private isValidPassword(password: string): boolean {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[0-9]/.test(password);
  }

  // Generate session token
  private generateSessionToken(): string {
    return CryptoUtils.generateToken() + Date.now().toString(36);
  }

  /**
   * Mock signup for development - instant response
   */
  private async mockSignUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Simulate a small delay for realism (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Basic validation
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    if (!this.isValidEmail(email)) {
      return { success: false, error: 'Invalid email address' };
    }

    if (!this.isValidPassword(password)) {
      return { success: false, error: 'Password must be at least 8 characters with 1 uppercase and 1 number' };
    }

    // Check if user already exists
    const existingUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
    if (existingUser) {
      return { 
        success: false, 
        error: 'An account already exists on this device. Please sign in or use "Switch Account" to create a new account.' 
      };
    }

    // Store mock credentials (no password hashing)
    const credentials: UserCredentials = {
      email,
      passwordHash: 'mock_hash_' + Date.now(), // Simple mock hash
      biometricEnabled: false,
      createdAt: Date.now(),
    };

    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_CREDENTIALS,
      JSON.stringify(credentials)
    );

    // Create session
    await this.createSession(email);

    return { success: true };
  }

  /**
   * Mock signin for development - instant response
   */
  private async mockSignIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Simulate a small delay for realism (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Basic validation
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Get stored credentials
    const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
    if (!credentialsJson) {
      return { success: false, error: 'No account found. Please sign up.' };
    }

    const credentials: UserCredentials = JSON.parse(credentialsJson);

    // Verify email
    if (credentials.email !== email) {
      return { success: false, error: 'Invalid email or password' };
    }

    // For mock mode, accept any password (no verification needed)
    // In production, this would verify the password hash

    // Create session
    await this.createSession(email);

    return { success: true };
  }

}