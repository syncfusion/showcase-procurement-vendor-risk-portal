// One formatting module for every number and date the app shows:
//   KPI card value, chart axis  -> compactMoney: $6.89M    counts -> count: 12,500
//   tooltip, Grid cell          -> money: $1,691,064        ratio -> percent: 39.8%   month -> monthLabel: Sep 2026

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const fixed = (digits: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Full money with separators: tooltips, Grid cells, sentences. $1,691,064 */
export const money = (value: number): string => usd.format(value);

/** Counts with separators. 12,500 */
export const count = (value: number): string => whole.format(value);

/** A ratio (0.398) as a percentage. 39.8% */
export const percent = (ratio: number, digits = 1): string =>
  new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: digits }).format(ratio);

/** Money in millions/billions, three significant figures: KPI cards and chart axes. $6.89M, $1.2B; under a million stays full. */
export function compactMoney(value: number): string {
  const sign = value < 0 ? '-' : '', absolute = Math.abs(value);
  if (absolute >= 1e9) return `${sign}$${fixed(absolute >= 1e10 ? 0 : 1).format(absolute / 1e9)}B`;
  if (absolute >= 1e6) return `${sign}$${fixed(absolute < 1e7 ? 2 : absolute < 1e8 ? 1 : 0).format(absolute / 1e6)}M`;
  return money(value);
}

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** 'YYYY-MM' as a chart or preset label. Sep 2026 */
export const monthLabel = (month: string): string => monthFormat.format(new Date(`${month}-01T00:00:00Z`));

/** A date in prose and tooltips. Sep 15, 2026 */
export const dateLabel = (date: Date): string => dayFormat.format(date);

/** Parse a fixture date ('YYYY-MM-DD') in UTC so display is stable. */
export const parseDate = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

/** Display format for Syncfusion date pickers: en-US MM/dd/yyyy. */
export const DATE_FORMAT = 'MM/dd/yyyy';

/** Syncfusion format strings for Grid columns (format=). */
export const SYNCFUSION_FORMATS = { money: 'C0', count: 'N0', percent: 'P1' } as const;

/** MM/dd/yyyy for a fixture ISO date (the app's en-US display form). */
export function displayDate(iso: string): string {
  const d = parseDate(iso);
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

/** Days from (or to) a fixture date vs demo-today; negative means past. */
export function daysFrom(base: string, iso: string): number {
  return Math.round((parseDate(iso).getTime() - parseDate(base).getTime()) / 86400000);
}