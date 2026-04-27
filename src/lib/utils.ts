import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencyCode: string = 'NGN'): string {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export const MOCK_EXCHANGE_RATES: Record<string, number> = {
  'USD': 1500, // 1 USD = 1500 NGN (approximate current volatile rate)
  'EUR': 1600,
  'GBP': 1900,
  'CAD': 1100,
  'INR': 18,
  'NGN': 1,
};
