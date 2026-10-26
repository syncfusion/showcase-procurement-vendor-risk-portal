// Document Editor panel (lazy-loaded on /documents only). Each sfdt id writes its own
// review document through the editor APIs. Edits stay in the session; nothing writes a file.
// No serviceUrl: the container runs standalone.
import { DocumentEditorContainerComponent, Toolbar, Print, SfdtExport, Editor, EditorHistory,
  ContextMenu, HyperlinkDialog, TableDialog, Selection, Search, Ribbon } from '@syncfusion/ej2-react-documenteditor';

DocumentEditorContainerComponent.Inject(Toolbar, Ribbon, Print, SfdtExport, Editor, EditorHistory,
  ContextMenu, HyperlinkDialog, TableDialog, Selection, Search);

type Block = { text: string; role: 'title' | 'heading' | 'body' };

const MEMO: Block[] = [
  { role: 'title', text: 'Vendor Onboarding Review Memo' },
  { role: 'body', text: 'Document PVR-MEMO-NW-2026-1001  |  1 October 2026  |  Internal procurement use' },
  { role: 'heading', text: '1. Parties and file' },
  { role: 'body', text: 'Prepared for Procurement & Vendor Risk. Supplier legal name: Northwind Industrial Supplies (vendor-01). Contact: contracts@northwind.example.com. Region and country: EMEA / Brazil. Category: Category 01 Cloud / Direct Materials. Years active: 16. Status: In Review. Reviewed by the session user in this public profile.' },
  { role: 'heading', text: '2. Purpose' },
  { role: 'body', text: 'This memo records the onboarding review before the file moves to Compliance Review. It covers the Master Services Agreement effective 2 September 2026 (PVR-MSA-NW-2026-0902) and the Mutual NDA effective 18 August 2026 (PVR-NDA-NW-2026-0818). It is not a contract award.' },
  { role: 'heading', text: '3. Commercial position' },
  { role: 'body', text: 'Annual spend baseline on the register: USD 28,525,521. The figure is a scoring baseline, not a volume commitment. Payment terms in the agreement are USD, net 30. On-time delivery recorded for the supplier: 73.4 percent.' },
  { role: 'heading', text: '4. Scorecard' },
  { role: 'body', text: 'A higher score is better. Watch starts at 50 and Low starts at 75. Composite 58, Watch band. Financial 77. Compliance 95. Delivery 87. Cyber 87. The composite score is the reason the file stays in Watch while the component scores for compliance, delivery, and cyber are stronger.' },
  { role: 'heading', text: '5. Evidence reviewed' },
  { role: 'body', text: 'ISO 9001 for the scoped supply process is current. The cyber questionnaire is complete, with role-based access and 72-hour incident notice. The insurance certificate expires within 60 days of this review. A renewal reminder is logged. That expiry is the open condition of Compliance Review.' },
  { role: 'heading', text: '6. Findings' },
  { role: 'body', text: 'Northwind Industrial Supplies can move forward on quality and information-security evidence. The commercial file matches the register: EMEA demand, Brazil supply, Category 01 Cloud, direct materials. No finding supports a different legal name. The delivery rate of 73.4 percent should be watched against the service level in the agreement, which requires a written improvement plan if the composite score falls below 50.' },
  { role: 'heading', text: '7. Recommendation' },
  { role: 'body', text: 'Proceed to Compliance Review. Track the insurance renewal as a condition of approval. Do not close the stage while the certificate remains inside the 60-day window unless a dated exception is recorded. Session edits in this editor are not written back to the register.' }
];

