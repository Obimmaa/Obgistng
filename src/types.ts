/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  baseCurrency: string;
  category: string;
  type: TransactionType;
  date: string;
  notes: string;
  walletId?: string;
  fromWalletId?: string;
  toWalletId?: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  currency: string;
  period: 'weekly' | 'monthly';
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: 'cash' | 'bank' | 'savings' | 'investment';
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export const CATEGORIES = [
  { id: 'food', name: 'Food & Drinks', icon: 'Utensils' },
  { id: 'transport', name: 'Transport', icon: 'Car' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'ReceiptText' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Tv' },
  { id: 'health', name: 'Health', icon: 'HeartPulse' },
  { id: 'education', name: 'Education', icon: 'GraduationCap' },
  { id: 'salary', name: 'Salary', icon: 'Wallet' },
  { id: 'investment', name: 'Investment', icon: 'TrendingUp' },
  { id: 'other', name: 'Other', icon: 'CircleEllipsis' },
];
