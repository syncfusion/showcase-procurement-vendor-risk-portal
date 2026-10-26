// `/ai` AI Assistant. Syncfusion AI AssistView calls the mock provider below.
// Prompts use the current session. Responses are labelled as simulated.
import { useMemo, useRef } from 'react';
import { AIAssistViewComponent } from '@syncfusion/ej2-react-interactive-chat';
import { useSession } from '../domain/session';
import { fixture } from '../data/loader';
import * as S from '../domain/selectors';
import { compactMoney, count, displayDate, money, monthLabel } from '../domain/format';
import { demoToday } from '../data/loader';
import { daysFrom } from '../domain/format';

interface AiProvider {
  respond(prompt: string, session: SessionSnapshot, signal: AbortSignal): Promise<string>;
}

interface SessionSnapshot {
  region: string | null; band: string | null; period: string;
  vendors: ReturnType<typeof useSession>['state']['vendors'];
  approvals: ReturnType<typeof useSession>['state']['approvals'];
  certificates: ReturnType<typeof fixture>['certificates'];
}

// Mock answers for the sample data. Replace this provider to call a real model; the AssistView stays the same.
const sampleProvider: AiProvider = {
  async respond(prompt, snap, signal) {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, 900);
      signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('aborted', 'AbortError')); });
    });
    const p = prompt.toLowerCase();
    const scope = snap.region ? `region ${snap.region}` : 'all regions';
    if (p.includes('band') || p.includes('riskiest') || p.includes('high-risk')) {
      const top = [...snap.vendors].sort((a, b) => b.compositeRiskScore - a.compositeRiskScore).slice(0, 5)
        .map(v => `${v.name} — score ${v.compositeRiskScore} (${S.riskBandLabel(v.compositeRiskScore)})`).join('; ');
      return `Sample AI (simulated) — scope: current session filters (${scope}${snap.band ? `, band ${snap.band}` : ''}). Highest composite risk scores: ${top}.`;
    }
    if (p.includes('spend')) {
      const spend = S.spendUnderManagement(snap.vendors);
      const critical = snap.vendors.filter(v => S.riskBandLabel(v.compositeRiskScore) === 'Critical');
      const criticalSpend = critical.reduce((s, v) => s + v.annualSpend, 0);
      return `Sample AI (simulated) — spend under management in scope (${scope}): ${money(spend)}. ${count(critical.length)} Critical-band vendors account for ${compactMoney(criticalSpend)}.`;
    }
    if (p.includes('expir') || p.includes('certificate')) {
      const expiring = snap.certificates.filter(c => snap.vendors.some(v => v.id === c.vendorId) && S.expiringSoon(c.expiresOn));
      const list = expiring.slice(0, 6).map(c => {
        const v = snap.vendors.find(x => x.id === c.vendorId);
        return `${v?.name ?? c.vendorId} — ${c.type}, expires ${displayDate(c.expiresOn)} (${daysFrom(demoToday, c.expiresOn)}d)`;
      }).join('; ');
      return `Sample AI (simulated) — certificates expiring within 60 days of ${displayDate(demoToday)}: ${list || 'none in scope'}.`;
    }
    if (p.includes('approv') || p.includes('onboarding') || p.includes('stage')) {
      const byStage = S.approvalsByStage(snap.approvals).map(s => `${s.stage}: ${s.count}`).join(', ');
      return `Sample AI (simulated) — onboarding pipeline in scope: ${byStage}. ${count(S.pendingApprovals(snap.approvals))} records are in a non-final stage. Moves are session-only in this public profile.`;
    }
    return `Sample AI (simulated) — I can answer about high-risk vendors, spend by region, certificates expiring within 60 days, or the onboarding approval pipeline. Current scope: ${scope}, period ${snap.period ? monthLabel(snap.period.split(':')[1]) : 'default'}. Ask, for example: "Which vendors are in the Critical band?"`;
  }
};

const PROMPTS = [
  'Which vendors moved up a risk band this quarter?',
  'Summarize high-risk spend by region',
  'Which certificates expire within 60 days?',
  'Draft an onboarding note for a Risk Review vendor'
];

export default function Ai() {
  const { state } = useSession();
  const controllerRef = useRef<AbortController | null>(null);
  const assistRef = useRef<AIAssistViewComponent | null>(null);
  const data = fixture();

  const snapshot = useMemo<SessionSnapshot>(() => ({
    region: state.filters.region, band: state.filters.riskBand, period: state.filters.period,
    vendors: state.vendors, approvals: state.approvals, certificates: data.certificates
  }), [state, data]);

  const banner = 'Sample AI — responses are simulated from the current session data; no external model is called.';

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-page-title">AI Assistant</h1>
          <p className="app-page-subtitle">Decision support grounded in the current session (sample responses)</p>
        </div>
      </div>
      <div className="e-card app-ai-card">
          <div className="e-card-header"><div className="e-card-header-caption"><div className="app-ai-banner" role="note">{banner}</div></div></div>
          <div className="e-card-content">
            <AIAssistViewComponent
              id="vendor-ai-assist"
              ref={assistRef}
              promptSuggestions={PROMPTS}
              height="auto"
              width="100%"
              promptRequest={async (args: { prompt?: string; cancel?: boolean; [k: string]: unknown }) => {
                const prompt = (args.prompt ?? '') as string;
                controllerRef.current?.abort();
                const controller = new AbortController();
                controllerRef.current = controller;
                // The skeleton resolves only when addPromptResponse is called with the
                // output (the PromptRequestEventArgs carries no response field).
                try {
                  const response = await sampleProvider.respond(prompt, snapshot, controller.signal);
                  assistRef.current?.addPromptResponse(response);
                } catch {
                  assistRef.current?.addPromptResponse('Response cancelled.');
                }
              }}
            />
          </div>
        </div>
    </div>
  );
}