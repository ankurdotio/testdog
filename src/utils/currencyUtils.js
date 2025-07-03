// Currency conversion utility
// In production, you should use a real-time exchange rate API
// like ExchangeRate-API, CurrencyAPI, or similar services

const EXCHANGE_RATES = {
  USD: {
    INR: 83.5, // 1 USD = 83.5 INR (approximate rate)
    EUR: 0.92,
    GBP: 0.79,
    USD: 1,
  },
  INR: {
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    INR: 1,
  },
  EUR: {
    USD: 1.09,
    INR: 91.0,
    GBP: 0.86,
    EUR: 1,
  },
  GBP: {
    USD: 1.27,
    INR: 105.8,
    EUR: 1.16,
    GBP: 1,
  },
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency (USD, INR, EUR, GBP)
 * @param {string} toCurrency - Target currency (USD, INR, EUR, GBP)
 * @returns {number} Converted amount
 */
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (
    !EXCHANGE_RATES[fromCurrency] ||
    !EXCHANGE_RATES[fromCurrency][toCurrency]
  ) {
    throw new Error(
      `Currency conversion not supported: ${fromCurrency} to ${toCurrency}`
    );
  }

  const rate = EXCHANGE_RATES[fromCurrency][toCurrency];
  return amount * rate;
};

/**
 * Get current exchange rate between two currencies
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {number} Exchange rate
 */
export const getExchangeRate = (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  if (
    !EXCHANGE_RATES[fromCurrency] ||
    !EXCHANGE_RATES[fromCurrency][toCurrency]
  ) {
    throw new Error(
      `Exchange rate not available: ${fromCurrency} to ${toCurrency}`
    );
  }

  return EXCHANGE_RATES[fromCurrency][toCurrency];
};

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
export const formatCurrency = (amount, currency) => {
  const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
};

/**
 * Update exchange rates (in production, this would fetch from an API)
 * @param {object} newRates - New exchange rates object
 */
export const updateExchangeRates = (newRates) => {
  Object.assign(EXCHANGE_RATES, newRates);
};

export default {
  convertCurrency,
  getExchangeRate,
  formatCurrency,
  updateExchangeRates,
  EXCHANGE_RATES,
};
