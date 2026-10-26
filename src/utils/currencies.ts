import { CurrencyInfo } from '../types';

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  {
    code: 'ILS',
    symbol: '₪',
    name: 'Israeli Shekel (₪)',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar ($)',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (€)',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound (£)',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar (CA$)',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar (A$)',
    decimals: 2,
    symbolPosition: 'prefix',
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen (¥)',
    decimals: 0,
    symbolPosition: 'prefix',
  },
];

export const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0]; // ILS

export function getCurrency(code: string): CurrencyInfo {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return found || DEFAULT_CURRENCY;
}

export function formatCurrency(
  value: number,
  currency: CurrencyInfo,
  includeSymbol = true
): string {
  if (isNaN(value) || !isFinite(value)) {
    return includeSymbol ? `${currency.symbol}0.00` : '0.00';
  }

  const formattedNum = value.toLocaleString(undefined, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });

  if (!includeSymbol) {
    return formattedNum;
  }

  return currency.symbolPosition === 'prefix'
    ? `${currency.symbol}${formattedNum}`
    : `${formattedNum} ${currency.symbol}`;
}
