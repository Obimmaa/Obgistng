/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MOCK_EXCHANGE_RATES } from '../lib/utils';

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  // In a real app, you would fetch from an API like:
  // const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
  // const data = await response.json();
  // const rate = data.rates[to];
  
  // Using mock rates relative to NGN for demo
  const fromRateInNGN = MOCK_EXCHANGE_RATES[from] || 1;
  const toRateInNGN = MOCK_EXCHANGE_RATES[to] || 1;
  
  // amount * (from -> NGN) / (to -> NGN)
  const amountInNGN = amount * fromRateInNGN;
  const convertedAmount = amountInNGN / toRateInNGN;
  
  return convertedAmount;
}

export function getFallbackRates() {
  return MOCK_EXCHANGE_RATES;
}
