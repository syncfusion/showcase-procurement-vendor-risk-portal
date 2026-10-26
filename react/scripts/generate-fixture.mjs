// Deterministic fixture generator for the Procurement & Vendor Risk Management Portal.
// Run: node scripts/generate-fixture.mjs
// Writes src/data/fixtures/procurement-vendor-risk.v1.json.
// demo-today: 2026-10-15. All dates ISO; en-US display; USD.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/fixtures/procurement-vendor-risk.v1.json');

// Small deterministic PRNG (mulberry32) so the fixture is reproducible.
function rng(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261015);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const rint = (min, max) => min + Math.floor(rand() * (max - min + 1));

// ---- Categories (12, 2-level: group -> category) ----
const groups = ['Direct Materials', 'Indirect Materials', 'Logistics', 'Professional Services', 'IT & Software', 'Facilities'];
const categories = [];
let catNo = 1;
for (const g of groups) {
  const n = rint(1, 2);
  for (let i = 0; i < n && catNo <= 12; i++) {
    categories.push({ id: `cat-${String(catNo).padStart(2, '0')}`, name: `Category ${String(catNo).padStart(2, '0')} ${pick(['Components', 'Packaging', 'Freight', 'Consulting', 'Cloud', 'Maintenance', 'Raw', 'Tooling', 'Audit'])}`, parentId: `group-${groups.indexOf(g) + 1}`, parentName: g, region: pick(['AMER', 'EMEA', 'APAC']) });
    catNo++;
  }
}
const groupNodes = groups.map((g, i) => ({ id: `group-${i + 1}`, name: g, parentId: null, region: null }));
const parentName = {};
for (const c of categories) parentName[c.id] = c.parentName;

// ---- Vendors (46) ----
const vendorWords = ['Northwind', 'Acme', 'Vertex', 'Global', 'Apex', 'Summit', 'Cascade', 'Pioneer', 'Atlas', 'Crestline', 'BluePeak', 'Ironbridge', 'Meridian', 'Oakfield', 'Silverline', 'Triton', 'Quantex', 'Harborside', 'Redstone', 'Vanguard', 'Windmere', 'Zenith', 'Ironclad', 'Lakeshore', 'Brightpath', 'Cornerstone', 'Delmar', 'Eastwood', 'Fairpoint', 'Granite', 'Hollis', 'Interlink', 'Juniper', 'Kingston', 'Larkspur', 'Maplewood', 'Norwood', 'Oakhurst', 'Pinewood', 'Quarrystone', 'Riverbend', 'Stonebridge', 'Talbot', 'Umber', 'Verdant'];
const suffixes = ['Industrial Supplies', 'Logistics', 'Components', 'Packaging', 'Systems', 'Consulting', 'Materials', 'Distribution', 'Technologies', 'Group'];
const statuses = ['Active', 'Active', 'Active', 'In Review', 'On Hold'];
const owners = ['J. Lau', 'R. Mora', 'K. Tan', 'D. Silva', 'A. Novak', 'P. Iyer'];
const vendors = [];
for (let i = 0; i < 46; i++) {
  const name = `${vendorWords[i % vendorWords.length]} ${suffixes[i % suffixes.length]}`;
  const category = categories[i % categories.length];
  const composite = rint(28, 92);
  vendors.push({
    id: `vendor-${String(i + 1).padStart(2, '0')}`,
    name,
    categoryId: category.id,
    categoryName: category.name,
    categoryGroup: category.parentName,
    region: category.region,
    country: pick(['USA', 'Germany', 'India', 'Japan', 'Brazil', 'Canada', 'Singapore', 'UK']),
    annualSpend: rint(400000, 42000000),
    onTimeDeliveryRate: Number((0.72 + rand() * 0.26).toFixed(3)),
    compositeRiskScore: composite,
    financialRisk: Math.min(100, Math.max(10, composite + rint(-12, 12))),
    complianceRisk: Math.min(100, Math.max(10, composite + rint(-12, 12))),
    deliveryRisk: Math.min(100, Math.max(10, composite + rint(-12, 12))),
    cyberRisk: Math.min(100, Math.max(10, composite + rint(-12, 12))),
    status: i < 5 ? 'In Review' : pick(statuses),
    contact: `contracts@${vendorWords[i % vendorWords.length].toLowerCase()}.example.com`,
    yearsActive: rint(1, 18)
  });
}
// Pin the first vendor so the default selection and fixture checks stay stable.
vendors[0] = { ...vendors[0], id: 'vendor-01', name: 'Northwind Industrial Supplies', categoryId: categories[0].id, categoryName: categories[0].name, categoryGroup: categories[0].parentName, region: categories[0].region, compositeRiskScore: 58, status: 'In Review' };

