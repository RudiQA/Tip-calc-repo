export type TipMode = 'percentage' | 'amount';
export type TaxTiming = 'before' | 'after';
export type CalculatorTab = 'equal' | 'individual';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: 'prefix' | 'suffix';
}

export interface SplitGroup {
  count: number;
  amount: number;
}

export interface CalculationResult {
  bill: number;
  tax: number;
  tipBase: number;
  tipAmount: number;
  equivalentPercent: number | null;
  unroundedTotal: number;
  finalTotal: number;
  extraRounding: number;
  effectiveTipPercent: number | null;
  isRoundUpActive: boolean;
  people: number;
  perPersonPrimary: number;
  perPersonSecondary: number | null;
  splitGroups: SplitGroup[];
  isEvenSplit: boolean;
}

export interface UserPreferences {
  currencyCode: string;
  preferredTipPercent: number;
}

export interface IndividualFriend {
  id: string;
  name: string;
  itemSpend: string;
  tipType: 'percent' | 'amount' | 'zero';
  tipValue: string; // percent number or fixed tip amount
  notes?: string;
}
