# Tip Calculator — Modern Slate & Emerald

A fast, responsive, and tactile Tip Calculator designed for seamless mobile and desktop use. Built with zero dependencies on external backends or APIs, providing instant real-time currency math, dual tip modes with seamless value preservation, exact uneven split allocation down to the cent, tax handling, and smart round-up logic.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed in Phase 1 and are baked into the core architecture:
> - **Visual Style & Theme**: Modern clean slate with vivid emerald accents (`slate-900`/`slate-50` with high-contrast `emerald-500` metrics and tactile segmented controls).
> - **Default Preselected Currency**: Israeli New Shekel (`ILS`, `₪`, 2 decimal places), while allowing swift switching between major global currencies (USD, EUR, GBP, CAD, AUD, JPY).
> - **Storage Scope**: Selected currency and preferred tip percentage are remembered in browser `localStorage`. Bill, tax, and split amounts are strictly transient for privacy and zero session residue.

---

## 1. Overview & Core Concept

- **What It Does**: Calculates tips and splits restaurant, bar, and service bills instantly in real time. Features dual calculation modes (Percentage presets + custom % vs. exact currency Amount), automatic mode conversion without jumpy values, tax-exclusive/inclusive percentage tip toggling, and an exact cent-distribution breakdown for uneven party splits.
- **Target Audience & Persona**: Diners, groups, service industry patrons, and travelers needing a rapid, frustration-free tool on mobile or desktop that never stalls, never needs a "Calculate" button, and never misplaces a penny.
- **Key Value**: 100% client-side instant responsiveness, tactile touch ergonomics ($\ge 44\text{px}$ targets, mobile `decimal` keypad), zero floating-point rounding bugs, and crystal-clear presentation of who owes what.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Bill Entry**: User taps the large Bill Amount field; on mobile, the numeric decimal keypad appears (`inputMode="decimal"`). The calculation updates on every keystroke.
2. **Tip Selection (Percentage or Amount)**:
   - *Percentage Mode*: Quick-tap preset chips (10%, 15%, 18%, 20%, 25%) or type a custom percentage. Displays the calculated tip amount beneath.
   - *Amount Mode*: Enter an exact tip amount (e.g., ₪20.00). Displays the equivalent tip percentage dynamically.
   - *Switching Modes*: Seamless transition—switching from 15% to Amount sets ₪15.00; switching back converts the current amount into its exact percentage of the bill.
3. **Party Splitting**: Minus and Plus stepper buttons or direct integer entry adjust party size. When split across people, the **Per-Person Payment** becomes the primary visual anchor in high-contrast emerald. If the split does not divide evenly to the cent, an exact breakdown appears (e.g. *"2 people pay ₪18.34 and 1 person pays ₪18.33"*).
4. **More Options (Accordion)**:
   - *Tax Toggle & Input*: Enter optional tax; toggle percentage calculation to apply "Before tax" (deducted from bill base) or "After tax".
   - *Round Up Per Person*: Toggles rounding each person's bill to the next whole currency unit. Clearly separates base tip from the extra round-up remainder, showing the adjusted total and effective tip %.
   - *Currency Selector*: Quickly switches currency formatting and decimal conventions (e.g., JPY 0 decimals, ILS/USD/EUR 2 decimals).
   - *Copy Summary*: Copies a formatted bill receipt to clipboard with instant visual confirmation.
   - *Reset*: Clears bill and tax while safely preserving user preferences.

### Visual Identity & Theme
- **Theme Palette**:
  - Background: Crisp Slate canvas (`bg-slate-50 dark:bg-slate-950`)
  - Surfaces & Cards: Clean elevated cards (`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm`)
  - Accent Color: Emerald (`emerald-600` in light, `emerald-400` in dark) for key totals, active pill tabs, and primary metrics
  - Text Hierarchy: Deep slate (`slate-900 dark:slate-100`) for primary numbers, muted slate (`slate-500 dark:slate-400`) for secondary labels and metadata
- **Typography & Layout**:
  - Display & Numbers: Tabular numerals (`font-mono tabular-nums`) with `tracking-tight` for financial precision.
  - Clean responsive grid: Compact single-column card on mobile ($375\text{px}$–$430\text{px}$), expanding gracefully into a balanced dual-column view on tablet/desktop (`max-w-4xl`) with inputs on the left and live calculation summary on the right.
  - Zero-pill discipline: Metadata uses clean typographic separators (`·`), reserving bordered containers strictly for clickable buttons and segmented controls.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Integer-Cent Arithmetic & Safe Currency Math**
  - *Chosen Approach*: Convert all decimal currency inputs into smallest integer currency units (cents / agorot) before performing splits, rounding, and totals, then format using `Intl.NumberFormat`.
  - *Why*: Eliminates JavaScript binary floating-point anomalies (e.g., `0.1 + 0.2 = 0.30000000000000004`), ensuring the sum of all individual payments always matches the grand total exactly.
  - *Alternatives Considered*: Standard `Math.round(val * 100) / 100` without cent reconciliation, which causes penny discrepancies when splitting amongst 3, 6, or 7 people.

