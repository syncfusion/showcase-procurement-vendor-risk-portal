// `/` Risk Dashboard — Dashboard Layout (dragging + resizing enabled), advanced charts
// (Range Column, Bubble), donut of vendors by band, KPI cards, filter bar.
import { useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayoutComponent } from '@syncfusion/ej2-react-layouts';
import { ChartComponent, SeriesCollectionDirective, SeriesDirective,
  AccumulationChartComponent, AccumulationSeriesCollectionDirective, AccumulationSeriesDirective,
  Category, RangeColumnSeries, BubbleSeries, Tooltip, Legend, DataLabel, PieSeries,
  AccumulationTooltip, AccumulationDataLabel, AccumulationLegend } from '@syncfusion/ej2-react-charts';

ChartComponent.Inject(Category, RangeColumnSeries, BubbleSeries, Tooltip, Legend, DataLabel);
AccumulationChartComponent.Inject(PieSeries, AccumulationTooltip, AccumulationLegend, AccumulationDataLabel);
import { AlertTriangle, Users, Shield, DollarSign, ClipboardCheck } from 'lucide-react';
import { ListViewComponent } from '@syncfusion/ej2-react-lists';
import { useSession } from '../domain/session';
import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/palette';
import { fixture } from '../data/loader';
import { FilterBar } from '../filter-bar/FilterBar';
import { KpiCard } from '../shell/KpiCard';
import { ChartBox } from '../shell/ChartBox';
import * as S from '../domain/selectors';
import { compactMoney, count, money, percent } from '../domain/format';

/** Chart block inside a dashboard panel. Tall enough for the title, the top axis tick, and outer labels. */
const PANEL_CHART_HEIGHT = '440px';

/**
 * Dashboard Layout sizes a cell as width / cellAspectRatio. A 1:1 ratio makes each cell as
 * tall as one column, which clips the top of a chart and leaves only a couple of list rows.
 * Measure the rendered card (chart or every list row, plus the note, padding, and border)
 * and set the ratio from the same width the component uses. The list's natural height is
 * its rows, not the clamped cell, so the measurement does not feed back into itself.
 */
