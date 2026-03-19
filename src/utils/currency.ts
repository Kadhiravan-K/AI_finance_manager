export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const parseCurrencyString = (value: string) => {
  return parseFloat(value.replace(/[^0-9.-]+/g, ""));
};
