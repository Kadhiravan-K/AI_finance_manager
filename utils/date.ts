import { Frequency, MonthlyRepetition } from '../types';

export const calculateNextDueDate = (currentDueDate: string, frequency: Frequency, repetitionDays?: number[], monthlyRepetition?: MonthlyRepetition): Date => {
  let date = new Date(currentDueDate);
  
  switch (frequency) {
    case 'daily':
        if (repetitionDays && repetitionDays.length > 0) {
            let currentDay = date.getDay();
            let nextDay = -1;
            // Find the next scheduled day after the current one
            for(const day of repetitionDays) {
                if(day > currentDay) { nextDay = day; break; }
            }
            // If no day found in the rest of the week, wrap to the first day of next week
            if(nextDay === -1) nextDay = repetitionDays[0];

            const daysUntilNext = (nextDay - currentDay + 7) % 7;
            date.setDate(date.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
        } else {
            date.setDate(date.getDate() + 1);
        }
        break;
        
    case 'weekly':
        if (repetitionDays && repetitionDays.length > 0) {
            let currentDay = date.getDay();
            let nextDay = -1;
            for(const day of repetitionDays) {
                if(day > currentDay) { nextDay = day; break; }
            }
            if(nextDay === -1) nextDay = repetitionDays[0];

            const daysUntilNext = (nextDay - currentDay + 7) % 7;
            date.setDate(date.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
        } else {
             date.setDate(date.getDate() + 7);
        }
        break;

    case 'monthly':
      let monthsToAdd = 1;
      switch(monthlyRepetition) {
          case 'every_2': monthsToAdd = 2; break;
          case 'every_3': monthsToAdd = 3; break;
          case 'every_6': monthsToAdd = 6; break;
      }
      date.setMonth(date.getMonth() + monthsToAdd);
      break;

    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date;
};