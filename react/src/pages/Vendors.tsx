// `/vendors` Vendor Register and Category Hierarchy.
// TreeGrid (@syncfusion/react-grid tree mode) shows group, category, and vendor rows.
// Selecting a vendor row updates the score-history chart and the certificate list. A pager
// keeps the register browsable. The active page number is readable in both themes (app.css).
import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid as TreeGridComponent, Columns, Column, TreeDataModule, PagerModule, type RowSelectEvent, type ColumnTemplateProps } from '@syncfusion/react-grid';
import { ChartComponent, SeriesCollectionDirective, SeriesDirective,
  Category, SplineSeries, LineSeries, Tooltip, Legend, DataLabel } from '@syncfusion/ej2-react-charts';

ChartComponent.Inject(Category, SplineSeries, LineSeries, Tooltip, Legend, DataLabel);
import { ListViewComponent } from '@syncfusion/ej2-react-lists';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { TooltipComponent, type TooltipEventArgs } from '@syncfusion/ej2-react-popups';
import { Button } from '@syncfusion/react-buttons';
import { Variant, Color } from '@syncfusion/react-base';
import { Info } from 'lucide-react';
import { useSession } from '../domain/session';
import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/palette';
import { ChartBox } from '../shell/ChartBox';
import { fixture, type Vendor } from '../data/loader';
import * as S from '../domain/selectors';
import { count, DATE_FORMAT, daysFrom, displayDate, money, monthLabel, SYNCFUSION_FORMATS } from '../domain/format';
import { demoToday } from '../data/loader';

const treeGridModules = { TreeDataModule, PagerModule };

/** What each certificate type attests, shown from the info icon on the certificate row. */
const CERTIFICATE_ABOUT: Record<string, string> = {
  'ISO 9001': 'Quality management. Confirms documented processes for consistent delivery, inspection, and nonconformance handling.',
  'ISO 27001': 'Information security management. Confirms controls that protect procurement and customer data.',
  'Cyber': 'Cybersecurity attestation. Covers access control, incident notice, and the security practices required for this engagement.',
  'Insurance': 'Liability and cargo cover. Confirms the supplier carries the insurance the contract requires.',
  'Diversity': 'Supplier diversity certification. Records the ownership status used for diversity-spend reporting.',
  'Financial Audit': 'Independent financial audit. The latest audited statements used in the financial-risk score.'
};

function certificateAbout(type: string): string {
  return CERTIFICATE_ABOUT[type] ?? `${type} is on file for this supplier. Open the certificate schedule in Vendor Documents for the full scope.`;
}

const REGION_FULL: Record<string, string> = {
  AMER: 'AMER — North, Central and South America',
  EMEA: 'EMEA — Europe, Middle East and Africa',
  APAC: 'APAC — Asia Pacific'
};
export const regionFull = (code: string): string => REGION_FULL[code] ?? code;

function bandBadgeClass(score: number): string {
  return score >= 75 ? 'app-badge--danger' : score >= 50 ? 'app-badge--warning' : 'app-badge--success';
}

function statusBadgeClass(status: string): string {
  return status === 'Active' ? 'app-badge--success' : status === 'In Review' ? 'app-badge--info'
    : status === 'On Hold' ? 'app-badge--warning' : 'app-badge--neutral';
}

// Column templates, typed by the grid's template props.
function regionTemplate(props: ColumnTemplateProps) {
  const data = props.data as Record<string, unknown> | undefined;
  const code = (data?.region as string) ?? '';
  if (!code) return <span />;
  return <span className="app-region-code" title={regionFull(code)}>{code}</span>;
}

function riskTemplate(props: ColumnTemplateProps) {
  const data = props.data as Record<string, unknown> | undefined;
  const score = data?.compositeRiskScore as number | undefined;
  if (score === undefined || score === null) return <span />;
  return <span className={`app-badge ${bandBadgeClass(score)}`}>{S.riskBandLabel(score)} · {score}</span>;
}

function statusTemplate(props: ColumnTemplateProps) {
  const data = props.data as Record<string, unknown> | undefined;
  const status = data?.status as string | undefined;
  if (!status) return <span />;
  return <span className={`app-badge ${statusBadgeClass(status)}`}>{status}</span>;
}

function spendTemplate(props: ColumnTemplateProps) {
  const data = props.data as Record<string, unknown> | undefined;
  const spend = data?.annualSpend as number | undefined;
  if (spend === undefined || spend === null) return <span />;
  return <span>{money(spend)}</span>;
}

