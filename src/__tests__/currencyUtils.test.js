import {
  convertCurrency,
  getExchangeRate,
  formatCurrency,
} from '../utils/currencyUtils.js';

describe('Currency Utilities', () => {
  describe('convertCurrency', () => {
    it('should convert USD to INR correctly', () => {
      const result = convertCurrency(100, 'USD', 'INR');
      expect(result).toBe(8350); // 100 USD * 83.5 = 8350 INR
    });

    it('should convert EUR to INR correctly', () => {
      const result = convertCurrency(100, 'EUR', 'INR');
      expect(result).toBe(9100); // 100 EUR * 91.0 = 9100 INR
    });

    it('should return same amount for same currency', () => {
      const result = convertCurrency(100, 'INR', 'INR');
      expect(result).toBe(100);
    });

    it('should throw error for unsupported currency', () => {
      expect(() => {
        convertCurrency(100, 'XYZ', 'INR');
      }).toThrow('Currency conversion not supported: XYZ to INR');
    });
  });

  describe('getExchangeRate', () => {
    it('should return correct exchange rate', () => {
      const rate = getExchangeRate('USD', 'INR');
      expect(rate).toBe(83.5);
    });

    it('should return 1 for same currency', () => {
      const rate = getExchangeRate('USD', 'USD');
      expect(rate).toBe(1);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const formatted = formatCurrency(1200.5, 'USD');
      expect(formatted).toBe('$1200.50');
    });

    it('should format INR correctly', () => {
      const formatted = formatCurrency(100200.0, 'INR');
      expect(formatted).toBe('₹100200.00');
    });

    it('should format EUR correctly', () => {
      const formatted = formatCurrency(1100.25, 'EUR');
      expect(formatted).toBe('€1100.25');
    });

    it('should format GBP correctly', () => {
      const formatted = formatCurrency(950.75, 'GBP');
      expect(formatted).toBe('£950.75');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical e-commerce cart conversion', () => {
      // Scenario: Cart with mixed currency items
      const items = [
        { price: 500, currency: 'USD', quantity: 2 }, // Gaming headset
        { price: 800, currency: 'EUR', quantity: 1 }, // Mechanical keyboard
        { price: 2000, currency: 'INR', quantity: 1 }, // Local accessory
      ];

      let totalINR = 0;
      items.forEach((item) => {
        const priceInINR = convertCurrency(item.price, item.currency, 'INR');
        totalINR += priceInINR * item.quantity;
      });

      // Expected: (500*83.5*2) + (800*91.0*1) + (2000*1*1) = 83500 + 72800 + 2000 = 158300
      expect(totalINR).toBe(158300);
    });

    it('should handle single product conversion correctly', () => {
      // Scenario: Single expensive product in USD
      const productPrice = 1299.99; // Gaming laptop
      const quantity = 1;

      const priceInINR = convertCurrency(productPrice, 'USD', 'INR');
      const totalInINR = priceInINR * quantity;

      // Expected: 1299.99 * 83.5 = 108549.165
      expect(priceInINR).toBeCloseTo(108549.165, 2);
      expect(totalInINR).toBeCloseTo(108549.165, 2);
    });

    it('should handle payment amount calculation in paise', () => {
      // Scenario: Converting final amount to paise for Razorpay
      const amountInINR = 100200.5;
      const amountInPaise = Math.round(amountInINR * 100);

      expect(amountInPaise).toBe(10020050);
    });
  });
});
