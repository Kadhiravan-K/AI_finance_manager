import { useContext, useMemo } from 'react';
// Fix: Corrected import path for context
import { SettingsContext } from '../contexts/SettingsContext';
import { getCurrencyFormatter } from '../utils/currency';

export function useCurrencyFormatter(options?: Intl.NumberFormatOptions, currencyOverride?: string) {
  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) throw new Error("useCurrencyFormatter must be used within a SettingsProvider");
  const { settings } = settingsContext;

  const formatter = useMemo(() => {
    return getCurrencyFormatter(currencyOverride || settings.currency, options);
  }, [settings.currency, options, currencyOverride]);

  return formatter.format;
}