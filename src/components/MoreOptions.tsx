import React, { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, HelpCircle, ArrowUpRight } from 'lucide-react';
import { CurrencyInfo, TaxTiming } from '../types';
import { SUPPORTED_CURRENCIES } from '../utils/currencies';

interface MoreOptionsProps {
  taxInput: string;
  onTaxInputChange: (val: string) => void;
  taxTiming: TaxTiming;
  onTaxTimingChange: (timing: TaxTiming) => void;
  roundUp: boolean;
  onRoundUpToggle: (val: boolean) => void;
  currency: CurrencyInfo;
  onCurrencyChange: (currency: CurrencyInfo) => void;
  billAmount: number;
}

export const MoreOptions: React.FC<MoreOptionsProps> = ({
  taxInput,
  onTaxInputChange,
  taxTiming,
  onTaxTimingChange,
  roundUp,
  onRoundUpToggle,
  currency,
  onCurrencyChange,
  billAmount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTaxHelp, setShowTaxHelp] = useState(false);

  const parsedTax = parseFloat(taxInput) || 0;
  const isTaxExceedingBill = billAmount > 0 && parsedTax > billAmount;

  return (
    <div className="border border-slate-800 rounded-2xl bg-slate-950/40 overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 text-left text-sm font-semibold text-slate-300 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>More options</span>
          {(parsedTax > 0 || roundUp || currency.code !== 'ILS') && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>{isOpen ? 'Hide' : 'Tax, rounding & currency'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-1 space-y-4 border-t border-slate-800/80 text-sm">
          {/* Tax Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tax-amount-input" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <span>Included Tax Amount</span>
                <button
                  type="button"
                  onClick={() => setShowTaxHelp(!showTaxHelp)}
                  className="text-slate-400 hover:text-slate-200"
                  aria-label="Explain tax calculation"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>

              {/* Before / After Tax Segmented Switch */}
              <div className="inline-flex p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => onTaxTimingChange('before')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    taxTiming === 'before'
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Before Tax
                </button>
                <button
                  type="button"
                  onClick={() => onTaxTimingChange('after')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    taxTiming === 'after'
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  After Tax
                </button>
              </div>
            </div>

            {/* Help Callout */}
            {showTaxHelp && (
              <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed">
                The entered bill is treated as already including tax. Selecting <strong>Before Tax</strong> deducts the tax from the bill before calculating percentage tips. A manually entered tip amount remains fixed.
              </div>
            )}

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm pointer-events-none">
                {currency.symbol}
              </span>
              <input
                id="tax-amount-input"
                type="text"
                inputMode="decimal"
                value={taxInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    onTaxInputChange(val);
                  }
                }}
                placeholder="0.00"
                className="w-full h-10 pl-8 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono-num"
              />
            </div>

            {isTaxExceedingBill && (
              <p className="text-xs text-amber-400">
                Notice: Tax amount exceeds the entered bill. The tip base will be set to 0.
              </p>
            )}
          </div>

          {/* Round Up Per Person Option */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <div className="space-y-0.5 pr-2">
              <label
                htmlFor="round-up-toggle"
                className="text-xs font-semibold text-slate-200 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span>Round up per person</span>
              </label>
              <p className="text-[11px] text-slate-400 leading-normal">
                Rounds each person’s payment up to the next whole {currency.symbol} unit
              </p>
            </div>
            <button
              id="round-up-toggle"
              type="button"
              role="switch"
              aria-checked={roundUp}
              onClick={() => onRoundUpToggle(!roundUp)}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-emerald-400 shrink-0 ${
                roundUp ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  roundUp ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Currency Selector */}
          <div className="space-y-1.5 pt-1">
            <label htmlFor="currency-select" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Currency Formatting</span>
            </label>
            <select
              id="currency-select"
              value={currency.code}
              onChange={(e) => {
                const found = SUPPORTED_CURRENCIES.find((c) => c.code === e.target.value);
                if (found) {
                  onCurrencyChange(found);
                }
              }}
              className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} — {c.code}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Changes formatting and decimal rules only. No exchange rates applied.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