export default function Vendors() {
  const { state, dispatch } = useSession();
  const { theme } = useTheme();
  const p = palette(theme);
  const navigate = useNavigate();
  const f = state.filters;
  const data = fixture();
  const certTip = useRef<TooltipComponent | null>(null);
  const beforeCertificateTip = (args: TooltipEventArgs) => {
    const about = (args.target as HTMLElement | undefined)?.getAttribute('data-cert-about');
    if (!about || !certTip.current) { args.cancel = true; return; }
    certTip.current.content = about;
  };

  const vendors = state.vendors.filter(v =>
    (!f.region || v.region === f.region) &&
    (!f.riskBand || S.riskBandLabel(v.compositeRiskScore) === f.riskBand) &&
    (!f.vendorCategoryId || v.categoryId === f.vendorCategoryId));

  // Single self-referential tree: category group -> category -> vendor rows.
  const treeData = useMemo(() => {
    const rows: Record<string, unknown>[] = [];
    for (const group of data.groups) {
      rows.push({ id: group.id, parentId: null, name: group.name, hasChildren: true, kind: 'group' });
    }
    const visibleCategories = new Set(vendors.map(v => v.categoryId));
    for (const cat of data.categories) {
      if (!visibleCategories.has(cat.id)) continue;
      rows.push({ id: cat.id, parentId: cat.parentId, name: cat.name, hasChildren: true, kind: 'category', region: cat.region });
    }
    for (const v of vendors) {
      rows.push({ id: v.id, parentId: v.categoryId, name: v.name, kind: 'vendor', region: v.region,
        annualSpend: v.annualSpend, onTimeDeliveryRate: v.onTimeDeliveryRate, compositeRiskScore: v.compositeRiskScore,
        status: v.status, expanded: false });
    }
    return rows;
  }, [data, vendors]);

  const selected = vendors.find(v => v.id === f.selectedVendorId) ?? vendors.find(v => v.id === 'vendor-01') ?? vendors[0];

  const history = selected
    ? data.scoreHistory.filter(h => h.vendorId === selected.id).map(h => ({
        month: h.month, label: monthLabel(h.month), score: h.compositeRiskScore,
        tone: h.compositeRiskScore >= 75 ? p.danger : h.compositeRiskScore >= 50 ? p.warning : p.success
      }))
    : [];

  const certificates = selected ? data.certificates.filter(c => c.vendorId === selected.id) : [];

  // Row select updates the detail panel (chart + certificates) below.
  const onRowSelect = (args: RowSelectEvent<unknown>) => {
    const row = (Array.isArray(args.data) ? args.data[0] : args.data) as { id?: string; kind?: string } | undefined;
    if (row?.id && row.kind === 'vendor') {
      dispatch({ type: 'select-vendor', vendorId: row.id });
    }
  };

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-page-title">Vendor Register & Category Hierarchy</h1>
          <p className="app-page-subtitle">Drill from category groups to vendors, scores and certificates — select a vendor row to update the detail panels</p>
        </div>
        <div className="app-filter-chips">
          <span className="app-filter-chip">Region: {f.region ?? 'All'}</span>
          <span className="app-filter-chip">Band: {f.riskBand ?? 'All'}</span>
        </div>
      </div>

      <div className="e-card">
        <div className="e-card-header"><div className="e-card-header-caption"><p className="e-card-header-title">Vendor register</p><p className="e-card-sub-title">{count(vendors.length)} vendors · TreeGrid (group → category → vendor)</p></div></div>
        <div className="e-card-content">
          <TreeGridComponent
            dataSource={treeData}
            enableDevMode={false}
            modules={treeGridModules}
            isTreeMode={true}
            treeDataIdMapping="id"
            treeDataParentIdField="parentId"
            treeColumnIndex={0}
            height="420"
            pageSettings={{ enabled: true, pageSize: 12 }}
            selectionSettings={{ enabled: true, mode: 'Single', type: 'Row' }}
            onRowSelect={onRowSelect}
          >
            <Columns>
              <Column field="name" headerText="Vendor / Category" width="230" isPrimaryKey={true} />
              <Column field="region" headerText="Region" width="90" template={regionTemplate} />
              <Column field="annualSpend" headerText="Annual spend" width="130" textAlign="Right" template={spendTemplate} />
              <Column field="onTimeDeliveryRate" headerText="On-time %" width="100" format={SYNCFUSION_FORMATS.percent} textAlign="Right" />
              <Column field="compositeRiskScore" headerText="Risk score" width="120" textAlign="Center" template={riskTemplate} />
              <Column field="status" headerText="Status" width="110" template={statusTemplate} />
            </Columns>
          </TreeGridComponent>
          <p className="app-chart-note">Hover a Region code for its full name (AMER, EMEA, APAC). Select a vendor row to update the score history and certificates below.</p>
        </div>
      </div>

      {/* Vendor detail: row selection drives both cards */}
      {selected && (
        <div className="app-grid-2" style={{ marginTop: 'var(--sf-space-4)' }}>
          <div className="e-card">
            <div className="e-card-header"><div className="e-card-header-caption"><p className="e-card-header-title">{selected.name}</p><p className="e-card-sub-title">Score history · trailing 12 months</p></div></div>
            <div className="e-card-content">
              <ChartBox>{(w) => (
              <ChartComponent key={theme} theme={theme === 'dark' ? 'TailwindDark' : 'Tailwind'} width={`${w}px`} height="240px"
                primaryXAxis={{ valueType: 'Category', title: 'Month', labelRotation: -45, labelStyle: { color: p.neutral }, titleStyle: { color: p.neutral } }}
                primaryYAxis={{ minimum: 0, maximum: 100, title: 'Composite score', labelStyle: { color: p.neutral }, titleStyle: { color: p.neutral } }}
                legendSettings={{ visible: true, textStyle: { color: p.neutral } }}
                tooltip={{ enable: true, format: '${point.x}: ${point.y}' }}
                title="Score history vs target (65)" titleStyle={{ color: p.neutral, size: "14px" }}
                margin={{ left: 20, right: 20, top: 24 }}>
                <SeriesCollectionDirective>
                  <SeriesDirective type="Spline" dataSource={history} xName="label" yName="score" width={2}
                    pointColorMapping="tone" name={`${selected.name} composite score`} />
                  <SeriesDirective type="Line" dataSource={history.map(h => ({ label: h.label, target: 65 }))} xName="label" yName="target"
                    dashArray="6,4" fill={p.reference} width={1.5} name="Target (65)" marker={{ visible: false }} />
                </SeriesCollectionDirective>
              </ChartComponent>
              )}</ChartBox>
              <p className="app-chart-note">Points judged against the 65 target (dashed neutral line): ≥65 Watch/Critical tones, below 65 Low.</p>
            </div>
          </div>

          <div className="e-card">
            <div className="e-card-header"><div className="e-card-header-caption"><p className="e-card-header-title">Certificates</p><p className="e-card-sub-title">ListView · expiry vs {displayDate(demoToday)}</p></div></div>
            <div className="e-card-content">
              <TooltipComponent ref={certTip} cssClass="app-cert-tip" target=".app-cert-info" position="TopCenter"
                opensOn="Hover Focus" showTipPointer windowCollision width="280px"
                beforeRender={beforeCertificateTip} content="Certificate">
                <ListViewComponent
                  id="vendor-certificates"
                  dataSource={certificates.map(c => {
                    const days = daysFrom(demoToday, c.expiresOn);
                    return {
                      id: c.id, text: c.type, about: certificateAbout(c.type),
                      secondary: `Expires ${displayDate(c.expiresOn)} · ${days < 0 ? `expired ${-days}d ago` : `${days}d left`}`,
                      badge: days < 0 ? 'Expired' : days <= 60 ? 'Expiring soon' : 'Current',
                      tone: days < 0 ? 'app-badge--danger' : days <= 60 ? 'app-badge--warning' : 'app-badge--success'
                    };
                  })}
                  fields={{ id: 'id', text: 'text' }}
                  showHeader={false}
                  height="200"
                  template={(dataRow: { text?: string; about?: string; tone?: string; badge?: string; secondary?: string }) => (
                    <div className="app-lv-item">
                      <span className="app-cert-name">
                        <span className="app-lv-text">{dataRow.text}</span>
                        <button type="button" className="app-cert-info" data-cert-about={dataRow.about}
                          aria-label={`What ${dataRow.text} provides`}
                          onClick={(event) => event.stopPropagation()}>
                          <Info size={14} aria-hidden="true" />
                        </button>
                      </span>
                      <span className={`app-badge ${dataRow.tone}`}>{dataRow.badge}</span>
                      <span className="app-lv-secondary">{dataRow.secondary}</span>
                    </div>
                  )}
                />
              </TooltipComponent>
              <div className="app-filter-bar" style={{ marginTop: 'var(--sf-space-3)' }}>
                <div className="app-filter-field">
                  <label id="band-override-label" htmlFor="band-override">Session band override</label>
                  <DropDownListComponent
                    id="band-override"
                    dataSource={[{ text: 'Fixture value', value: '' }, { text: 'Low', value: 'Low' }, { text: 'Watch', value: 'Watch' }, { text: 'Critical', value: 'Critical' }]}
                    fields={{ text: 'text', value: 'value' }}
                    value=""
                    placeholder="Fixture value"
                    change={(e) => dispatch({ type: 'override-band', vendorId: selected.id, band: ((e.value as string) || null) as 'Low' | 'Watch' | 'Critical' | null })}
                    htmlAttributes={{ 'aria-labelledby': 'band-override-label' }}
                  />
                </div>
                <Button
                  variant={Variant.Outlined}
                  color={Color.Secondary}
                  onClick={() => navigate('/documents')}
                >
                  Review this vendor&rsquo;s documents
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
