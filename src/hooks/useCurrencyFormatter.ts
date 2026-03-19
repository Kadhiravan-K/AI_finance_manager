import { useCallback } from 'react';
import { useAppContext } from './useAppContext';

export const useCurrencyFormatter = () => {
  const { settings } = useAppContext();
  const currency = settings.currency || 'USD';

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, [currency]);

  return { formatCurrency };
};
