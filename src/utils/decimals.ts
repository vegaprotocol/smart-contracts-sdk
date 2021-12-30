import BigNumber from 'bignumber.js';

export function addDecimal(value: BigNumber, decimals: number): BigNumber {
  return value.dividedBy(Math.pow(10, decimals)).decimalPlaces(decimals);
}
export function removeDecimal(value: BigNumber, decimals: number): BigNumber {
  return value.times(Math.pow(10, decimals));
}
