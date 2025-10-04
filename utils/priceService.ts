import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CONFIG } from './config';

const CACHE_KEY = 'btc_price_cache';
const CACHE_DURATION = 60000; // 1 minute

interface PriceCache {
  price: number;
  timestamp: number;
}

export class PriceService {
  private static instance: PriceService;
  private currentPrice: number = 95000; // Fallback
  private lastFetch: number = 0;

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  async getBtcPrice(forceRefresh: boolean = false): Promise<number> {
    try {
      // Check cache first
      if (!forceRefresh && Date.now() - this.lastFetch < CACHE_DURATION) {
        return this.currentPrice;
      }

      // Try AsyncStorage cache
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached && !forceRefresh) {
        const { price, timestamp }: PriceCache = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          this.currentPrice = price;
          this.lastFetch = timestamp;
          return price;
        }
      }

      // Fetch fresh price
      const response = await axios.get(
        `${CONFIG.priceApiUrl}/simple/price`,
        {
          params: {
            ids: 'bitcoin',
            vs_currencies: 'usd',
          },
          timeout: 5000,
        }
      );

      const price = response.data.bitcoin?.usd || this.currentPrice;
      
      // Update cache
      this.currentPrice = price;
      this.lastFetch = Date.now();
      
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ price, timestamp: this.lastFetch })
      );

      return price;
    } catch (error) {
      console.error('Failed to fetch BTC price:', error);
      return this.currentPrice; // Return cached/fallback
    }
  }

  convertBtcToUsd(btcAmount: number): number {
    return btcAmount * this.currentPrice;
  }

  convertUsdToBtc(usdAmount: number): number {
    return usdAmount / this.currentPrice;
  }

  formatBtc(amount: number): string {
    return amount.toFixed(8);
  }

  formatUsd(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}