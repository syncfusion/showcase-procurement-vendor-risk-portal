// Shared filter bar: DropDownLists sized to their content, a period DropDownList,
// a Reset button, and chips for filters set from another control (a dashboard chart
// point selects a region or band).
// Reset uses Button from @syncfusion/react-buttons.
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { Button, Variant, Color } from '@syncfusion/react-buttons';
import { useSession } from '../domain/session';
import { fixture } from '../data/loader';
import { periodOptions, defaultPeriod } from '../domain/periods';

export function FilterBar({ showPeriod = true }: { showPeriod?: boolean }) {
  const { state, dispatch } = useSession();
  const f = fixture();
  const period = state.filters.period || defaultPeriod(f.months);

  const regions = [{ text: 'All regions', value: '' }, ...f.regions.map(r => ({ text: r, value: r }))];
  const bands = [{ text: 'All bands', value: '' }, ...f.riskBands.map(b => ({ text: b.label, value: b.label }))];
  const periods = periodOptions(f.months).map(o => ({ text: o.text, value: o.value, group: o.group }));

  return (
    <div className="app-filter-bar">
      <div className="app-filter-field">
        <label id="filter-region-label" htmlFor="filter-region">Region</label>
        <DropDownListComponent
          id="filter-region"
          dataSource={regions}
          fields={{ text: 'text', value: 'value' }}
          value={state.filters.region ?? ''}
          placeholder="All regions"
          change={(e) => dispatch({ type: 'set-filter', key: 'region', value: (e.value as string) || null })}
          aria-labelledby="filter-region-label"
          htmlAttributes={{ 'aria-labelledby': 'filter-region-label' }}
        />
      </div>
      <div className="app-filter-field">
        <label id="filter-band-label" htmlFor="filter-band">Risk band</label>
        <DropDownListComponent
          id="filter-band"
          dataSource={bands}
          fields={{ text: 'text', value: 'value' }}
          value={state.filters.riskBand ?? ''}
          placeholder="All bands"
          change={(e) => dispatch({ type: 'set-filter', key: 'riskBand', value: (e.value as string) || null })}
          htmlAttributes={{ 'aria-labelledby': 'filter-band-label' }}
        />
      </div>
      {showPeriod && (
        <div className="app-filter-field">
          <label id="filter-period-label" htmlFor="filter-period">Reporting period</label>
          <DropDownListComponent
            id="filter-period"
            dataSource={periods}
            fields={{ text: 'text', value: 'value', groupBy: 'group' }}
            value={period}
            change={(e) => dispatch({ type: 'set-period', period: e.value as string })}
            htmlAttributes={{ 'aria-labelledby': 'filter-period-label' }}
          />
        </div>
      )}
      <Button
        variant={Variant.Outlined}
        color={Color.Secondary}
        onClick={() => dispatch({ type: 'reset-filters' })}
      >
        Reset filters
      </Button>
      <div className="app-filter-chips" aria-label="Active filters">
        {state.filters.region && (
          <span className="app-filter-chip">Region: {state.filters.region}
            <button type="button" aria-label={`Clear region filter ${state.filters.region}`} onClick={() => dispatch({ type: 'set-filter', key: 'region', value: null })}>✕</button>
          </span>
        )}
        {state.filters.riskBand && (
          <span className="app-filter-chip">Risk band: {state.filters.riskBand}
            <button type="button" aria-label={`Clear risk band filter ${state.filters.riskBand}`} onClick={() => dispatch({ type: 'set-filter', key: 'riskBand', value: null })}>✕</button>
          </span>
        )}
        {state.filters.vendorCategoryId && (
          <span className="app-filter-chip">Category narrowed from Dashboard
            <button type="button" aria-label="Clear category filter" onClick={() => dispatch({ type: 'set-filter', key: 'vendorCategoryId', value: null })}>✕</button>
          </span>
        )}
      </div>
    </div>
  );
}
