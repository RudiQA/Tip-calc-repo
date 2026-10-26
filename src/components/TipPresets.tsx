import React, { useState } from 'react';
import { Percent, DollarSign } from 'lucide-react';
import { CurrencyInfo, TipMode } from '../types';
import { formatCurrency } from '../utils/currencies';

interface TipPresetsProps {
  tipMode: TipMode;
  onTipModeChange: (mode: TipMode) => void;
  selectedPercent: number | null;
  customPercent: string;
  onSelectPreset: (percent: number) => void;
  onCustomPercentChange: (value: string) => void;
  tipAmountInput: string;
  onTipAmountInputChange: (value: string) => void;
  calculatedTipAmount: number;
  equivalentPercent: number | null;
  currency: CurrencyInfo;
  tipBase: number;
}

const PRESET_PERCENTAGES = [0, 10, 15, 18, 20, 25];

export const TipPresets: React.FC<TipPresetsProps> = ({
  tipMode,
  onTipModeChange,
  selectedPercent,
  customPercent,
  onSelectPreset,
  onCustomPercentChange,
  tipAmountInput,
  onTipAmountInputChange,
  calculatedTipAmount,
  equivalentPercent,
  currency,
  tipBase,
}) => {
  const [isCustomActive, setIsCustomActive] = useState<boolean>(
    selectedPercent === null && customPercent !== ''
  );

  const handlePresetClick = (pct: number) => {
    setIsCustomActive(false);
    onSelectPreset(pct);
  };

  const handleCustomFocus = () => {
    setIsCustomActive(true);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setIsCustomActive(true);
      onCustomPercentChange(val);
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode Switcher Segmented Control */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200">
          Tip Selection
        </label>
        <div className="inline-flex p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => onTipModeChange('percentage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[34px] ${
              tipMode === 'percentage'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Percentage</span>
          </button>
          <button
            type="button"
            onClick={() => onTipModeChange('amount')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[34px] ${
              tipMode === 'amount'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Exact Amount</span>
          </button>
        </div>
      </div>

      {tipMode === 'percentage' ? (
        <div className="space-y-2.5">
          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PRESET_PERCENTAGES.map((pct) => {
              const isSelected = !isCustomActive && selectedPercent === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePresetClick(pct)}
                  className={`min-h-[44px] flex items-center justify-center rounded-xl text-sm font-medium transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold ring-2 ring-emerald-400/50 shadow-md'
                      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
                  }`}
                >
                  {pct}%
                </button>
              );
            })}
          </div>

          {/* Custom Percentage Input */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <input
                id="custom-tip-percent"
                type="text"
                inputMode="decimal"
                value={customPercent}
                onChange={handleCustomChange}
                onFocus={handleCustomFocus}
                placeholder="Custom %"
                className={`w-full h-11 pl-3.5 pr-8 rounded-xl bg-slate-950/80 border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all ${
                  isCustomActive
                    ? 'border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold pointer-events-none">
                %
              </span>
            </div>

            {/* Calculated tip feedback */}
            <div className="text-right px-1 shrink-0">
              <span className="text-xs text-slate-400 block">Calculated tip</span>
              <span className="text-sm font-bold text-emerald-400 font-mono-num">
                {formatCurrency(calculatedTipAmount, currency)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Amount Mode */
        <div className="space-y-2.5">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm pointer-events-none">
              {currency.symbol}
            </div>
            <input
              id="tip-amount-input"
              type="text"
              inputMode="decimal"
              value={tipAmountInput}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  onTipAmountInputChange(val);
                }
              }}
              placeholder={`0${currency.decimals > 0 ? '.00' : ''}`}
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-950/80 border border-slate-800 text-base font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition-all font-mono-num"
            />
          </div>

          {/* Equivalent Percentage indicator */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <span>
              {tipBase > 0 ? (
                <>Calculated on {formatCurrency(tipBase, currency)} bill base</>
              ) : (
                <>Tip for the whole bill</>
              )}
            </span>
            <span className="font-medium text-slate-300">
              Equivalent tip:{' '}
              <strong className="text-emerald-400 font-mono-num">
                {equivalentPercent !== null
                  ? `${equivalentPercent.toFixed(1)}%`
                  : '—'}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
