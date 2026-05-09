import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CurrencyService {
  private cache: Record<string, { rates: any; time: number }> = {};

  async getRates(base: string) {
    const now = Date.now();
    if (this.cache[base] && now - this.cache[base].time < 3600000) {
      return this.cache[base].rates;
    }

    try {
      const { data } = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${base}`,
        { timeout: 10000 },
      );
      this.cache[base] = { rates: data.rates, time: now };
      return data.rates;
    } catch {
      return {
        CNY: 1,
        USD: 0.14,
        EUR: 0.13,
        JPY: 20.5,
        HKD: 1.09,
        KRW: 185.0,
      };
    }
  }
}
