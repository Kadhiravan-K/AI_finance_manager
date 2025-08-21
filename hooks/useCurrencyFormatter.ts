import { useContext, useMemo } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { getCurrencyFormatter } from '../utils/currency';

export function useCurrencyFormatter(options?: Intl.NumberFormatOptions) {
  const { settings } = useContext(SettingsContext);

  const formatter = useMemo(() => {
    return getCurrencyFormatter(settings.currency, options);
  }, [settings.currency, options]);

  return formatter.format;
}