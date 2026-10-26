import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { TipPresets } from './components/TipPresets';
import { PartySplitter } from './components/PartySplitter';
import { MoreOptions } from './components/MoreOptions';
import { ResultsCard } from './components/ResultsCard';
import { CustomSplitter } from './components/CustomSplitter';
import { CalculatorTab, CurrencyInfo, IndividualFriend, TaxTiming, TipMode } from './types';
import { getCurrency } from './utils/currencies';
import { loadPreferences, savePreferences } from './utils/storage';
import { calculateTip } from './utils/calculator';
import { Delete, Scale, Users, ArrowRight } from 'lucide-react';

export default function App() {
  // Active Tab
  const [activeTab, setActiveTab] = useState<CalculatorTab>('equal');

  // Load persistent user preferences
  const initialPrefs = useMemo(() => loadPreferences(), []);
  const [currency, setCurrency] = useState<CurrencyInfo>(() =>
    getCurrency(initialPrefs.currencyCode)
  );
  const [preferredPercent, setPreferredPercent] = useState<number>(
    initialPrefs.preferredTipPercent || 15
  );

  // Bill & Tax Inputs (Shared between both tabs)
  const [billInput, setBillInput] = useState<string>('240');
  const [taxInput, setTaxInput] = useState<string>('');
  const [taxTiming, setTaxTiming] = useState<TaxTiming>('before');

  // Tip Configuration (Shared between both tabs)
  const [tipMode, setTipMode] = useState<TipMode>('percentage');
  const [selectedPercent, setSelectedPercent] = useState<number | null>(
    preferredPercent
  );
  const [customPercent, setCustomPercent] = useState<string>('');
  const [tipAmountInput, setTipAmountInput] = useState<string>('');

  // Lifted friends state (Preserved across tab switches)
  const [friends, setFriends] = useState<IndividualFriend[]>([
    {
      id: '1',
      name: 'Dave (Only had salad)',
      itemSpend: '45',
      tipType: 'zero',
      tipValue: '0',
    },
    {
      id: '2',
      name: 'Sarah',
      itemSpend: '85',
      tipType: 'percent',
      tipValue: preferredPercent.toString(),
    },
  ]);
  const [remainingGroupCount, setRemainingGroupCount] = useState<number>(2);

  // Party Split (Equal Split: 4 total diners by default to match 2 friends + 2 remaining)
  const [people, setPeople] = useState<number>(4);
  const [peopleInput, setPeopleInput] = useState<string>('4');
  const [roundUp, setRoundUp] = useState<boolean>(false);

  // Sync preference updates to localStorage
  useEffect(() => {
    savePreferences({
      currencyCode: currency.code,
      preferredTipPercent: preferredPercent,
    });
  }, [currency.code, preferredPercent]);

  // Numeric parsing
  const parsedBill = parseFloat(billInput) || 0;
  const parsedTax = parseFloat(taxInput) || 0;
  const parsedTipAmount = parseFloat(tipAmountInput) || 0;

  const activeTipPercent = useMemo(() => {
    if (selectedPercent !== null) {
      return selectedPercent;
    }
    const customVal = parseFloat(customPercent);
    return isNaN(customVal) ? 0 : customVal;
  }, [selectedPercent, customPercent]);

  // Run calculation engine for Equal Split
  const calculationResult = useMemo(() => {
    return calculateTip({
      bill: parsedBill,
      tax: parsedTax,
      taxTiming,
      tipMode,
      tipPercent: activeTipPercent,
      tipAmount: parsedTipAmount,
      people,
      roundUp,
      currency,
    });
  }, [
    parsedBill,
    parsedTax,
    taxTiming,
    tipMode,
    activeTipPercent,
    parsedTipAmount,
    people,
    roundUp,
    currency,
  ]);

  // Handle party size changes in Equal Split with bidirectional sync to Cheap Friends
  const handlePeopleChange = (newPeople: number) => {
    setPeople(newPeople);
    setPeopleInput(newPeople.toString());
    const newRemaining = Math.max(1, newPeople - friends.length);
    setRemainingGroupCount(newRemaining);
  };

  // Handle remaining group changes in Cheap Friends with bidirectional sync to Equal Split
  const handleRemainingGroupChange = (newCount: number) => {
    setRemainingGroupCount(newCount);
    const totalDiners = friends.length + newCount;
    setPeople(totalDiners);
    setPeopleInput(totalDiners.toString());
  };

  // Seamless Mode Switcher with value preservation
  const handleTipModeChange = (newMode: TipMode) => {
    if (newMode === tipMode) return;

    if (newMode === 'amount') {
      const currentTipVal = calculationResult.tipAmount;
      setTipAmountInput(
        currentTipVal > 0 ? currentTipVal.toFixed(currency.decimals) : ''
      );
      setTipMode('amount');
    } else {
      const base = calculationResult.tipBase;
      const currentTipVal = calculationResult.tipAmount;

      if (base > 0 && currentTipVal >= 0) {
        const equiv = (currentTipVal / base) * 100;
        const roundedEquiv = parseFloat(equiv.toFixed(1));
        if ([0, 10, 15, 18, 20, 25].includes(roundedEquiv)) {
          setSelectedPercent(roundedEquiv);
          setCustomPercent('');
        } else {
          setSelectedPercent(null);
          setCustomPercent(roundedEquiv.toString());
        }
      } else {
        setSelectedPercent(preferredPercent);
        setCustomPercent('');
      }
      setTipMode('percentage');
    }
  };

  const handleSelectPreset = (pct: number) => {
    setSelectedPercent(pct);
    setCustomPercent('');
    if (pct > 0) {
      setPreferredPercent(pct);
    }
  };

  const handleCustomPercentChange = (val: string) => {
    setSelectedPercent(null);
    setCustomPercent(val);
  };

  const handleCurrencyChange = (newCurr: CurrencyInfo) => {
    setCurrency(newCurr);
  };

  const handleReset = () => {
    setBillInput('');
    setTaxInput('');
    setTipMode('percentage');
    setSelectedPercent(preferredPercent);
    setCustomPercent('');
    setTipAmountInput('');
    setPeople(1);
    setPeopleInput('1');
    setRoundUp(false);
    setFriends([
      {
        id: '1',
        name: 'Friend 1',
        itemSpend: '',
        tipType: 'zero',
        tipValue: '0',
      },
    ]);
    setRemainingGroupCount(1);
  };

  const hasAnyInput =
    billInput !== '' ||
    taxInput !== '' ||
    tipAmountInput !== '' ||
    people > 1 ||
    roundUp ||
    friends.some((f) => f.itemSpend !== '');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <Header
          currentCurrency={currency}
          onReset={handleReset}
          hasInput={hasAnyInput}
        />

        {/* Connected Tab Switcher: Equal Split vs Cheap Friends */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md mx-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('equal')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[42px] ${
                activeTab === 'equal'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Equal Split</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('individual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[42px] relative ${
                activeTab === 'individual'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Cheap Friends Split</span>
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-500 pt-1">
            Bill total and tip rate stay synced across both tabs
          </p>
        </div>

        {/* Tab Content */}
        {activeTab === 'equal' ? (
          /* Equal Split Tab */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Inputs */}
              <section
                aria-label="Calculator inputs"
                className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg space-y-6"
              >
                {/* Bill Amount Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="bill-amount-input"
                      className="text-sm font-semibold text-slate-200"
                    >
                      Bill Amount
                    </label>
                    <span className="text-xs text-slate-400">
                      Includes tax
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400 font-mono-num pointer-events-none">
                      {currency.symbol}
                    </div>
                    <input
                      id="bill-amount-input"
                      type="text"
                      inputMode="decimal"
                      value={billInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setBillInput(val);
                        }
                      }}
                      placeholder={`0${currency.decimals > 0 ? '.00' : ''}`}
                      autoFocus
                      className="w-full h-16 pl-12 pr-12 rounded-2xl bg-slate-950/90 border border-slate-800 text-3xl font-extrabold text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 font-mono-num transition-all"
                    />
                    {billInput !== '' && (
                      <button
                        type="button"
                        onClick={() => setBillInput('')}
                        aria-label="Clear bill amount"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"
                      >
                        <Delete className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tip Selection (Percentage presets / Amount) */}
                <TipPresets
                  tipMode={tipMode}
                  onTipModeChange={handleTipModeChange}
                  selectedPercent={selectedPercent}
                  customPercent={customPercent}
                  onSelectPreset={handleSelectPreset}
                  onCustomPercentChange={handleCustomPercentChange}
                  tipAmountInput={tipAmountInput}
                  onTipAmountInputChange={setTipAmountInput}
                  calculatedTipAmount={calculationResult.tipAmount}
                  equivalentPercent={calculationResult.equivalentPercent}
                  currency={currency}
                  tipBase={calculationResult.tipBase}
                />

                {/* Party Split Controls */}
                <PartySplitter
                  people={people}
                  peopleInput={peopleInput}
                  onPeopleChange={handlePeopleChange}
                  onPeopleInputChange={(val) => {
                    setPeopleInput(val);
                    if (val !== '') {
                      const parsed = parseInt(val, 10);
                      if (parsed >= 1) {
                        handlePeopleChange(parsed);
                      }
                    }
                  }}
                />

                {/* Connected Switcher Callout */}
                {people > 1 && (
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <span className="text-slate-400">
                      Some friends had just a salad or don’t want to tip equally?
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('individual')}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
                    >
                      <span>Itemize in Cheap Friends</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* More Options Collapsible */}
                <MoreOptions
                  taxInput={taxInput}
                  onTaxInputChange={setTaxInput}
                  taxTiming={taxTiming}
                  onTaxTimingChange={setTaxTiming}
                  roundUp={roundUp}
                  onRoundUpToggle={setRoundUp}
                  currency={currency}
                  onCurrencyChange={handleCurrencyChange}
                  billAmount={parsedBill}
                />
              </section>

              {/* Right Column: Live Sticky Summary */}
              <aside
                aria-label="Live calculation results"
                className="lg:col-span-5 lg:sticky lg:top-6"
              >
                <ResultsCard
                  result={calculationResult}
                  currency={currency}
                />
              </aside>
            </div>
          </div>
        ) : (
          /* Cheap Friends / Itemized Split Tab */
          <CustomSplitter
            currency={currency}
            billInput={billInput}
            onBillInputChange={setBillInput}
            tableTipPercent={activeTipPercent}
            onTableTipPercentChange={(pct) => handleSelectPreset(pct)}
            friends={friends}
            onFriendsChange={setFriends}
            remainingGroupCount={remainingGroupCount}
            onRemainingGroupCountChange={handleRemainingGroupChange}
            equalSplitPerPerson={calculationResult.perPersonPrimary}
            totalEqualPeople={people}
            onSwitchToEqualTab={() => setActiveTab('equal')}
          />
        )}
      </main>

      {/* Clean quiet footer */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        Tip Calculator · Client-side precise arithmetic
      </footer>
    </div>
  );
}