function marginY(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  return (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
}

function paddingBorderY(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  return (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
    + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
}

function blockHeight(el: HTMLElement): number {
  const list = el.classList.contains('e-listview') ? el : el.querySelector<HTMLElement>('.e-listview');
  if (list) {
    const items = list.querySelector<HTMLElement>('.e-list-parent');
    // Row-list scrollHeight is the unclamped height. offsetHeight already includes
    // the list's padding and border, so only the margin is added.
    const natural = items ? items.scrollHeight + paddingBorderY(list) : list.scrollHeight;
    return Math.max(list.offsetHeight, natural) + marginY(list);
  }

  const chart = el.matches('.e-chart, .e-accumulationchart')
    ? el
    : el.querySelector<HTMLElement>('.e-chart, .e-accumulationchart');
  return Math.max(el.offsetHeight, chart?.offsetHeight ?? 0) + marginY(el);
}

function panelContentHeight(panel: HTMLElement): number {
  const container = panel.querySelector<HTMLElement>('.e-panel-container');
  const host = container?.querySelector('.e-chart, .e-accumulationchart, .e-listview, .app-chart-note, .app-panel-header')
    ? container
    : panel;
  let inner = 0;
  for (const node of [...host.children]) {
    const el = node as HTMLElement;
    if (el.classList.contains('e-panel-container') || el.classList.contains('e-resize') || el.classList.contains('e-drag-restrict')) continue;
    inner += blockHeight(el);
  }
  if (host === container && container) inner += paddingBorderY(container);
  // Panel padding and border sit outside the card. A few pixels of slack keep the
  // top axis tick and the last list row inside the cell border.
  return Math.ceil(inner + paddingBorderY(panel) + 12);
}

function useDashboardCellAspect(layoutId: string, columns: number, columnGap: number): number {
  const [ratio, setRatio] = useState(0.42);
  useLayoutEffect(() => {
    let frame = 0;
    let frames = 0;
    const measure = () => {
      frames += 1;
      const layout = document.getElementById(layoutId);
      if (!layout) {
        if (frames < 20) frame = requestAnimationFrame(measure);
        return;
      }
      // Same basis as DashboardLayout.calculateCellSize: the parent width, one column
      // below the 600px media query (that branch sizes the cell as width / ratio).
      const basis = layout.parentElement?.offsetWidth || layout.offsetWidth;
      const mobile = window.matchMedia('(max-width: 600px)').matches;
      const colWidth = mobile ? basis : (basis - (columns - 1) * columnGap) / columns;
      const panels = [...layout.querySelectorAll<HTMLElement>(':scope > .e-panel')];
      const ready = panels.some(panel => panel.querySelector('.e-chart svg, .e-accumulationchart svg, .e-list-item'));
      const contentHeight = ready ? Math.max(0, ...panels.map(panelContentHeight)) : 0;
      // Ignore the empty-container measurement (padding only). That ratio collapses the cells.
      if (colWidth > 0 && contentHeight > 200) {
        const next = +(colWidth / contentHeight).toFixed(4);
        setRatio(prev => (Math.abs(prev - next) > 0.001 ? next : prev));
      }
      if (frames < 12) frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    const layout = document.getElementById(layoutId);
    if (layout) observer.observe(layout);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [layoutId, columns, columnGap]);
  // A cellAspectRatio prop change does not re-layout the component (its handler only
  // re-lays out for columns/cellSpacing), but its window resize listener does.
  useLayoutEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [ratio]);
  return ratio;
}

function filteredVendors(state: ReturnType<typeof useSession>['state']) {
  const f = state.filters;
  return state.vendors.filter(v =>
    (!f.region || v.region === f.region) &&
    (!f.riskBand || S.riskBandLabel(v.compositeRiskScore) === f.riskBand) &&
    (!f.vendorCategoryId || v.categoryId === f.vendorCategoryId));
}

export default function Dashboard() {
  const { state, dispatch } = useSession();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const p = palette(theme);
  const cellAspect = useDashboardCellAspect('risk-dashboard-panels', 6, 16);

  const vendors = filteredVendors(state);
  const certificates = fixture().certificates;

  // KPI values (same selector source as every other view, so they reconcile).
  const riskIndex = S.portfolioRiskIndex(vendors);
  const inReview = S.vendorsInReview(vendors);
  const expSoon = S.certificatesExpiringSoon(vendors, certificates);
  const spend = S.spendUnderManagement(vendors);
  const pending = S.pendingApprovals(state.approvals);
  const active = vendors.filter(v => v.status === 'Active');

  // Range Column: min–max composite score per category group.
  const byGroup = new Map<string, number[]>();
  for (const v of vendors) {
    const arr = byGroup.get(v.categoryGroup) ?? [];
    arr.push(v.compositeRiskScore);
    byGroup.set(v.categoryGroup, arr);
  }
  const rangeData = [...byGroup.entries()].map(([group, scores]) => ({
    group, low: Math.min(...scores), high: Math.max(...scores)
  })).sort((a, b) => a.group.localeCompare(b.group));

  // Bubble: risk vs OTD, size = spend, color-coded by risk band.
  const bubbleColor = (score: number) => score >= 75 ? p.danger : score >= 50 ? p.warning : score >= 30 ? p.info : p.success;
  const bubbleData = vendors.map(v => ({
    x: v.compositeRiskScore, y: v.onTimeDeliveryRate * 100, size: v.annualSpend, name: v.name, region: v.region,
    color: bubbleColor(v.compositeRiskScore),
    text: `${v.name} · risk ${v.compositeRiskScore} · OTD ${(v.onTimeDeliveryRate * 100).toFixed(1)}% · spend ${compactMoney(v.annualSpend)}`
  }));

  // Donut: vendors by band, largest first, values inside (labels read on their slice).
  const donutData = S.vendorsByBand(vendors).map(b => ({
    band: b.band, count: b.count, color: b.band === 'Critical' ? p.danger : b.band === 'Watch' ? p.warning : p.success,
    text: `${b.count}`
  }));

  const cell = (content: React.ReactNode) => <div className="app-panel">{content}</div>;

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-page-title">Risk Dashboard</h1>
          <p className="app-page-subtitle">Cross-industry supplier risk exposure, scores and spend under management</p>
        </div>
      </div>
      <FilterBar />

      <div className="app-kpi-row">
        <KpiCard title="Portfolio Risk Index" value={String(riskIndex)} note="Mean composite score (0–100)" tone={riskIndex >= 75 ? 'danger' : riskIndex >= 50 ? 'warning' : 'success'} icon={<Shield size={18} />} />
        <KpiCard title="Vendors in Review" value={count(inReview)} note={`${pending} approvals pending`} tone="info" icon={<ClipboardCheck size={18} />} action={{ label: 'Review pending approvals', onClick: () => navigate('/approvals') }} />
        <KpiCard title="Expiring Certificates" value={count(expSoon)} note="Expiring within 60 days" tone={expSoon > 0 ? 'warning' : 'success'} icon={<AlertTriangle size={18} />} />
        <KpiCard title="Spend Under Management" value={compactMoney(spend)} note={`Across ${count(active.length)} active vendors`} tone="neutral" icon={<DollarSign size={18} />} />
        <KpiCard title="Vendors Onboarded" value={count(active.length)} note="Status: Active" tone="info" icon={<Users size={18} />} />
      </div>

      {/* Dragging and resizing stay on so the panels can be rearranged.
          cellAspectRatio is measured from the rendered card height so each panel matches its
          content instead of the default square cell. A square cell clips the chart and the list. */}
      <DashboardLayoutComponent
        id="risk-dashboard-panels"
        columns={6} cellSpacing={[16, 16]} cellAspectRatio={cellAspect}
        allowDragging={true} allowResizing={true}
        panels={[
          { id: 'panel-range', sizeX: 3, sizeY: 1, row: 0, col: 0 },
          { id: 'panel-bubble', sizeX: 3, sizeY: 1, row: 0, col: 3 },
          { id: 'panel-donut', sizeX: 3, sizeY: 1, row: 1, col: 0 },
          { id: 'panel-top', sizeX: 3, sizeY: 1, row: 1, col: 3 }
        ]}
      >
        <div id="panel-range" className="app-panel">
          <ChartBox>{(w) => (
          <ChartComponent key={theme} theme={theme === 'dark' ? 'TailwindDark' : 'Tailwind'} width={`${w}px`} height={PANEL_CHART_HEIGHT}
            primaryXAxis={{ valueType: 'Category', labelStyle: { color: p.neutral }, title: 'Category group', titleStyle: { color: p.neutral }, edgeLabelPlacement: 'Shift' }}
            primaryYAxis={{ minimum: 0, maximum: 100, title: 'Composite risk score', labelStyle: { color: p.neutral }, titleStyle: { color: p.neutral }, edgeLabelPlacement: 'Shift' }}
            legendSettings={{ visible: true, textStyle: { color: p.neutral } }}
            tooltip={{ enable: true, format: '${point.x}: ${point.low}–${point.high}' }}
            title="Score spread per group (Range Column)" titleStyle={{ color: p.neutral, size: "14px" }}
            margin={{ left: 22, right: 20, top: 36, bottom: 16 }}>
            <SeriesCollectionDirective>
              <SeriesDirective type="RangeColumn" dataSource={rangeData} xName="group" low="low" high="high" fill={p.series[4]} name="Score range (min–max)"
                marker={{ dataLabel: { visible: true, position: 'Outer', font: { size: '11px', color: p.neutral, fontWeight: '600' } } }} />
            </SeriesCollectionDirective>
          </ChartComponent>
          )}</ChartBox>
          <p className="app-chart-note">Range Column: the spread of composite risk scores within each category group.</p>
        </div>
        <div id="panel-bubble" className="app-panel">
          <ChartBox>{(w) => (
          <ChartComponent key={theme} theme={theme === 'dark' ? 'TailwindDark' : 'Tailwind'} width={`${w}px`} height={PANEL_CHART_HEIGHT}
            primaryXAxis={{ title: 'Composite risk score', minimum: 20, maximum: 100, labelStyle: { color: p.neutral }, titleStyle: { color: p.neutral }, edgeLabelPlacement: 'Shift' }}
            primaryYAxis={{ title: 'On-time delivery %', minimum: 60, maximum: 100, labelStyle: { color: p.neutral }, titleStyle: { color: p.neutral }, edgeLabelPlacement: 'Shift' }}
            tooltip={{ enable: true }}
            title="Delivery reliability against risk (Bubble)" titleStyle={{ color: p.neutral, size: "14px" }}
            margin={{ left: 22, right: 20, top: 36, bottom: 16 }}
            tooltipRender={(args: { text?: string; point?: { pointIndex?: number } }) => {
              // Formatted tooltip text from the record (never raw spend digits).
              const i = args.point?.pointIndex ?? -1;
              const v = bubbleData[i];
              if (v) args.text = `${v.name} · risk score ${v.x} · OTD ${v.y.toFixed(1)}% · spend ${compactMoney(v.size)}`;
            }}>
            <SeriesCollectionDirective>
              <SeriesDirective type="Bubble" dataSource={bubbleData} xName="x" yName="y" size="size"
                pointColorMapping="color" name="Vendors" opacity={0.8}
                marker={{ fill: p.series[0] }} />
            </SeriesCollectionDirective>
          </ChartComponent>
          )}</ChartBox>
          <p className="app-chart-note">Each bubble is a vendor: position = score vs delivery, size = annual spend.</p>
        </div>
        <div id="panel-donut" className="app-panel">
          <ChartBox>{(w) => (
          <AccumulationChartComponent key={theme} theme={theme === 'dark' ? 'TailwindDark' : 'Tailwind'} width={`${w}px`} height={PANEL_CHART_HEIGHT}
            legendSettings={{ visible: true, position: 'Right', textStyle: { size: '12px', color: p.neutral } }}
            tooltip={{ enable: true, format: '${point.x}: ${point.y} vendors' }}
            title="Vendor count per band (Donut)" titleStyle={{ color: p.neutral, size: "14px" }}
            margin={{ left: 22, right: 20, top: 28, bottom: 12 }}>
            <AccumulationSeriesCollectionDirective>
              <AccumulationSeriesDirective type="Pie" dataSource={donutData} xName="band" yName="count"
                innerRadius="40%" pointColorMapping="color"
                dataLabel={{ visible: true, position: 'Inside', name: 'text' }} />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
          )}</ChartBox>
          <p className="app-chart-note">Bands: Critical ≥75, Watch 50–74, Low ≤49 (legend names each band with its range).</p>
        </div>
        <div id="panel-top" className="app-panel app-panel--scroll">
          <div className="app-panel-header">Highest-risk vendors</div>
          <ListViewComponent
            id="dashboard-top-risk"
            className="app-top-risk-list"
            height="auto"
            dataSource={[...vendors].sort((a, b) => b.compositeRiskScore - a.compositeRiskScore).slice(0, 6).map(v => ({
              id: v.id, text: v.name, score: v.compositeRiskScore,
              band: S.riskBandLabel(v.compositeRiskScore),
              tone: v.compositeRiskScore >= 75 ? 'app-badge--danger' : v.compositeRiskScore >= 50 ? 'app-badge--warning' : 'app-badge--success',
              meta: `${v.region} · ${money(v.annualSpend)} · OTD ${percent(v.onTimeDeliveryRate, 0)}`
            }))}
            fields={{ id: 'id', text: 'text' }}
            showHeader={false}
            select={(args: { data?: { id?: string } & Record<string, unknown> }) => {
              const id = args.data?.id;
              if (!id) return;
              dispatch({ type: 'select-vendor', vendorId: id });
              navigate('/vendors');
            }}
            template={(item: any) => (
              <div className="app-lv-item">
                <span className="app-lv-text">{item.text}</span>
                <span className={`app-badge ${item.tone}`}>{item.band} · {item.score}</span>
                <span className="app-lv-secondary">{item.meta}</span>
              </div>
            )}
          />
          <p className="app-chart-note">Select a vendor to open its score history in the Vendor Register.</p>
        </div>
      </DashboardLayoutComponent>
    </div>
  );
}