const QUESTIONNAIRE: Block[] = [
  { role: 'title', text: 'Supplier Questionnaire' },
  { role: 'body', text: 'Document PVR-Q-VX-2026-0922  |  Completed 22 September 2026  |  Procurement & Vendor Risk' },
  { role: 'heading', text: 'A. Company' },
  { role: 'body', text: 'Legal name: Vertex Components (vendor-03). Contact: contracts@vertex.example.com. Region and country: AMER / United Kingdom. Category: Category 03 Components / Indirect Materials. Years active: 8. Status: In Review. The supplier confirms that this legal name is the name on the vendor register.' },
  { role: 'heading', text: 'B. Commercial baseline' },
  { role: 'body', text: 'Annual spend baseline: USD 25,259,300. On-time delivery: 81.8 percent. These figures are the register values used for scoring. They are not a volume commitment and they do not award a contract.' },
  { role: 'heading', text: 'C. Quality' },
  { role: 'body', text: 'ISO 9001 is declared current for component manufacturing and kitting in the indirect-materials scope. The declared process covers incoming inspection, lot traceability, and a documented nonconformance loop back to contracts@vertex.example.com. Scope is Category 03 Components supplied into AMER. The supplier will attach the certificate schedule to the onboarding pack.' },
  { role: 'heading', text: 'D. Information security' },
  { role: 'body', text: 'Cyber risk score on file: 56, Watch band. Access is role-based and reviewed once a year. A confirmed incident that affects buyer data is notified within 72 hours to the buying desk and to contracts@vertex.example.com. Subcontractors that host buyer data are named in a schedule. Unapproved hosting is not permitted. No buyer data is used to train a model.' },
  { role: 'heading', text: 'E. Insurance and continuity' },
  { role: 'body', text: 'General liability and cargo cover are declared for component supply. The certificate is part of the onboarding pack. Expiry is monitored against the portal 60-day window. A certificate inside that window is an open condition and does not close Compliance Review on its own. Business continuity: the supplier can shift kitting to a named alternate site in the United Kingdom within 10 business days.' },
  { role: 'heading', text: 'F. Scorecard acknowledged' },
  { role: 'body', text: 'A higher score is better. Watch starts at 50 and Low starts at 75. Composite 68, Watch. Financial 62. Compliance 57. Delivery 80. Cyber 56. The supplier acknowledges the compliance score of 57 as the weakest component and will answer any follow-up from the onboarding desk before Category Approval.' },
  { role: 'heading', text: 'G. Declaration' },
  { role: 'body', text: 'The authorized representative of Vertex Components confirms that these answers describe the company registered with Procurement & Vendor Risk and may be used in the onboarding file dated 22 September 2026. Contact for questions: contracts@vertex.example.com. Edits made in this editor stay in the session.' }
];

const FALLBACK: Block[] = [
  { role: 'title', text: 'Vendor document' },
  { role: 'body', text: 'This session note is a placeholder for an sfdt document that is not the Northwind Industrial Supplies review memo or the Vertex Components supplier questionnaire. Use the supplier legal name from the vendor register when you add content.' }
];

function blocksFor(documentId: string): Block[] {
  if (documentId === 'doc-03') return MEMO;
  if (documentId === 'doc-05') return QUESTIONNAIRE;
  return FALLBACK;
}

function writeBlocks(documentId: string) {
  const host = document.getElementById('vendor-review-editor');
  const instances = (host as unknown as { ej2_instances?: Array<Record<string, unknown>> })?.ej2_instances ?? [];
  const container = instances[0] as {
    documentEditor?: {
      editor?: { insertText: (text: string) => void };
      selection?: {
        characterFormat: { bold: boolean; fontSize: number; fontFamily: string };
        paragraphFormat: { beforeSpacing: number; afterSpacing: number; textAlignment: 'Left' | 'Center' };
      };
    };
  } | undefined;
  const documentEditor = container?.documentEditor;
  const editor = documentEditor?.editor;
  const selection = documentEditor?.selection;
  if (!editor || !selection) return;

  selection.characterFormat.fontFamily = 'Calibri';
  selection.paragraphFormat.textAlignment = 'Left';
  for (const block of blocksFor(documentId)) {
    const heading = block.role === 'heading';
    const title = block.role === 'title';
    selection.characterFormat.bold = heading || title;
    selection.characterFormat.fontSize = title ? 20 : heading ? 13 : 11;
    selection.paragraphFormat.beforeSpacing = title ? 0 : heading ? 12 : 2;
    selection.paragraphFormat.afterSpacing = title ? 6 : heading ? 4 : 6;
    editor.insertText(`${block.text}\n`);
  }
}

export default function DocumentEditorPanel({ documentId }: { documentId: string }) {
  return (
    <div className="app-editor-host">
      <DocumentEditorContainerComponent
        id="vendor-review-editor"
        height="640px"
        enableToolbar={true}
        toolbarMode="Ribbon"
        showPropertiesPane={false}
        created={() => writeBlocks(documentId)}
      />
    </div>
  );
}
