// Colours that Charts paint in SVG
// The chart theme draws axes, gridlines, the tooltip, and the legend. Series colours come from here.
import type { Tone } from './tone';

export type AppTheme = 'light' | 'dark';

export interface Palette {
  success: string;
  warning: string;
  danger: string;
  info: string;
  neutral: string;
  /** A target line: judges nothing; drawn dashed. */
  reference: string;
  /** Eight vivid category colours (blue, teal, fuchsia, slate, sky, cyan, purple, indigo). */
  series: [string, string, string, string, string, string, string, string];
}

const PALETTES: Record<AppTheme, Palette> = {
  light: {
    success: '#027a48', warning: '#b54708', danger: '#b42318', info: '#175cd3', neutral: '#667085', reference: '#667085',
    series: ['#3b82f6', '#0d9488', '#a21caf', '#334155', '#0369a1', '#0891b2', '#a855f7', '#4f46e5']
  },
  dark: {
    success: '#86efac', warning: '#fbbf24', danger: '#fca5a5', info: '#93c5fd', neutral: '#94a3b8', reference: '#94a3b8',
    series: ['#3b82f6', '#2dd4bf', '#e879f9', '#64748b', '#0ea5e9', '#22d3ee', '#a855f7', '#6366f1']
  }
};

export const palette = (theme: AppTheme): Palette => PALETTES[theme];

/** The Syncfusion chart theme name for the frame (Tailwind / TailwindDark). */
export const chartTheme = (theme: AppTheme): string => (theme === 'dark' ? 'TailwindDark' : 'Tailwind');

export interface Band { min?: number; tone: Tone; label?: string }
export function bandFor(value: number, bands: Band[]): Band {
  return bands.find((band) => band.min === undefined || value >= band.min) ?? bands[bands.length - 1];
}