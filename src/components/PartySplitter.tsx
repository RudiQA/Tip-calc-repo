import React from 'react';
import { Minus, Plus, Users } from 'lucide-react';

interface PartySplitterProps {
  people: number;
  peopleInput: string;
  onPeopleChange: (val: number) => void;
  onPeopleInputChange: (val: string) => void;
}

export const PartySplitter: React.FC<PartySplitterProps> = ({
  people,
  peopleInput,
  onPeopleChange,
  onPeopleInputChange,
}) => {
  const handleDecrement = () => {
    if (people > 1) {
      const next = people - 1;
      onPeopleChange(next);
      onPeopleInputChange(next.toString());
    }
  };

  const handleIncrement = () => {
    const next = people + 1;
    onPeopleChange(next);
    onPeopleInputChange(next.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow typing only positive integers
    if (raw === '' || /^\d+$/.test(raw)) {
      onPeopleInputChange(raw);
      if (raw !== '') {
        const parsed = parseInt(raw, 10);
        if (parsed >= 1) {
          onPeopleChange(parsed);
        }
      }
    }
  };

  const handleBlur = () => {
    if (peopleInput === '' || parseInt(peopleInput, 10) < 1) {
      onPeopleChange(1);
      onPeopleInputChange('1');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="people-input" className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Split Between</span>
        </label>
        <span className="text-xs text-slate-400">
          {people === 1 ? 'Individual bill' : `${people} people sharing`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={people <= 1}
          aria-label="Decrease number of people"
          className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center text-slate-200 border border-slate-700/70 transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Editable People Input */}
        <div className="relative flex-1">
          <input
            id="people-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={peopleInput}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-full h-12 text-center text-lg font-bold text-white bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 font-mono-num transition-all"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium pointer-events-none hidden sm:inline">
            {people === 1 ? 'person' : 'people'}
          </span>
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          aria-label="Increase number of people"
          className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-200 border border-slate-700/70 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Party Presets */}
      <div className="flex items-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5, 6].map((count) => (
          <button
            key={count}
            type="button"
            onClick={() => {
              onPeopleChange(count);
              onPeopleInputChange(count.toString());
            }}
            className={`flex-1 py-1 text-xs font-medium rounded-lg transition-all ${
              people === count
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-transparent'
            }`}
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  );
};
