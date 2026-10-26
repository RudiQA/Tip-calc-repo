import { UserPreferences } from '../types';

const STORAGE_KEY = 'tip_calc_preferences_v1';

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currencyCode: typeof parsed.currencyCode === 'string' ? parsed.currencyCode : 'ILS',
        preferredTipPercent: typeof parsed.preferredTipPercent === 'number' ? parsed.preferredTipPercent : 15,
      };
    }
  } catch (e) {
    console.error('Failed to load user preferences from localStorage:', e);
  }
  return {
    currencyCode: 'ILS',
    preferredTipPercent: 15,
  };
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save user preferences to localStorage:', e);
  }
}
