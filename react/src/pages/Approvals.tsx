// `/approvals` Onboarding Approvals — Kanban is the primary surface.
// Drag a card between stage columns (session-only). The card edit dialog stays closed
// (double-click and Enter). The Move a vendor form is the validated alternative.
import { useRef, useState, type JSX } from 'react';
import { KanbanComponent, ColumnsDirective, ColumnDirective } from '@syncfusion/ej2-react-kanban';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { DatePickerComponent } from '@syncfusion/ej2-react-calendars';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { useSession, allowedMoves } from '../domain/session';
import { useTheme } from '../theme/ThemeProvider';
import { fixture, type Approval } from '../data/loader';
import * as S from '../domain/selectors';
import { DATE_FORMAT, displayDate } from '../domain/format';
import { AlertTriangle, User, Calendar, CheckCircle2 } from 'lucide-react';

const ACTOR = 'Session user';

function cardFields(a: Approval) {
  const overdue = S.overdueApproval(a);
  return {
    ...a,
    // Display fields the card template reads from this record.
    dueText: displayDate(a.dueOn),
    overdue,
    overdueBadge: overdue ? 'OVERDUE' : '',
    checklistText: `${a.checklistDone}/${a.checklistTotal} checklist`
  };
}

// Card template. It reads only fields on the record.
// Icon-based pills for owner, due date, checklist; no duplicate stage badge.
function cardTemplate(props: { [key: string]: unknown }): JSX.Element {
  const data = props as unknown as ReturnType<typeof cardFields>;
  const checklistIcon = data.checklistDone === data.checklistTotal
    ? <CheckCircle2 size={13} aria-hidden="true" />
    : <AlertTriangle size={13} aria-hidden="true" />;
  const checklistTone = data.checklistDone === data.checklistTotal ? 'app-badge--success' : 'app-badge--warning';
  return (
    <div className="app-kanban-card">
      <div className="app-kanban-card-name">{data.vendorName}</div>
      {data.overdue && <span className="app-badge app-badge--danger">{data.overdueBadge}</span>}
      <div className="app-kanban-card-badges">
        <span className={`app-badge app-badge--neutral`}><User size={12} aria-hidden="true" /> {data.owner}</span>
        <span className={`app-badge app-badge--neutral`}><Calendar size={12} aria-hidden="true" /> {data.dueText}</span>
        <span className={`app-badge ${checklistTone}`}>{checklistIcon} {data.checklistText}</span>
      </div>
    </div>
  );
}

function auditStamp(ts: string): number {
  const match = /^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})/.exec(ts);
  if (!match) return 0;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
}

type BoardCard = { id?: string; stage?: Approval['stage'] };
type BoardActionArgs = {
  requestType?: string;
  cancel?: boolean;
  changedRecords?: BoardCard[];
};

