import React, { useState } from 'react';
import { Copy, Check, Users, Sparkles } from 'lucide-react';
import { CalculationResult, CurrencyInfo } from '../types';
import { formatCurrency } from '../utils/currencies';

interface ResultsCardProps {
  result: CalculationResult;
  currency: CurrencyInfo;
}

export const ResultsCard: React.FC<ResultsCardProps> = ({ result, currency }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    const lines = [
      `Bill & Tip Breakdown`,
      `===================`,
      `Bill Amount: ${formatCurrency(result.bill, currency)}`,
    ];

    if (result.tax > 0) {
      lines.push(`Included Tax: ${formatCurrency(result.tax, currency)}`);
    }

    const tipPctString =
      result.equivalentPercent !== null
        ? ` (${result.equivalentPercent.toFixed(1)}%)`
        : '';
    lines.push(`Tip: ${formatCurrency(result.tipAmount, currency)}${tipPctString}`);

    if (result.isRoundUpActive) {
      lines.push(`Round-up Extra: +${formatCurrency(result.extraRounding, currency)}`);
      if (result.effectiveTipPercent !== null) {
        lines.push(`Effective Tip: ${result.effectiveTipPercent.toFixed(1)}%`);
      }
    }

    lines.push(`Grand Total: ${formatCurrency(result.finalTotal, currency)}`);
    lines.push(`Party Size: ${result.people} ${result.people === 1 ? 'person' : 'people'}`);

    if (result.people > 1) {
      if (result.isEvenSplit) {
        lines.push(`Each Person Pays: ${formatCurrency(result.perPersonPrimary, currency)}`);
      } else {
        lines.push(`Allocation:`);
        result.splitGroups.forEach((g) => {
          lines.push(
            ` • ${g.count} ${g.count === 1 ? 'person pays' : 'people pay'} ${formatCurrency(g.amount, currency)}`
          );
        });
      }
    } else {
      lines.push(`Total Due: ${formatCurrency(result.finalTotal, currency)}`);
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  const isSplitting = result.people > 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Hero Metric: Per Person when splitting, or Total when single person */}
      {isSplitting ? (
        <div className="space-y-1.5 pb-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>PER PERSON PAYS</span>
            </span>
            <span className="text-slate-400 font-normal">
              for {result.people} people
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono-num">
              {formatCurrency(result.perPersonPrimary, currency)}
            </span>
            {result.perPersonSecondary !== null && (
              <span className="text-lg text-slate-400 font-mono-num font-semibold">
                / {formatCurrency(result.perPersonSecondary, currency)}
              </span>
            )}
          </div>

          {/* Uneven Split Detailed Allocation Banner */}
          {!result.isEvenSplit && (
            <div className="p-3 mt-2 bg-slate-950/80 border border-emerald-500/30 rounded-xl text-xs text-slate-300">
              <span className="font-semibold text-emerald-400 block mb-0.5">
                Exact cent allocation:
              </span>
              <p>
                {result.splitGroups.map((group, idx) => (
                  <span key={idx}>
                    {idx > 0 && ' and '}
                    <strong className="text-white font-semibold">
                      {group.count} {group.count === 1 ? 'person pays' : 'people pay'}
                    </strong>{' '}
                    <span className="font-mono-num text-emerald-300">
                      {formatCurrency(group.amount, currency)}
                    </span>
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5 pb-2">
          <span className="text-xs font-semibold text-emerald-400 block tracking-wider">
            TOTAL AMOUNT DUE
          </span>
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono-num">
            {formatCurrency(result.finalTotal, currency)}
          </div>
        </div>
      )}

      {/* Metrics Row: Breakdown items */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
          <span className="text-xs text-slate-400 block mb-1">
            Tip Amount {result.equivalentPercent !== null ? `(${result.equivalentPercent.toFixed(1)}%)` : ''}
          </span>
          <span className="text-xl font-bold text-white font-mono-num">
            {formatCurrency(result.tipAmount, currency)}
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
          <span className="text-xs text-slate-400 block mb-1">
            {isSplitting ? 'Bill Total' : 'Base Bill'}
          </span>
          <span className="text-xl font-bold text-white font-mono-num">
            {formatCurrency(isSplitting ? result.finalTotal : result.bill, currency)}
          </span>
        </div>
      </div>

      {/* Round-up Highlight (if active) */}
      {result.isRoundUpActive && (
        <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/25 rounded-2xl text-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-300 font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Round-up applied</span>
            </span>
            <span className="font-mono-num">
              +{formatCurrency(result.extraRounding, currency)} total
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400 pt-0.5">
            <span>Effective tip rate:</span>
            <span className="font-semibold text-white font-mono-num">
              {result.effectiveTipPercent !== null
                ? `${result.effectiveTipPercent.toFixed(1)}%`
                : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Copy Summary Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleCopySummary}
          className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700/90 active:scale-[0.98] border border-slate-700/80 flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Summary Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-300" />
              <span>Copy Summary</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
