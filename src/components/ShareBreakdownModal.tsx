import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, User, Users, Send } from 'lucide-react';
import { CurrencyInfo } from '../types';
import { formatCurrency } from '../utils/currencies';

export interface CalculatedFriendShare {
  id: string;
  name: string;
  itemSpend: string;
  tipType: 'percent' | 'amount' | 'zero';
  tipValue: string;
  spend: number;
  tip: number;
  effectivePct: number;
  totalOwed: number;
}

interface ShareBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: CalculatedFriendShare[];
  currency: CurrencyInfo;
  parsedTotalBill: number;
  tableTipPercent: number;
  remainingBillToCover: number;
  remainingGroupCount: number;
  remainingPerPersonTotal: number;
  totalCollected: number;
}

export const ShareBreakdownModal: React.FC<ShareBreakdownModalProps> = ({
  isOpen,
  onClose,
  friends,
  currency,
  parsedTotalBill,
  tableTipPercent,
  remainingBillToCover,
  remainingGroupCount,
  remainingPerPersonTotal,
  totalCollected,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // Format single person share message
  const getFriendShareText = (f: CalculatedFriendShare) => {
    const tipText =
      f.tipType === 'zero'
        ? '0% tip (exact food only)'
        : `Tip: ${formatCurrency(f.tip, currency)} (${f.effectivePct.toFixed(1)}%)`;
    return `Hey ${f.name}! Your share of the bill is ${formatCurrency(f.totalOwed, currency)} (Food: ${formatCurrency(f.spend, currency)} · ${tipText}).`;
  };

  const handleCopySingle = async (f: CalculatedFriendShare) => {
    const text = getFriendShareText(f);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(f.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShareSingle = async (f: CalculatedFriendShare) => {
    const text = getFriendShareText(f);
    if (canNativeShare) {
      try {
        await navigator.share({
          title: `Bill share for ${f.name}`,
          text,
        });
      } catch {
        // User dismissed
      }
    } else {
      handleCopySingle(f);
    }
  };

  // Format full group share text
  const getFullBreakdownText = () => {
    const lines = [
      `🧾 Bill Breakdown & Tips`,
      `========================`,
      `Total Receipt: ${formatCurrency(parsedTotalBill, currency)}`,
      `Table Tip: ${tableTipPercent}%`,
      `------------------------`,
      `WHO PAYS WHAT:`,
    ];

    friends.forEach((f) => {
      const tipNote =
        f.tipType === 'zero'
          ? `(0% tip — food only)`
          : `(Tip: ${formatCurrency(f.tip, currency)} / ${f.effectivePct.toFixed(1)}%)`;
      lines.push(
        `• ${f.name}: ${formatCurrency(f.totalOwed, currency)} [Food: ${formatCurrency(f.spend, currency)} + ${tipNote}]`
      );
    });

    if (remainingBillToCover > 0 && remainingGroupCount > 0) {
      lines.push(
        `• Rest of Group (${remainingGroupCount} people): ${formatCurrency(remainingPerPersonTotal, currency)} each`
      );
    }

    lines.push(`------------------------`);
    lines.push(`Total Collected: ${formatCurrency(totalCollected, currency)}`);
    return lines.join('\n');
  };

  const handleCopyAll = async () => {
    const fullText = getFullBreakdownText();
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy all', err);
    }
  };

  const handleNativeShareAll = async () => {
    const fullText = getFullBreakdownText();
    if (canNativeShare) {
      try {
        await navigator.share({
          title: 'Full Bill Breakdown',
          text: fullText,
        });
      } catch {
        // User dismissed
      }
    } else {
      handleCopyAll();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal / Slide-up sheet */}
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[85vh] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="share-modal-title" className="text-base font-bold text-white">
                Share Bill Details
              </h3>
              <p className="text-xs text-slate-400">
                Send each friend their exact share directly
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body: Individual Friend Cards */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {/* Quick Overview Strip */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
            <span className="text-slate-400">Receipt Bill:</span>
            <span className="font-bold text-white font-mono-num">
              {formatCurrency(parsedTotalBill, currency)}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Total with Tips:</span>
            <span className="font-bold text-emerald-400 font-mono-num">
              {formatCurrency(totalCollected, currency)}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-400 pt-1 uppercase tracking-wider">
            Individual Breakdowns
          </p>

          {/* Friend rows */}
          {friends.map((f) => {
            const isCopied = copiedId === f.id;
            const isCheap = f.tipType === 'zero';

            return (
              <div
                key={f.id}
                className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {f.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Food: {formatCurrency(f.spend, currency)} ·{' '}
                        {isCheap ? (
                          <span className="text-amber-400 font-medium">0% tip</span>
                        ) : (
                          `${f.effectivePct.toFixed(1)}% tip (${formatCurrency(f.tip, currency)})`
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Amount Owed */}
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-400 font-mono-num block">
                      {formatCurrency(f.totalOwed, currency)}
                    </span>
                    <span className="text-[10px] text-slate-500">to pay</span>
                  </div>
                </div>

                {/* Direct Share / Copy Button for this specific friend */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopySingle(f)}
                    className="flex-1 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:scale-95 text-xs font-semibold text-slate-200 border border-slate-700/60 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied text for {f.name}!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy message for {f.name}</span>
                      </>
                    )}
                  </button>

                  {canNativeShare && (
                    <button
                      type="button"
                      onClick={() => handleNativeShareSingle(f)}
                      aria-label={`Send directly to ${f.name}`}
                      title={`Send directly to ${f.name}`}
                      className="h-9 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Rest of Group Card if applicable */}
          {remainingBillToCover > 0 && remainingGroupCount > 0 && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Rest of Group ({remainingGroupCount} people)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Covers remaining food + {tableTipPercent}% tip
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-300 font-mono-num block">
                    {formatCurrency(remainingPerPersonTotal, currency)}
                  </span>
                  <span className="text-[10px] text-slate-500">each</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center gap-2.5">
          {canNativeShare ? (
            <button
              type="button"
              onClick={handleNativeShareAll}
              className="w-full sm:flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Entire Breakdown</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleCopyAll}
            className={`w-full ${
              canNativeShare ? 'sm:w-auto' : 'flex-1'
            } h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all`}
          >
            {copiedAll ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied Full Receipt!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" />
                <span>Copy Full Receipt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
