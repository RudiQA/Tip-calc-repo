import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Copy, Check, User, Users, AlertCircle, Sparkles, Receipt, Share2, Scale, ArrowRight } from 'lucide-react';
import { CurrencyInfo, IndividualFriend } from '../types';
import { formatCurrency } from '../utils/currencies';
import { ShareBreakdownModal } from './ShareBreakdownModal';

interface CustomSplitterProps {
  currency: CurrencyInfo;
  billInput: string;
  onBillInputChange: (val: string) => void;
  tableTipPercent: number;
  onTableTipPercentChange: (pct: number) => void;
  friends: IndividualFriend[];
  onFriendsChange: React.Dispatch<React.SetStateAction<IndividualFriend[]>>;
  remainingGroupCount: number;
  onRemainingGroupCountChange: (count: number) => void;
  equalSplitPerPerson: number;
  totalEqualPeople: number;
  onSwitchToEqualTab: () => void;
}

export const CustomSplitter: React.FC<CustomSplitterProps> = ({
  currency,
  billInput,
  onBillInputChange,
  tableTipPercent,
  onTableTipPercentChange,
  friends,
  onFriendsChange,
  remainingGroupCount,
  onRemainingGroupCountChange,
  equalSplitPerPerson,
  totalEqualPeople,
  onSwitchToEqualTab,
}) => {
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const parsedTotalBill = parseFloat(billInput) || 0;

  // Add friend
  const handleAddFriend = (isCheap = false) => {
    const newId = Date.now().toString();
    const count = friends.length + 1;
    onFriendsChange((prev) => [
      ...prev,
      {
        id: newId,
        name: isCheap ? `Cheap Friend ${count}` : `Friend ${count}`,
        itemSpend: '',
        tipType: isCheap ? 'zero' : 'percent',
        tipValue: isCheap ? '0' : tableTipPercent.toString(),
      },
    ]);
  };

  const handleRemoveFriend = (id: string) => {
    if (friends.length > 1) {
      onFriendsChange((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleUpdateFriend = (id: string, updates: Partial<IndividualFriend>) => {
    onFriendsChange((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  // Calculations
  const factor = Math.pow(10, currency.decimals);

  const individualResults = useMemo(() => {
    return friends.map((friend) => {
      const spend = Math.max(0, parseFloat(friend.itemSpend) || 0);
      let tip = 0;
      let effectivePct = 0;

      if (friend.tipType === 'zero') {
        tip = 0;
        effectivePct = 0;
      } else if (friend.tipType === 'percent') {
        const pct = Math.max(0, parseFloat(friend.tipValue) || 0);
        tip = Math.round(spend * (pct / 100) * factor) / factor;
        effectivePct = pct;
      } else if (friend.tipType === 'amount') {
        const amt = Math.max(0, parseFloat(friend.tipValue) || 0);
        tip = amt;
        effectivePct = spend > 0 ? (amt / spend) * 100 : 0;
      }

      const totalOwed = spend + tip;
      return {
        ...friend,
        spend,
        tip,
        effectivePct,
        totalOwed,
      };
    });
  }, [friends, factor]);

  const totalIndividualSpend = useMemo(() => {
    return individualResults.reduce((acc, curr) => acc + curr.spend, 0);
  }, [individualResults]);

  const totalIndividualTips = useMemo(() => {
    return individualResults.reduce((acc, curr) => acc + curr.tip, 0);
  }, [individualResults]);

  // Remaining balance
  const remainingBillToCover = Math.max(0, parsedTotalBill - totalIndividualSpend);
  const remainingOverBill = Math.max(0, totalIndividualSpend - parsedTotalBill);

  // Group share for remaining balance
  const remainingPerPersonSpend =
    remainingGroupCount > 0 ? remainingBillToCover / remainingGroupCount : 0;
  const remainingPerPersonTip =
    remainingPerPersonSpend * (tableTipPercent / 100);
  const remainingPerPersonTotal =
    remainingPerPersonSpend + remainingPerPersonTip;

  const totalCollected =
    totalIndividualSpend +
    totalIndividualTips +
    (remainingBillToCover > 0
      ? remainingBillToCover + remainingBillToCover * (tableTipPercent / 100)
      : 0);

  // Copy Summary handler
  const handleCopy = async () => {
    const lines = [
      `🧾 Itemized Bill & Cheap Friends Split`,
      `=====================================`,
      `Total Receipt Bill: ${formatCurrency(parsedTotalBill, currency)}`,
      `Table Default Tip: ${tableTipPercent}%`,
      `-------------------------------------`,
      `INDIVIDUAL SHARES:`,
    ];

    individualResults.forEach((f) => {
      const tipNote =
        f.tipType === 'zero'
          ? `(0% tip — paid exact food)`
          : `(Tip: ${formatCurrency(f.tip, currency)} / ${f.effectivePct.toFixed(1)}%)`;
      lines.push(
        `• ${f.name}: ${formatCurrency(f.totalOwed, currency)} [Food: ${formatCurrency(f.spend, currency)} + ${tipNote}]`
      );
    });

    if (remainingBillToCover > 0 && remainingGroupCount > 0) {
      lines.push(
        `• Rest of Group (${remainingGroupCount} people): ${formatCurrency(remainingPerPersonTotal, currency)} each`
      );
      lines.push(
        `  (Covers remaining ${formatCurrency(remainingBillToCover, currency)} bill + ${tableTipPercent}% tip)`
      );
    }

    lines.push(`-------------------------------------`);
    lines.push(`Total Collected: ${formatCurrency(totalCollected, currency)}`);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connected Sync Banner with Equal Split */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Connected to Equal Split</span>
              <span className="text-emerald-400 font-mono-num">
                ({formatCurrency(parsedTotalBill, currency)} bill · {tableTipPercent}% tip)
              </span>
            </div>
            {equalSplitPerPerson > 0 && (
              <p className="text-slate-400">
                In an equal split, each of the {totalEqualPeople} people would pay{' '}
                <strong className="text-white font-mono-num font-semibold">
                  {formatCurrency(equalSplitPerPerson, currency)}
                </strong>
                .
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToEqualTab}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors shrink-0"
        >
          <span>View Equal Split</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Receipt and Individual Input */}
        <div className="lg:col-span-7 space-y-6">
          {/* Total Receipt Bill & Table Tip Rate (Synced with Equal Split) */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Receipt Bill Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="custom-total-bill"
                    className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Total Bill from Receipt</span>
                  </label>
                  <span className="text-[10px] text-emerald-400/90 font-medium">Synced</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base pointer-events-none">
                    {currency.symbol}
                  </span>
                  <input
                    id="custom-total-bill"
                    type="text"
                    inputMode="decimal"
                    value={billInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        onBillInputChange(val);
                      }
                    }}
                    placeholder={`0${currency.decimals > 0 ? '.00' : ''}`}
                    className="w-full h-12 pl-10 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-lg font-bold text-white font-mono-num focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Table Default Tip % */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Table Default Tip %
                  </label>
                  <span className="text-[10px] text-emerald-400/90 font-medium">Synced</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[10, 15, 18, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => onTableTipPercentChange(pct)}
                      className={`h-12 rounded-xl text-xs font-bold transition-all ${
                        tableTipPercent === pct
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Individual Friends List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Friends / Itemized Diners ({friends.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddFriend(true)}
                  className="px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-lg hover:bg-amber-900/40 transition-colors"
                >
                  + Cheap Friend (0%)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddFriend(false)}
                  className="px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-lg hover:bg-emerald-900/40 transition-colors"
                >
                  + Diner
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {friends.map((friend, index) => {
                const res = individualResults[index];
                const differenceFromEqual =
                  equalSplitPerPerson > 0
                    ? equalSplitPerPerson - (res?.totalOwed || 0)
                    : null;

                return (
                  <div
                    key={friend.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={friend.name}
                          onChange={(e) =>
                            handleUpdateFriend(friend.id, {
                              name: e.target.value,
                            })
                          }
                          placeholder="Friend's Name"
                          className="bg-transparent text-sm font-semibold text-white border-b border-transparent hover:border-slate-700 focus:border-emerald-400 focus:outline-none w-full"
                        />
                      </div>
                      {friends.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFriend(friend.id)}
                          aria-label={`Remove ${friend.name}`}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* What they ordered */}
                      <div className="sm:col-span-5">
                        <label className="text-[11px] text-slate-400 block mb-1">
                          What they ordered
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                            {currency.symbol}
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={friend.itemSpend}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                handleUpdateFriend(friend.id, { itemSpend: val });
                              }
                            }}
                            placeholder={`0${currency.decimals > 0 ? '.00' : ''}`}
                            className="w-full h-10 pl-8 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white font-mono-num focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </div>
                      </div>

                      {/* Tip preference */}
                      <div className="sm:col-span-7">
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Their tip on their items
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateFriend(friend.id, {
                                tipType: 'zero',
                                tipValue: '0',
                              })
                            }
                            className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                              friend.tipType === 'zero'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            0% (Cheap)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateFriend(friend.id, {
                                tipType: 'percent',
                                tipValue: tableTipPercent.toString(),
                              })
                            }
                            className={`px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                              friend.tipType === 'percent' &&
                              friend.tipValue === tableTipPercent.toString()
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {tableTipPercent}%
                          </button>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                friend.tipType === 'percent' &&
                                friend.tipValue !== tableTipPercent.toString()
                                  ? friend.tipValue
                                  : ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  handleUpdateFriend(friend.id, {
                                    tipType: 'percent',
                                    tipValue: val,
                                  });
                                }
                              }}
                              placeholder="Custom %"
                              className={`w-full h-9 px-2 text-xs rounded-xl bg-slate-950 border font-mono-num text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 ${
                                friend.tipType === 'percent' &&
                                friend.tipValue !== tableTipPercent.toString() &&
                                friend.tipValue !== ''
                                  ? 'border-emerald-500'
                                  : 'border-slate-800'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Friend's computed bottom strip with Equal Split comparison */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {friend.tipType === 'zero' ? (
                          <span className="text-amber-400 font-medium">
                            🥗 Only pays food, zero tip
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Includes{' '}
                            <strong className="text-slate-300 font-mono-num">
                              {formatCurrency(res?.tip || 0, currency)}
                            </strong>{' '}
                            tip ({res?.effectivePct.toFixed(1)}%)
                          </span>
                        )}

                        {/* Connected comparison vs Equal Split */}
                        {differenceFromEqual !== null && differenceFromEqual > 0.05 && (
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono-num text-[11px]">
                            saves {formatCurrency(differenceFromEqual, currency)} vs equal split
                          </span>
                        )}
                      </div>

                      <span className="font-bold text-white text-sm">
                        Owes:{' '}
                        <span className="text-emerald-400 font-mono-num">
                          {formatCurrency(res?.totalOwed || 0, currency)}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remaining Rest-of-Table Section */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Rest of the Table (Unclaimed Balance)
              </span>
              <span className="text-xs font-mono-num text-slate-400">
                Remaining bill: {formatCurrency(remainingBillToCover, currency)}
              </span>
            </div>

            {remainingBillToCover > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400">
                    Split remaining balance between:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={remainingGroupCount <= 1}
                      onClick={() =>
                        onRemainingGroupCountChange(Math.max(1, remainingGroupCount - 1))
                      }
                      className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 text-white flex items-center justify-center disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-white font-mono-num">
                      {remainingGroupCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onRemainingGroupCountChange(remainingGroupCount + 1)
                      }
                      className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 text-white flex items-center justify-center"
                    >
                      +
                    </button>
                    <span className="text-slate-400 ml-1">people</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-300 font-semibold block">
                      Remaining people pay:
                    </span>
                    <span className="text-slate-500">
                      {formatCurrency(remainingPerPersonSpend, currency)} food + {tableTipPercent}% tip
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-400 font-mono-num">
                      {formatCurrency(remainingPerPersonTotal, currency)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">each</span>
                  </div>
                </div>
              </div>
            ) : remainingOverBill > 0 ? (
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Items sum ({formatCurrency(totalIndividualSpend, currency)}) exceeds the receipt bill by{' '}
                  {formatCurrency(remainingOverBill, currency)}.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>All items matched to the receipt!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Grand Breakdown Card */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-400 tracking-wider">
                ITEMIZED SPLIT TOTAL
              </span>
              <div className="text-4xl font-black text-white font-mono-num">
                {formatCurrency(totalCollected, currency)}
              </div>
              <span className="text-xs text-slate-400">
                Total money collected to cover bill & tips
              </span>
            </div>

            {/* Quick breakdown rows */}
            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Receipt Bill:</span>
                <span className="font-mono-num text-white">
                  {formatCurrency(parsedTotalBill, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Total Tips Combined:</span>
                <span className="font-mono-num text-emerald-400 font-semibold">
                  +{formatCurrency(totalCollected - parsedTotalBill, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Total Table Diners:</span>
                <span className="font-mono-num text-white">
                  {friends.length + (remainingBillToCover > 0 ? remainingGroupCount : 0)} people
                </span>
              </div>
            </div>

            {/* Who Pays What List */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block">
                Who pays what:
              </span>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {individualResults.map((f) => (
                  <div
                    key={f.id}
                    className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">
                        {f.name}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {f.tipType === 'zero' ? (
                          <span className="text-amber-400">0% tip</span>
                        ) : (
                          `${f.effectivePct.toFixed(1)}% tip`
                        )}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 font-mono-num">
                      {formatCurrency(f.totalOwed, currency)}
                    </span>
                  </div>
                ))}

                {remainingBillToCover > 0 && remainingGroupCount > 0 && (
                  <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-emerald-300 block">
                        Rest of group ({remainingGroupCount} people)
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {tableTipPercent}% table tip
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white font-mono-num">
                        {formatCurrency(remainingPerPersonTotal, currency)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">each</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Share & Copy Actions */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Individual Breakdown</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700/90 active:scale-[0.98] border border-slate-700/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Breakdown Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy Text Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Slide-Up Overlay Modal */}
      <ShareBreakdownModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        friends={individualResults}
        currency={currency}
        parsedTotalBill={parsedTotalBill}
        tableTipPercent={tableTipPercent}
        remainingBillToCover={remainingBillToCover}
        remainingGroupCount={remainingGroupCount}
        remainingPerPersonTotal={remainingPerPersonTotal}
        totalCollected={totalCollected}
      />
    </div>
  );
};
