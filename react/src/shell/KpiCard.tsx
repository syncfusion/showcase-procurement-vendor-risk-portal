// KPI card on the Syncfusion Card.
import type { ReactNode } from 'react';
import type { Tone } from '../theme/tone';

const ICON_BG: Record<Tone, string> = {
  success: 'app-kpi-icon--success', warning: 'app-kpi-icon--warning', danger: 'app-kpi-icon--danger',
  info: 'app-kpi-icon--info', neutral: 'app-kpi-icon--neutral'
};

export function KpiCard({ title, value, note, tone = 'neutral', icon, action }: {
  title: string; value: string; note?: string; tone?: Tone; icon?: ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  const body = (
    <>
      <div className="e-card-header">
        <div className="e-card-header-caption">
          <p className="e-card-header-title">{title}</p>
        </div>
        <span className={`app-kpi-icon ${ICON_BG[tone]}`} aria-hidden="true">{icon}</span>
      </div>
      <div className="e-card-content">
        <div className="app-kpi-value">{value}</div>
        <div className="app-kpi-note">{note}</div>
      </div>
    </>
  );
  if (action) {
    return <button type="button" className="e-card app-kpi app-kpi-link" aria-label={`${action.label}: ${title}`} onClick={action.onClick}>{body}</button>;
  }
  return <div className="e-card app-kpi">{body}</div>;
}
