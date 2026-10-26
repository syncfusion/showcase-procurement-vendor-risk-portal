// In-memory session shared by every view. Reset restores the shipped fixture.
// A visitor can simulate approvals and edits here. Nothing is written to shared data or to disk.
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { fixture, type Approval, type Stage, type Vendor } from '../data/loader';

export interface Filters {
  region: string | null;      // null = all
  riskBand: string | null;    // 'Low' | 'Watch' | 'Critical' | null
  period: string;             // period option value ('quarter:YYYY-MM' | 'month:YYYY-MM')
  vendorCategoryId: string | null; // set from the tree or a dashboard chip
  selectedVendorId: string | null;
}

export interface SessionState {
  theme: 'light' | 'dark';
  filters: Filters;
  vendors: Vendor[];          // session copy (band overrides land here)
  approvals: Approval[];      // session copy (stage moves land here)
}

export type SessionAction =
  | { type: 'set-theme'; theme: 'light' | 'dark' }
  | { type: 'set-filter'; key: keyof Omit<Filters, 'period'>; value: string | null }
  | { type: 'set-period'; period: string }
  | { type: 'reset-filters' }
  | { type: 'select-vendor'; vendorId: string | null }
  | { type: 'override-band'; vendorId: string; band: 'Low' | 'Watch' | 'Critical' | null }
  | { type: 'move-stage'; approvalId: string; to: Stage; note: string; actor: string }
  | { type: 'reset' };

const initial = (): SessionState => {
  const f = fixture();
  return {
    theme: (typeof document !== 'undefined' && document.documentElement.dataset.theme) === 'dark' ? 'dark' : 'light',
    filters: { region: null, riskBand: null, period: '', vendorCategoryId: null, selectedVendorId: 'vendor-01' },
    vendors: f.vendors.map((v) => ({ ...v })),
    approvals: f.approvals.map((a) => ({ ...a, checklist: a.checklist.map((c) => ({ ...c })), auditTrail: a.auditTrail.map((t) => ({ ...t })) }))
  };
};

const STAGES: Stage[] = ['Submitted', 'Risk Review', 'Compliance Review', 'Category Approval', 'Approved'];

export function allowedMoves(stage: Stage): Stage[] {
  const i = STAGES.indexOf(stage);
  if (stage === 'Approved') return [stage];                       // closed: lists only itself
  const moves: Stage[] = [STAGES[i + 1]];                         // forward exactly one
  if (stage === 'Risk Review') moves.push('Submitted');           // back only from Risk Review
  return moves;
}

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'set-theme':
      return { ...state, theme: action.theme };
    case 'set-filter':
      return { ...state, filters: { ...state.filters, [action.key]: action.value } };
    case 'set-period':
      return { ...state, filters: { ...state.filters, period: action.period } };
    case 'reset-filters':
      return { ...state, filters: { ...state.filters, region: null, riskBand: null, vendorCategoryId: null } };
    case 'select-vendor':
      return { ...state, filters: { ...state.filters, selectedVendorId: action.vendorId } };
    case 'override-band': {
      const vendors = state.vendors.map((v) => v.id === action.vendorId ? { ...v } : v);
      if (action.band !== null) {
        const target = vendors.find((v) => v.id === action.vendorId);
        if (target) {
          const score = action.band === 'Low' ? 80 : action.band === 'Watch' ? 60 : 40;
          target.compositeRiskScore = score;
        }
      } else {
        const baseline = fixture().vendors.find((v) => v.id === action.vendorId);
        const target = vendors.find((v) => v.id === action.vendorId);
        if (baseline && target) target.compositeRiskScore = baseline.compositeRiskScore;
      }
      return { ...state, vendors };
    }
    case 'move-stage': {
      const approvals = state.approvals.map((a) => {
        if (a.id !== action.approvalId) return a;
        if (!allowedMoves(a.stage).includes(action.to)) return a;  // illegal move ignored
        const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '/') + ' ' +
          new Date().toTimeString().slice(0, 5);
        const noteSuffix = action.note ? ` — ${action.note}` : '';
        return { ...a, stage: action.to, auditTrail: [...a.auditTrail, { ts, actor: action.actor, action: `Moved to ${action.to}${noteSuffix}` }] };
      });
      const vendors = state.vendors.map((v) => {
        const moved = approvals.find((a) => a.vendorId === v.id && a.id === action.approvalId);
        return moved ? { ...v } : v;
      });
      void vendors;
      return { ...state, approvals };
    }
    case 'reset':
      return initial();
    default:
      return state;
  }
}

const SessionContext = createContext<{ state: SessionState; dispatch: (a: SessionAction) => void } | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession outside SessionProvider');
  return ctx;
}