export default function Approvals() {
  const { state, dispatch } = useSession();
  const { theme } = useTheme();
  const data = fixture();
  const [dialogApproval, setDialogApproval] = useState<Approval | null>(null);
  const [targetStage, setTargetStage] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const board = state.approvals.map(cardFields);
  const pending = S.pendingApprovals(state.approvals);
  const overdue = state.approvals.filter(S.overdueApproval).length;
  // Kanban binds action handlers once. Read the latest approvals through a ref so a
  // later drag still sees the stage written by the previous move.
  const approvalsRef = useRef(state.approvals);
  approvalsRef.current = state.approvals;

  const auditRows = state.approvals.flatMap((a, approvalIndex) => a.auditTrail.map((t, i) => ({
    key: `${a.id}-${i}`,
    vendor: a.vendorName,
    order: approvalIndex * 1000 + i,
    ...t
  }))).sort((a, b) => {
    const delta = auditStamp(b.ts) - auditStamp(a.ts);
    return delta !== 0 ? delta : b.order - a.order;
  }).slice(0, 12);

  const blockCardDialog = (args: { cancel?: boolean }) => { args.cancel = true; };

  const onBoardBegin = (args: BoardActionArgs) => {
    if (args.requestType !== 'cardChange') return;
    const changed = args.changedRecords?.[0];
    const src = changed?.id ? approvalsRef.current.find(a => a.id === changed.id) : undefined;
    if (src && changed?.stage && !allowedMoves(src.stage).includes(changed.stage)) {
      args.cancel = true;
    }
  };

  const onBoardComplete = (args: BoardActionArgs) => {
    if (args.requestType !== 'cardChanged') return;
    const changed = args.changedRecords?.[0];
    if (!changed?.id || !changed.stage) return;
    const src = approvalsRef.current.find(a => a.id === changed.id);
    if (!src || src.stage === changed.stage) return;
    if (!allowedMoves(src.stage).includes(changed.stage)) return;
    dispatch({ type: 'move-stage', approvalId: changed.id, to: changed.stage, note: 'Moved via Kanban drag', actor: ACTOR });
  };

  const openDialog = (a: Approval) => {
    setDialogApproval(a);
    setTargetStage(allowedMoves(a.stage)[0]);
    setNote('');
    setDueDate(null);
    setError('');
  };

  const save = () => {
    if (!dialogApproval || !targetStage) return;
    if (note.trim().length < 10) { setError('A note of at least 10 characters is required for the audit trail.'); return; }
    dispatch({ type: 'move-stage', approvalId: dialogApproval.id, to: targetStage as Approval['stage'], note: note.trim(), actor: ACTOR });
    setDialogApproval(null);
  };

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-page-title">Onboarding Approvals</h1>
          <p className="app-page-subtitle">Move vendors through the onboarding ladder — session-only changes (public profile)</p>
        </div>
      </div>

      {/* Kanban primary surface: column headers carry the stage counts. Drag or the card menu; the same move rules apply. */}
      <div className="e-card">
        <div className="e-card-header"><div className="e-card-header-caption"><p className="e-card-header-title">Onboarding board</p><p className="e-card-sub-title">Drag a card, or use the card menu → Move card ({pending} pending, {overdue} overdue)</p></div></div>
        <div className="e-card-content">
          <KanbanComponent
            id="approvals-board"
            key={theme}
            dataSource={board}
            keyField="stage"
            cardSettings={{ template: cardTemplate as never, headerField: 'id', selectionType: 'Multiple' }}
            swimlaneSettings={{ keyField: 'region' }}
            allowDragAndDrop={true}
            cardDoubleClick={blockCardDialog}
            dialogOpen={blockCardDialog}
            actionBegin={onBoardBegin}
            actionComplete={onBoardComplete}
          >
            <ColumnsDirective>
              {data.stages.map(s => (
                <ColumnDirective key={s} keyField={s} headerText={s} allowToggle={true} />
              ))}
            </ColumnsDirective>
          </KanbanComponent>
          <p className="app-chart-note">Allowed moves: forward one stage; back only Risk&nbsp;Review → Submitted; Approved is closed. Every move appends to the audit trail below. Keyboard: focus a card, open the card menu (⋯), choose Move card.</p>
        </div>
      </div>

      <div className="app-grid-2 app-approvals-lower">
        <div className="e-card app-move-card">
          <div className="e-card-header"><div className="e-card-header-caption"><p className="e-card-header-title">Move a vendor (Forms dialog)</p><p className="e-card-sub-title">Session-only stage move with validation</p></div></div>
          <div className="e-card-content">
            <form className="app-form app-move-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
              <div className="app-filter-field">
                <label id="move-approval-label" htmlFor="move-approval">Approval record</label>
                <DropDownListComponent
                  id="move-approval"
                  dataSource={state.approvals.filter(a => a.stage !== 'Approved').map(a => ({ text: `${a.vendorName} — ${a.stage}`, value: a.id }))}
                  fields={{ text: 'text', value: 'value' }}
                  value={dialogApproval?.id ?? null}
                  placeholder="Choose a vendor"
                  width="100%"
                  change={(e) => { if (!e.value || e.value === '') return; const a = state.approvals.find(x => x.id === e.value); if (a) openDialog(a); }}
                  htmlAttributes={{ 'aria-labelledby': 'move-approval-label' }}
                />
              </div>
              {dialogApproval && (
                <>
                  <div className="app-filter-field">
                    <label htmlFor="move-vendor">Vendor</label>
                    <input id="move-vendor" className="app-input" readOnly value={dialogApproval.vendorName} />
                  </div>
                  <div className="app-filter-field">
                    <label id="move-stage-label" htmlFor="move-stage">Target stage (legal moves only)</label>
                    <DropDownListComponent
                      id="move-stage"
                      dataSource={allowedMoves(dialogApproval.stage).map(s => ({ text: s, value: s }))}
                      fields={{ text: 'text', value: 'value' }}
                      value={targetStage}
                      width="100%"
                      change={(e) => setTargetStage(e.value as string)}
                      htmlAttributes={{ 'aria-labelledby': 'move-stage-label' }}
                    />
                  </div>
                  <div className="app-filter-field">
                    <label htmlFor="move-note">Note (min 10 chars)</label>
                    <textarea id="move-note" className="app-input" rows={3} value={note}
                      onChange={(e) => { setNote(e.target.value); setError(''); }}
                      aria-describedby={error ? 'move-note-error' : undefined} />
                  </div>
                  <div className="app-filter-field">
                    <label htmlFor="move-due">Due date</label>
                    <DatePickerComponent
                      id="move-due"
                      value={dueDate ?? undefined}
                      format={DATE_FORMAT}
                      width="100%"
                      placeholder={displayDate(dialogApproval.dueOn)}
                      change={(e) => setDueDate(e.value as Date | null)}
                    />
                  </div>
                  {error && <p id="move-note-error" className="app-form-error" role="alert">{error}</p>}
                  <div className="app-move-actions">
                    <ButtonComponent type="button" onClick={() => setDialogApproval(null)}>Cancel</ButtonComponent>
                    <ButtonComponent type="button" cssClass="app-button--primary e-primary" onClick={save}>Move to {targetStage || '…'}</ButtonComponent>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>

        <div className="e-card">
          <div className="e-card-header"><div className="e-card-header-caption"><p className="e-card-header-title">Audit trail</p><p className="e-card-sub-title">Newest session moves first</p></div></div>
          <div className="e-card-content">
            <ul className="app-plain-list">
              {auditRows.map(e => (
                <li key={e.key} className="app-audit-row">
                  <span className="app-audit-ts">{e.ts}</span>
                  <span className="app-audit-actor">{e.actor}</span>
                  <span className="app-audit-action">{e.action} · {e.vendor}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}