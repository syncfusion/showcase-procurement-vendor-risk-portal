// Status tones for values that are judged. Category series use the chart palette instead.
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Badge classes per tone (whole literals, defined in app.css). */
export const TONE_BADGE: Record<Tone, string> = {
  success: 'app-badge app-badge--success',
  warning: 'app-badge app-badge--warning',
  danger: 'app-badge app-badge--danger',
  info: 'app-badge app-badge--info',
  neutral: 'app-badge app-badge--neutral'
};

/** First band with a defined min that the score meets or exceeds; otherwise the last band. */
export interface RiskBand { label: string; tone: Tone; min: number | undefined }
export const RISK_BANDS: RiskBand[] = [
  { label: 'Low', tone: 'success', min: 75 },
  { label: 'Watch', tone: 'warning', min: 50 },
  { label: 'Critical', tone: 'danger', min: undefined }
];

export function riskBand(score: number): RiskBand {
  return RISK_BANDS.find((band) => band.min !== undefined && score >= band.min) ?? RISK_BANDS[RISK_BANDS.length - 1];
}