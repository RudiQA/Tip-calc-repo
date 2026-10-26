import React from 'react';
import { RotateCcw, Receipt } from 'lucide-react';
import { CurrencyInfo } from '../types';

interface HeaderProps {
  currentCurrency: CurrencyInfo;
  onReset: () => void;
  hasInput: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentCurrency, onReset, hasInput }) => {
  return (
    <header className="flex items-center justify-between gap-4 py-4 px-1 border-b border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Split & Tip
          </h1>
          <p className="text-xs text-slate-400">
            Instant calculator in {currentCurrency.code} ({currentCurrency.symbol})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={!hasInput}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[38px] ${
            hasInput
              ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 active:scale-95 border border-slate-700/60'
              : 'text-slate-600 bg-slate-900/40 border border-slate-800/40 cursor-not-allowed'
          }`}
          title="Reset all inputs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