// ---- Score history (12 months x 46 vendors, 2025-10 .. 2026-09) ----
const months = [];
for (let m = 10; m <= 12; m++) months.push(`2025-${String(m).padStart(2, '0')}`);
for (let m = 1; m <= 9; m++) months.push(`2026-${String(m).padStart(2, '0')}`);
const scoreHistory = [];
for (const vendor of vendors) {
  let score = Math.min(95, Math.max(20, vendor.compositeRiskScore + rint(-14, 6)));
  for (const month of months) {
    scoreHistory.push({ vendorId: vendor.id, month, compositeRiskScore: Math.min(95, Math.max(20, score + rint(-4, 5))) });
  }
  // Ensure the final month matches the register's current score.
  const last = scoreHistory[scoreHistory.length - 1];
  last.compositeRiskScore = vendor.compositeRiskScore;
}

// ---- Certificates ----
const certTypes = ['ISO 9001', 'ISO 27001', 'Cyber', 'Insurance', 'Diversity', 'Financial Audit'];
const certificates = [];
let certNo = 1;
for (const vendor of vendors) {
  const n = rint(1, 3);
  for (let i = 0; i < n; i++) {
    const type = certTypes[(i + vendors.indexOf(vendor)) % certTypes.length];
    const issued = `202${rint(3, 5)}-${String(rint(1, 12)).padStart(2, '0')}-${String(rint(1, 28)).padStart(2, '0')}`;
    // Spread expiries so some are expired, some soon (<= 60 days), some fine — vs demo-today 2026-10-15.
    const mode = certNo % 5;
    let expires;
    if (mode === 0) expires = `2026-0${rint(1, 9)}-${String(rint(1, 28)).padStart(2, '0')}`; // already expired
    else if (mode === 1) expires = `2026-1${rint(1, 2)}-${String(rint(1, 30)).padStart(2, '0')}`; // soon (Oct-Dec 2026)
    else expires = `202${rint(7, 8)}-${String(rint(1, 12)).padStart(2, '0')}-${String(rint(1, 28)).padStart(2, '0')}`;
    certificates.push({ id: `cert-${String(certNo).padStart(3, '0')}`, vendorId: vendor.id, type, issuedOn: issued, expiresOn: expires });
    certNo++;
  }
}

