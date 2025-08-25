import { useContext, useMemo } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { getCurrencyFormatter } from '../utils/currency';

export function useCurrencyFormatter(options?: Intl.NumberFormatOptions, currencyOverride?: string) {
  const { settings } = useContext(SettingsContext);

  const formatter = useMemo(() => {
    return getCurrencyFormatter(currencyOverride || settings.currency, options);
  }, [settings.currency, options, currencyOverride]);

  return formatter.format;
}