- **Decision 2: Seamless Mode Value Preservation**
  - *Chosen Approach*: Maintain an internal representation of both bill and current absolute tip. When switching from Percentage to Amount, populate the amount input with the exact current tip. When switching from Amount to Percentage, calculate `(tip / base) * 100` and prefill the custom percentage input.
  - *Why*: Prevents jarring shifts in bill totals when users explore different modes.

- **Decision 3: Tax Handling Contract**
  - *Chosen Approach*: The entered bill amount is treated as already including tax. If "Before tax" is selected, the tip percentage is calculated against `(bill - tax)`. The grand total is always `bill + tip`. If tax exceeds the bill, a friendly non-blocking warning is shown.
  - *Why*: Matches typical dining receipts where the final printed subtotal/total includes sales tax, but diners prefer calculating tip only on food & beverages.

- **Decision 4: Transient Bill vs Persistent Preferences**
  - *Chosen Approach*: `localStorage` stores only `selectedCurrency` and `preferredTipPercentage`. Bill, tax, and guest count are kept in React component state.
  - *Why*: Ensures user privacy, prevents accidental stale calculations on next open, and respects user convenience for currency and standard tip habit.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          TipCalculator App                             │
├──────────────────────────────────────┬─────────────────────────────────┤
│           Inputs Panel               │        Live Results Summary     │
│                                      │                                 │
│ ┌──────────────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ Bill Amount (inputMode="decimal")│ │ │ Per Person (Hero Value)     │ │
│ └──────────────────────────────────┘ │ │ (Exact uneven split detail) │ │
│ ┌──────────────────────────────────┐ │ └─────────────────────────────┘ │
│ │ Tip Mode Toggle (% vs Amount)    │ │ ┌─────────────────────────────┐ │
│ │ Presets: 10% 15% 18% 20% 25% Cust│ │ │ Tip Breakdown               │ │
│ │ Equivalent conversion indicator  │ │ │ (Base Tip + Round-up extra) │ │
│ └──────────────────────────────────┘ │ └─────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ Party Split Controls (- [N] +)   │ │ │ Grand Total (Bill + Tip)    │ │
│ └──────────────────────────────────┘ │ └─────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │ ┌─────────────────────────────┐ │
│ │ More Options (Collapsible)       │ │ │ Copy Summary & Reset Button │ │
│ │ • Tax & Before/After Toggle      │ │ └─────────────────────────────┘ │
│ │ • Round Up per person toggle     │ │                                 │
│ │ • Currency Selector (ILS default)│ │                                 │
│ └──────────────────────────────────┘ │                                 │
└──────────────────────────────────────┴─────────────────────────────────┘
                                   │
              ┌────────────────────┴─────────────────────┐
              │  useTipEngine Hook & Math Utilities       │
              │  - Exact cent allocation algorithm       │
              │  - Intl.NumberFormat currency formatter  │
              │  - LocalStorage persistence sync         │
              └──────────────────────────────────────────┘
```

### State Model & Calculations
- `billStr`: string (preserves user typing without jumpy cursors)
- `tipMode`: `'percentage' | 'amount'`
- `tipPercent`: number | null (active preset or custom percent)
- `customPercentStr`: string
- `tipAmountStr`: string
- `people`: number (min 1)
- `taxStr`: string
- `taxTiming`: `'before' | 'after'`
- `roundUp`: boolean
- `currencyCode`: `'ILS' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY'`

### Edge Cases Handled
- **Zero bill or empty string**: Equivalent percentage shows "—", total shows zero formatted currency, no NaN / Infinity.
- **Uneven cent splits**: Distributes leftover agorot/cents so that $N_1$ people pay $\lceil \text{cents}/N \rceil$ and $N_2$ people pay $\lfloor \text{cents}/N \rfloor$.
- **Round-up with split**: Each individual's bill is rounded up to the nearest integer; adjusted total = rounded_per_person $\times$ people; extra tip displayed clearly.
- **Copy summary**: Generates clean, accessible text with full receipt details for messaging apps.
