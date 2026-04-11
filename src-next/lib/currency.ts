// Currency conversion utilities for Indian market

export const USD_TO_INR_RATE = 83; // Current conversion rate

/**
 * Convert USD price to INR
 * @param usdPrice - Price in USD
 * @returns Price in INR
 */
export const convertToINR = (usdPrice: number): number => {
  return usdPrice * USD_TO_INR_RATE;
};

/**
 * Format price in INR with proper symbol and formatting
 * @param usdPrice - Price in USD
 * @param options - Formatting options
 * @returns Formatted INR price string
 */
export const formatINR = (usdPrice: number, options: {
  showSymbol?: boolean;
  decimals?: number;
} = {}): string => {
  const { showSymbol = true, decimals = 2 } = options;
  const inrPrice = convertToINR(usdPrice);
  
  if (showSymbol) {
    return `₹${inrPrice.toFixed(decimals)}`;
  }
  
  return inrPrice.toFixed(decimals);
};

/**
 * Format currency for display in Indian format
 * @param amount - Amount in INR
 * @param showSymbol - Whether to show the ₹ symbol
 * @returns Formatted Indian currency string
 */
export const formatIndianCurrency = (amount: number, showSymbol: boolean = true): string => {
  const formatted = amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
  
  return showSymbol ? `₹${formatted}` : formatted;
};
