/**
 * BigInt Utilities
 * 
 * Helper functions for working with BigInt values in a game context.
 * Since JSON doesn't support BigInt directly, we store them as strings
 * and convert when needed.
 * 
 * IMPORTANT: Values that can exceed Number.MAX_SAFE_INTEGER (2^53-1)
 * should be handled as strings at boundaries (save/load/network) and
 * converted to BigInt only for calculations.
 */

/**
 * Converts a value (number, string, or BigInt) to BigInt safely
 * 
 * WARNING: For numbers, this is only safe up to Number.MAX_SAFE_INTEGER (2^53-1).
 * For values that might exceed this, use string inputs instead.
 * 
 * @param value - Value to convert (number, string, or BigInt)
 * @returns BigInt representation
 */
export function toBigInt(value: number | string | bigint): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'string') {
    try {
      return BigInt(value);
    } catch {
      // For UI/display code, 0n is acceptable fallback
      // But for save/load, this should throw - see stringToBigInt
      return BigInt(0);
    }
  }
  // Number: WARNING - only safe up to Number.MAX_SAFE_INTEGER
  // For values that might exceed this, the number is already imprecise
  return BigInt(Math.floor(value));
}

/**
 * Converts a BigInt to string for JSON serialization
 * 
 * @param value - BigInt value to convert
 * @returns String representation
 */
export function bigIntToString(value: bigint): string {
  return value.toString();
}

/**
 * Converts a string (from JSON) to BigInt with strict validation
 * 
 * IMPORTANT: This is used in save/load paths. Parsing failures indicate
 * data corruption and should not be silently ignored.
 * 
 * @param value - String value to convert
 * @returns BigInt representation
 * @throws Error if the string is invalid (data corruption)
 */
export function stringToBigInt(value: string | undefined | null): bigint {
  if (!value) {
    throw new Error('[BigIntUtils] stringToBigInt: Cannot convert empty/null/undefined value to BigInt');
  }
  
  // Validate format: must be a valid integer string
  if (!/^-?\d+$/.test(value)) {
    throw new Error(`[BigIntUtils] stringToBigInt: Invalid BigInt string format: "${value}"`);
  }
  
  try {
    return BigInt(value);
  } catch (error) {
    throw new Error(`[BigIntUtils] stringToBigInt: Failed to convert "${value}" to BigInt: ${error}`);
  }
}

/**
 * Converts a BigInt to number for calculations that require floats (e.g., damage formulas)
 * 
 * WARNING: This will lose precision for values > Number.MAX_SAFE_INTEGER (2^53-1).
 * For values beyond Number.MAX_VALUE (~1.8e+308), this will return Infinity.
 * 
 * USE ONLY FOR:
 * - Display formatting (with understanding of precision loss)
 * - Damage/formula calculations that require floats (accept precision loss)
 * - Approximate comparisons
 * 
 * DO NOT USE FOR:
 * - Exact economy calculations
 * - Save/load operations
 * - Any operation requiring precision
 * 
 * @param value - BigInt value to convert
 * @returns Number representation (may lose precision for large values)
 */
export function bigIntToNumber(value: bigint): number {
  // For values within safe integer range, use Number directly
  if (value <= BigInt(Number.MAX_SAFE_INTEGER) && value >= BigInt(-Number.MAX_SAFE_INTEGER)) {
    return Number(value);
  }
  
  // For very large values, use Number() which may lose precision
  // This is acceptable for damage calculations that use exponential formulas
  return Number(value);
}

/**
 * Formats a BigInt value as a string with K/M/B/T/Qd/Qn/Sx/Sp/Oc/No/De/UDe/DDe/TDe suffixes for display
 *
 * Handles negative values correctly and provides rounding for cleaner display.
 *
 * @param value - BigInt value to format
 * @returns Formatted string (e.g., "1.5K", "2.3M", "1.2B", "5.4T")
 */
export function formatBigInt(value: bigint): string {
  const isNegative = value < 0n;
  const absValue = isNegative ? -value : value;
  const str = absValue.toString();
  const len = str.length;

  // Zero or very small values
  if (len <= 3) {
    return isNegative ? `-${str}` : str;
  }

  const suffixes: { pow: number; suffix: string }[] = [
    { pow: 42, suffix: 'TDe' },
    { pow: 39, suffix: 'DDe' },
    { pow: 36, suffix: 'UDe' },
    { pow: 33, suffix: 'De' },
    { pow: 30, suffix: 'No' },
    { pow: 27, suffix: 'Oc' },
    { pow: 24, suffix: 'Sp' },
    { pow: 21, suffix: 'Sx' },
    { pow: 18, suffix: 'Qn' },
    { pow: 15, suffix: 'Qd' },
    { pow: 12, suffix: 'T' },
    { pow: 9, suffix: 'B' },
    { pow: 6, suffix: 'M' },
    { pow: 3, suffix: 'K' },
  ];

  const formatWithSuffix = (pow: number, suffix: string): string => {
    const wholeLen = len - pow;
    const wholePart = str.slice(0, wholeLen);
    const decimalDigit = str.slice(wholeLen, wholeLen + 1);

    let formatted = wholePart;
    if (decimalDigit && decimalDigit !== '0') {
      formatted += `.${decimalDigit}`;
    }

    const result = formatted + suffix;
    return isNegative ? `-${result}` : result;
  };

  for (const { pow, suffix } of suffixes) {
    if (len > pow) {
      return formatWithSuffix(pow, suffix);
    }
  }

  return isNegative ? `-${str}` : str;
}
