// `/documents` Vendor Documents — ListView selection auto-activates the matching Tab panel:
// pdf -> PDF Viewer tab, sfdt -> Document Editor tab (no separate Open button). Both heavy
// controls lazy-load inside the page. Session-only edits; nothing writes shipped files.
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ListViewComponent } from '@syncfusion/ej2-react-lists';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { TabComponent, TabItemsDirective, TabItemDirective } from '@syncfusion/ej2-react-navigations';
import { fixture, type DocRecord } from '../data/loader';
import { displayDate } from '../domain/format';
import { LoadingState } from '../LoadingState';

const PdfViewerLazy = lazy(() => import('./PdfViewerPanel'));
const DocumentEditorLazy = lazy(() => import('./DocumentEditorPanel'));

const BASE_ASSET = '/documents';

function FileKindIcon({ kind }: { kind: string }) {
  const pdf = kind === 'pdf';
  return (
    <svg className={pdf ? 'app-file-icon app-file-icon--pdf' : 'app-file-icon app-file-icon--word'} viewBox="0 0 24 30" width="20" height="25" aria-hidden="true">
      <path className="app-file-icon__page" d="M5 1.6h9.1L20.4 8.2V26.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3.6a2 2 0 0 1 2-2z" />
      <path className="app-file-icon__fold" d="M14 1.8V7.4a1 1 0 0 0 1 1h5.2" />
      <rect className="app-file-icon__band" x="3.2" y="18.4" width="17.6" height="8" rx="1.2" />
      <text className="app-file-icon__label" x="12" y={pdf ? 24.1 : 24.6} textAnchor="middle">{pdf ? 'PDF' : 'W'}</text>
    </svg>
  );
}

export default function Documents() {
  const data = fixture();
  const [vendorFilter, setVendorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string>(data.documents[0]?.id ?? '');
  const [retryToken, setRetryToken] = useState(0);
  const tabRef = useRef<TabComponent | null>(null);

  const docs = useMemo(() => data.documents.filter(d =>
    (!vendorFilter || d.vendorName === vendorFilter) && (!typeFilter || d.type === typeFilter)),
  [data, vendorFilter, typeFilter]);

  const selected: DocRecord | undefined = docs.find(d => d.id === selectedId) ?? docs[0];
  // The open panel follows the selected file kind, not the tab event payload.
  const panel = selected?.fileKind === 'sfdt' ? 1 : 0;
  const panelRef = useRef(panel);
  panelRef.current = panel;

  useEffect(() => {
    const tab = tabRef.current;
    if (!tab || tab.selectedItem === panel) return;
    tab.select(panel);
  }, [panel]);

  type DdItem = { text: string; value: string; [k: string]: object | string };
  const vendorOptions: DdItem[] = [{ text: 'All vendors', value: '' },
    ...Array.from(new Set(data.documents.map(d => d.vendorName))).map(v => ({ text: v, value: v }))];
  const typeOptions: DdItem[] = [{ text: 'All types', value: '' },
    ...Array.from(new Set(data.documents.map(d => d.type))).map(t => ({ text: t, value: t }))];

  const listData = useMemo(() => docs.map(d => ({
    id: d.id, text: d.name, kind: d.fileKind, vendor: d.vendorName, type: d.type, updated: displayDate(d.updatedOn)
  })), [docs]);

  const itemTemplate = useCallback((item: { text: string; kind: string; type: string; updated: string }) => (
    <div className="app-lv-item">
      <FileKindIcon kind={item.kind} />
      <span className="app-lv-text">{item.text}</span>
      <span className="app-lv-meta">
        <span className="app-badge app-badge--neutral">{item.kind.toUpperCase()}</span>
        <span className="app-lv-secondary">Updated {item.updated}</span>
      </span>
    </div>
  ), []);

  // ListView selection drives the viewer.
  const onListSelect = (args: { data?: { id?: string } & Record<string, unknown> }) => {
    const id = args.data?.id;
    if (!id) return;
    setSelectedId(id);
  };

  const onTabSelected = (args: { selectedIndex?: number }) => {
    const index = args.selectedIndex;
    if (typeof index === 'number' && index !== panelRef.current) tabRef.current?.select(panelRef.current);
  };

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-page-title">Vendor Documents</h1>
          <p className="app-page-subtitle">Contracts, certificates and memos — selection opens the matching viewer</p>
        </div>
      </div>

      <div className="app-docs-layout">
        {/* Document list + filters */}
        <div className="e-card app-docs-list">
          <div className="e-card-header"><div className="e-card-header-caption"><p className="e-card-header-title">Documents</p><p className="e-card-sub-title">ListView · select to open</p></div></div>
          <div className="e-card-content">
            <div className="app-filter-bar" style={{ gap: 'var(--sf-space-3)' }}>
              <div className="app-filter-field">
                <label id="doc-vendor-label" htmlFor="doc-vendor">Vendor</label>
                <DropDownListComponent
                  id="doc-vendor"
                  dataSource={vendorOptions}
                  fields={{ text: 'text', value: 'value' }}
                  value={vendorFilter}
                  change={(e) => setVendorFilter(e.value as string)}
                  htmlAttributes={{ 'aria-labelledby': 'doc-vendor-label' }}
                />
              </div>
              <div className="app-filter-field">
                <label id="doc-type-label" htmlFor="doc-type">Type</label>
                <DropDownListComponent
                  id="doc-type"
                  dataSource={typeOptions}
                  fields={{ text: 'text', value: 'value' }}
                  value={typeFilter}
                  change={(e) => setTypeFilter(e.value as string)}
                  htmlAttributes={{ 'aria-labelledby': 'doc-type-label' }}
                />
              </div>
            </div>
            <ListViewComponent
              id="document-list"
              dataSource={listData}
              fields={{ id: 'id', text: 'text' }}
              showHeader={false}
              select={(args) => onListSelect(args as { data?: { id?: string } })}
              template={itemTemplate as never}
            />
          </div>
        </div>

        {/* PDF Viewer / Document Editor — selected document decides which one mounts.
            The Tab header-only version of the ej2 Tab (TabItemsDirective children) drops
            content children, so both viewers are rendered directly here instead. */}
        <div className="e-card app-docs-viewer">
          <TabComponent
            id="document-tabs"
            ref={tabRef}
            heightAdjustMode="Auto"
            selected={onTabSelected}
          >
            <TabItemsDirective>
              <TabItemDirective header={{ text: 'PDF Viewer' }} />
              <TabItemDirective header={{ text: 'Document Editor' }} />
            </TabItemsDirective>
          </TabComponent>
          {/* Tab content renders here. Tab items do not mount React children. */}
          <div className="app-tab-body">
            {panel === 0 ? (
              selected?.fileKind === 'pdf' ? (
                <Suspense fallback={<LoadingState label="Loading PDF Viewer…" variant="overlay" />}>
                  <PdfViewerLazy
                    key={`${selected.id}-${retryToken}`}
                    documentPath={`${BASE_ASSET}/${selected.fileName}`}
                    onRetry={() => setRetryToken(t => t + 1)}
                    fileName={selected.name}
                  />
                </Suspense>
              ) : (
                <div className="app-empty" role="status">Select a PDF document to view it here.</div>
              )
            ) : (
              selected?.fileKind === 'sfdt' ? (
                <Suspense fallback={<LoadingState label="Loading Document Editor…" variant="overlay" />}>
                  <DocumentEditorLazy key={selected.id} documentId={selected.id} />
                </Suspense>
              ) : (
                <div className="app-empty" role="status">Select a memo (sfdt) to edit it here. Edits are session-only.</div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
