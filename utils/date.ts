import { RecurringTransaction } from '../types';

export const calculateNextDueDate = (currentDueDate: string, item: Pick<RecurringTransaction, 'interval' | 'frequencyUnit'>): Date => {
  let date = new Date(currentDueDate);
  const interval = item.interval || 1;
  
  switch (item.frequencyUnit) {
    case 'days':
      date.setDate(date.getDate() + interval);
      break;
    case 'weeks':
      date.setDate(date.getDate() + 7 * interval);
      break;
    case 'months':
      date.setMonth(date.getMonth() + interval);
      break;
    case 'years':
      date.setFullYear(date.getFullYear() + interval);
      break;
  }
  return date;
};