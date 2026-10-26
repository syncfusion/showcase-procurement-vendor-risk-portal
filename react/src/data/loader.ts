// Typed loader for the bundled v1 fixture. No backend, and no writes to shipped files.
// Session mutations happen in the session store only.
import raw from './fixtures/procurement-vendor-risk.v1.json';
import { parseDate } from '../domain/format';

export type VendorStatus = 'Active' | 'In Review' | 'On Hold' | 'Blocked';
export type Stage = 'Submitted' | 'Risk Review' | 'Compliance Review' | 'Category Approval' | 'Approved';
export type FileKind = 'pdf' | 'sfdt';

export interface GroupNode { id: string; name: string; parentId: null; region: null; kind: 'group'; hasChildren: true }
export interface CategoryNode { id: string; name: string; parentId: string; kind: 'category'; region: string }
export interface Category { id: string; name: string; parentId: string; parentName: string; region: string }
export interface Group { id: string; name: string; parentId: null }

export interface Vendor {
  id: string; name: string; categoryId: string; categoryName: string; categoryGroup: string;
  region: string; country: string; annualSpend: number; onTimeDeliveryRate: number;
  compositeRiskScore: number; financialRisk: number; complianceRisk: number; deliveryRisk: number; cyberRisk: number;
  status: VendorStatus; contact: string; yearsActive: number;
}

export interface ScorePoint { vendorId: string; month: string; compositeRiskScore: number }
export interface Certificate { id: string; vendorId: string; type: string; issuedOn: string; expiresOn: string }
export interface ChecklistItem { item: string; done: boolean }
export interface AuditEntry { ts: string; actor: string; action: string }
export interface Approval {
  id: string; vendorId: string; vendorName: string; region: string; stage: Stage; owner: string;
  submittedOn: string; dueOn: string; checklist: ChecklistItem[]; checklistDone: number; checklistTotal: number;
  auditTrail: AuditEntry[];
}
export interface DocRecord {
  id: string; name: string; vendorId: string; vendorName: string; type: string;
  fileKind: FileKind; fileName: string | null; updatedOn: string;
}

export interface Fixture {
  schemaVersion: number; demoToday: string; timezone: string; currency: string;
  months: string[]; tree: (GroupNode | CategoryNode)[]; categories: Category[]; groups: Group[];
  vendors: Vendor[]; scoreHistory: ScorePoint[]; certificates: Certificate[];
  approvals: Approval[]; documents: DocRecord[]; regions: string[];
  riskBands: { label: string; tone: string; min: number }[];
  stages: string[];
}

const data = raw as unknown as Fixture;

export const fixture = (): Fixture => data;
export const demoToday = data.demoToday;
export const parseToday = parseDate(data.demoToday);

// Reject a fixture that does not match the shape this build expects.
export function validateFixture(d: Fixture): void {
  if (d.schemaVersion !== 1) throw new Error(`Unexpected fixture schemaVersion ${d.schemaVersion}`);
  if (d.vendors.length !== 46) throw new Error(`Expected 46 vendors, got ${d.vendors.length}`);
  if (d.months.length !== 12) throw new Error(`Expected 12 months, got ${d.months.length}`);
  if (d.approvals.length !== 30) throw new Error(`Expected 30 approvals, got ${d.approvals.length}`);
  const ids = new Set(d.vendors.map((v) => v.id));
  if (ids.size !== d.vendors.length) throw new Error('Duplicate vendor ids');
  for (const v of d.vendors) {
    if (v.compositeRiskScore < 0 || v.compositeRiskScore > 100) throw new Error(`Vendor ${v.id} score out of range`);
    if (v.onTimeDeliveryRate < 0 || v.onTimeDeliveryRate > 1) throw new Error(`Vendor ${v.id} OTD out of range`);
  }
}

validateFixture(data);