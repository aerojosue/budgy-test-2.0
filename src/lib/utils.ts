import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Decimal from 'decimal.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    ARS: '$',
    BRL: 'R$',
    MXN: '$',
    COP: '$',
    BTC: '₿',
    ETH: 'Ξ',
  };

  const symbol = currencySymbols[currency] || currency;

  return `${symbol}${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateWithDecimal(
  operation: 'add' | 'subtract' | 'multiply' | 'divide',
  a: number | string,
  b: number | string
): string {
  const decimalA = new Decimal(a);
  const decimalB = new Decimal(b);

  switch (operation) {
    case 'add':
      return decimalA.plus(decimalB).toString();
    case 'subtract':
      return decimalA.minus(decimalB).toString();
    case 'multiply':
      return decimalA.times(decimalB).toString();
    case 'divide':
      return decimalA.dividedBy(decimalB).toString();
    default:
      return '0';
  }
}

export function convertCurrency(
  amount: number | string,
  rate: number | string
): string {
  return calculateWithDecimal('multiply', amount, rate);
}
