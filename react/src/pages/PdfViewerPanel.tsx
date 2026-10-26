// PDF Viewer panel, lazy-loaded on /documents only. It loads a static file from
// public/documents/ and runs standalone (no serviceUrl). A load failure shows a
// labelled alert and Retry (role="alert"), never an empty panel.
import { useEffect, useState } from 'react';
import { PdfViewerComponent } from '@syncfusion/ej2-react-pdfviewer';

export default function PdfViewerPanel({ documentPath, fileName, onRetry }: {
  documentPath: string; fileName: string; onRetry: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setFailed(false); setLoaded(false); }, [documentPath]);

  if (failed) {
    return (
      <div className="app-error" role="alert">
        <p className="app-error-title">The document could not be loaded</p>
        <p className="app-error-detail">{fileName}</p>
        <button type="button" className="app-button app-button--primary" onClick={() => { setFailed(false); onRetry(); }}>Retry loading</button>
      </div>
    );
  }

  return (
    <div className="app-pdf-host">
      {!loaded && <div className="app-loading app-loading--overlay" role="status" aria-live="polite">
        <div className="app-loading__ring" aria-hidden="true" /><div>Loading {fileName}…</div>
      </div>}
      <PdfViewerComponent
        id="vendor-pdf-viewer"
        // Client-side rendering fetches the document itself, and only when the path is an
        // absolute http(s) URL — a relative path never fetches and the viewer stalls on its
        // loading indicator. Resolve the app-relative asset against the page origin.
        documentPath={`${window.location.origin}${documentPath}`}
        // Vendored PDFium worker/wasm (public/ej2-pdfviewer-lib, matching the package
        // version): the viewer's default script-path lookup misses in this layout, and a
        // missing pdfium.js takes the whole viewer down instead of rendering the document.
        resourceUrl={`${window.location.origin}/ej2-pdfviewer-lib`}
        documentLoad={() => setLoaded(true)}
        documentLoadFailed={() => setFailed(true)}
        enableDownload={false}
        enablePrint={false}
        style={{ height: '640px' }}
      />
    </div>
  );
}