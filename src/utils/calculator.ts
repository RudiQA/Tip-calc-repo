import { CalculationResult, CurrencyInfo, SplitGroup, TaxTiming, TipMode } from '../types';

export interface CalculatorInputs {
  bill: number;
  tax: number;
  taxTiming: TaxTiming;
  tipMode: TipMode;
  tipPercent: number;
  tipAmount: number;
  people: number;
  roundUp: boolean;
  currency: CurrencyInfo;
}

export function calculateTip(inputs: CalculatorInputs): CalculationResult {
  const {
    bill,
    tax,
    taxTiming,
    tipMode,
    tipPercent,
    tipAmount: rawTipAmountInput,
    people,
    roundUp,
    currency,
  } = inputs;

  const factor = Math.pow(10, currency.decimals);

  // Safe non-negative sanitization
  const safeBill = Math.max(0, isNaN(bill) ? 0 : bill);
  const safeTax = Math.max(0, isNaN(tax) ? 0 : tax);
  const safePeople = Math.max(1, Math.floor(isNaN(people) || people < 1 ? 1 : people));

  const billUnits = Math.round(safeBill * factor);
  const taxUnits = Math.round(safeTax * factor);

  // Tax cannot exceed bill for calculation base purposes
  const effectiveTaxUnits = Math.min(taxUnits, billUnits);

  // Calculate tip base
  let tipBaseUnits = billUnits;
  if (taxTiming === 'before' && effectiveTaxUnits > 0) {
    tipBaseUnits = Math.max(0, billUnits - effectiveTaxUnits);
  }
  const tipBase = tipBaseUnits / factor;

  // Determine tip amount and equivalent percentage
  let tipAmountUnits = 0;
  let equivalentPercent: number | null = null;

  if (tipMode === 'percentage') {
    const safePercent = Math.max(0, isNaN(tipPercent) ? 0 : tipPercent);
    tipAmountUnits = Math.round(tipBaseUnits * (safePercent / 100));
    equivalentPercent = safePercent;
  } else {
    const safeAmount = Math.max(0, isNaN(rawTipAmountInput) ? 0 : rawTipAmountInput);
    tipAmountUnits = Math.round(safeAmount * factor);
    if (tipBaseUnits > 0) {
      equivalentPercent = (tipAmountUnits / tipBaseUnits) * 100;
    } else {
      equivalentPercent = null;
    }
  }

  const calculatedTipAmount = tipAmountUnits / factor;
  const unroundedTotalUnits = billUnits + tipAmountUnits;
  const unroundedTotal = unroundedTotalUnits / factor;

  // Round-up & Party Splitting Logic
  let finalTotalUnits = unroundedTotalUnits;
  let extraRoundingUnits = 0;
  let splitGroups: SplitGroup[] = [];
  let isEvenSplit = true;
  let perPersonPrimary = 0;
  let perPersonSecondary: number | null = null;

  if (roundUp && unroundedTotalUnits > 0) {
    // Round each person's share up to the nearest whole currency unit (integer)
    const exactPerPerson = unroundedTotal / safePeople;
    const roundedPerPersonUnit = Math.ceil(exactPerPerson);
    const finalPerPersonUnits = roundedPerPersonUnit * factor;

    finalTotalUnits = finalPerPersonUnits * safePeople;
    extraRoundingUnits = Math.max(0, finalTotalUnits - unroundedTotalUnits);

    perPersonPrimary = roundedPerPersonUnit;
    perPersonSecondary = null;
    isEvenSplit = true;
    splitGroups = [
      {
        count: safePeople,
        amount: roundedPerPersonUnit,
      },
    ];
  } else {
    // Normal split without whole-unit rounding
    const baseShareUnits = Math.floor(unroundedTotalUnits / safePeople);
    const remainderUnits = unroundedTotalUnits % safePeople;

    if (remainderUnits === 0) {
      const perPerson = baseShareUnits / factor;
      perPersonPrimary = perPerson;
      perPersonSecondary = null;
      isEvenSplit = true;
      splitGroups = [
        {
          count: safePeople,
          amount: perPerson,
        },
      ];
    } else {
      // Uneven split: remainderUnits people pay baseShareUnits + 1 cent
      const higherCount = remainderUnits;
      const higherAmount = (baseShareUnits + 1) / factor;
      const lowerCount = safePeople - remainderUnits;
      const lowerAmount = baseShareUnits / factor;

      perPersonPrimary = higherAmount;
      perPersonSecondary = lowerAmount;
      isEvenSplit = false;
      splitGroups = [
        { count: higherCount, amount: higherAmount },
        { count: lowerCount, amount: lowerAmount },
      ];
    }
  }

  const finalTotal = finalTotalUnits / factor;
  const extraRounding = extraRoundingUnits / factor;

  // Effective tip calculation (including rounding remainder if active)
  let effectiveTipPercent: number | null = null;
  if (roundUp && extraRoundingUnits > 0) {
    const totalEffectiveTipUnits = tipAmountUnits + extraRoundingUnits;
    effectiveTipPercent =
      tipBaseUnits > 0 ? (totalEffectiveTipUnits / tipBaseUnits) * 100 : null;
  } else {
    effectiveTipPercent = equivalentPercent;
  }

  return {
    bill: safeBill,
    tax: safeTax,
    tipBase,
    tipAmount: calculatedTipAmount,
    equivalentPercent,
    unroundedTotal,
    finalTotal,
    extraRounding,
    effectiveTipPercent,
    isRoundUpActive: roundUp && extraRoundingUnits > 0,
    people: safePeople,
    perPersonPrimary,
    perPersonSecondary,
    splitGroups,
    isEvenSplit,
  };
}
