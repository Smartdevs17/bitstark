import AsyncStorage from '@react-native-async-storage/async-storage';
import bcrypt from 'bcryptjs';
import * as LocalAuthentication from 'expo-local-authentication';

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
    try {
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
        return { success: false, error: 'User already exists. Please sign in.' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

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
    try {
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

      // Verify password
      const passwordMatch = await bcrypt.compare(password, credentials.passwordHash);
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
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}