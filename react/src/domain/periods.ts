// Reporting periods derived from the months present in the fixture.
// The period control is a DropDownList of whole periods. Score history is monthly,
// so the user picks a reporting period rather than a date range on a calendar.

export type PeriodOption = { value: string; text: string; group: string };

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const label = (month: string) => monthFormat.format(new Date(`${month}-01T00:00:00Z`));
const parts = (month: string) => month.split('-').map(Number) as [number, number];
const shift = (month: string, by: number) => {
  const [y, m] = parts(month);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

/**
 * Every whole period the data covers, newest first, as DropDownList options
 * ({ value, text, group }). Quarters group the months they contain.
 */
export function periodOptions(months: string[]): PeriodOption[] {
  const sorted = [...months].sort().reverse(); // newest first
  const options: PeriodOption[] = [];
  let quarter = '';
  for (const month of sorted) {
    const [y, m] = parts(month);
    const q = `Q${Math.ceil(m / 3)} ${y}`;
    if (q !== quarter) { quarter = q; options.push({ value: `quarter:${month}`, text: `${q} (to ${label(month)})`, group: 'Quarters' }); }
    options.push({ value: `month:${month}`, text: label(month), group: 'Months' });
  }
  return options;
}

/** The months a period value covers ('month:YYYY-MM' or 'quarter:YYYY-MM'), ascending. */
export function monthsInPeriod(value: string, months: string[]): string[] {
  const kind = value.slice(0, value.indexOf(':'));
  const anchor = value.slice(value.indexOf(':') + 1);
  if (kind === 'month') return [anchor];
  const [y] = parts(anchor);
  const q = Number(anchor.slice(1 + value.indexOf('Q'))); // not used; quarters derive below
  void q;
  // A quarter option's value is its newest month; derive the quarter's months from months.
  const anchorMonth = parts(anchor)[1];
  const startMonth = anchorMonth - ((anchorMonth - 1) % 3);
  return months.filter((m) => {
    const [my, mm] = parts(m);
    return my === y && mm >= startMonth && mm <= startMonth + 2;
  }).sort();
}

/** Default period: the latest complete quarter's newest month. */
export function defaultPeriod(months: string[]): string {
  const options = periodOptions(months);
  return options.find((o) => o.group === 'Quarters')?.value ?? options[0]?.value ?? '';
}