import round from 'lodash/round';

const TRILLION = Math.pow(10, 12);
const BILLION = Math.pow(10, 9);
const MILLION = Math.pow(10, 6);

export function formatPrice(value: number): string {
  if (value >= TRILLION) return round(value / TRILLION) + 'kkkk';
  if (value >= BILLION) return round(value / BILLION) + 'kkk';
  if (value >= MILLION) return round(value / MILLION) + 'kk';
  return value.toLocaleString();
}

export function parsePrice(value: string): number {
  const kRegex = /к|k/g;
  const kMatch = value.match(kRegex);

  if (kMatch) {
    const valueWithoutK = parseFloat(
      parseFloat(value.replace(kRegex, '')).toFixed(kMatch.length)
    );
    return valueWithoutK * Math.pow(1000, kMatch.length);
  } else {
    return parseInt(value, 10);
  }
}