// ---- Approvals (~30 records, 5 stages; allowed moves forward-one, back only Risk Review -> Submitted) ----
const stages = ['Submitted', 'Risk Review', 'Compliance Review', 'Category Approval', 'Approved'];
const inReviewVendorIds = vendors.filter((v) => v.status === 'In Review').map((v) => v.id).slice(0, 8);
const approvalVendorIds = [...inReviewVendorIds];
const otherVendors = vendors.filter((v) => !inReviewVendorIds.includes(v.id));
for (let i = 0; approvalVendorIds.length < 30 && i < otherVendors.length; i++) approvalVendorIds.push(otherVendors[i].id);
const approvals = [];
let aprNo = 1;
for (const vendorId of approvalVendorIds.slice(0, 30)) {
  const vendor = vendors.find((v) => v.id === vendorId);
  const stage = stages[(aprNo - 1) % 5];
  const submittedOn = `2026-0${rint(7, 9)}-${String(rint(1, 28)).padStart(2, '0')}`;
  // Some due before demo-today (overdue), most after.
  const dueOn = aprNo % 4 === 0 ? `2026-10-0${rint(1, 9)}` : `2026-${pick(['10', '11', '12'])}-${String(rint(16, 28)).padStart(2, '0')}`;
  const checklist = [
    { item: 'W-9 / tax forms on file', done: true },
    { item: 'Insurance certificate', done: rand() > 0.35 },
    { item: 'Cyber questionnaire', done: rand() > 0.4 },
    { item: 'Financial health review', done: rand() > 0.5 },
    { item: 'Supplier code of conduct', done: rand() > 0.3 }
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  approvals.push({
    id: `apr-${String(aprNo).padStart(3, '0')}`,
    vendorId,
    vendorName: vendor.name,
    region: vendor.region,
    stage,
    owner: pick(owners),
    submittedOn,
    dueOn,
    checklist,
    checklistDone: doneCount,
    checklistTotal: checklist.length,
    auditTrail: [{ ts: `${submittedOn} 09:14`, actor: pick(owners), action: 'Submitted for onboarding' }]
  });
  aprNo++;
}

// ---- Documents ----
const documents = [
  { id: 'doc-01', name: 'Master Services Agreement — Northwind Industrial Supplies.pdf', vendorId: 'vendor-01', vendorName: vendors[0].name, type: 'Contract', fileKind: 'pdf', fileName: 'northwind-master-services-agreement.pdf', updatedOn: '2026-09-02' },
  { id: 'doc-02', name: 'Mutual NDA — Northwind Industrial Supplies.pdf', vendorId: 'vendor-01', vendorName: vendors[0].name, type: 'Contract', fileKind: 'pdf', fileName: 'northwind-mutual-nda.pdf', updatedOn: '2026-08-18' },
  { id: 'doc-03', name: 'Vendor Onboarding Review Memo — Northwind Industrial Supplies.sfdt', vendorId: 'vendor-01', vendorName: vendors[0].name, type: 'Review Memo', fileKind: 'sfdt', fileName: null, updatedOn: '2026-10-01' },
  { id: 'doc-04', name: 'ISO 27001 Certificate — Acme Logistics.pdf', vendorId: 'vendor-02', vendorName: vendors[1].name, type: 'Certificate', fileKind: 'pdf', fileName: 'acme-logistics-iso-27001.pdf', updatedOn: '2026-07-11' },
  { id: 'doc-05', name: 'Supplier Questionnaire — Vertex Components.sfdt', vendorId: 'vendor-03', vendorName: vendors[2].name, type: 'Questionnaire', fileKind: 'sfdt', fileName: null, updatedOn: '2026-09-22' }
];

// ---- Assemble ----
const fixture = {
  schemaVersion: 1,
  generatedFor: 'procurement-vendor-risk-portal',
  demoToday: '2026-10-15',
  timezone: 'America/New_York',
  currency: 'USD',
  months,
  tree: [...groupNodes.map((g) => ({ ...g, kind: 'group' })), ...categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId, kind: 'category', region: c.region }))],
  categories,
  groups: groupNodes,
  vendors,
  scoreHistory,
  certificates,
  approvals,
  documents,
  regions: ['AMER', 'EMEA', 'APAC'],
  riskBands: [
    { label: 'Low', tone: 'success', min: 75 },
    { label: 'Watch', tone: 'warning', min: 50 },
    { label: 'Critical', tone: 'danger', min: 0 }
  ],
  stages
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(fixture, null, 2));
console.log(`Fixture written: ${OUT}`);
console.log(`vendors=${vendors.length} months=${months.length} scoreHistory=${scoreHistory.length} certificates=${certificates.length} approvals=${approvals.length} documents=${documents.length}`);
// Log the spend total after the file is written.
const totalSpend = vendors.reduce((sum, v) => sum + v.annualSpend, 0);
console.log(`totalSpend=${totalSpend}`);