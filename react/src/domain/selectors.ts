// Domain selectors: pure functions over the session snapshot (framework-free).
import type { Approval, Stage, Vendor } from '../data/loader';
import { demoToday } from '../data/loader';
import { daysFrom } from './format';

export const EXPIRY_SOON_DAYS = 60;

export function bandOf(score: number): 'Low' | 'Watch' | 'Critical' {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'Watch';
  return 'Low';
}

export function riskBandLabel(score: number): 'Low' | 'Watch' | 'Critical' {
  return bandOf(score);
}

export function expiringSoon(certExpiresOn: string): boolean {
  const days = daysFrom(demoToday, certExpiresOn);
  return days >= 0 && days <= EXPIRY_SOON_DAYS;
}
export function expired(certExpiresOn: string): boolean {
  return daysFrom(demoToday, certExpiresOn) < 0;
}

export function overdueApproval(a: Approval): boolean {
  return daysFrom(demoToday, a.dueOn) < 0;
}

export function vendorsInReview(vendors: Vendor[]): number {
  return vendors.filter((v) => v.status === 'In Review').length;
}

export function pendingApprovals(approvals: Approval[]): number {
  return approvals.filter((a) => a.stage !== 'Approved').length;
}

export function certificatesExpiringSoon(vendors: Vendor[], certificates: { vendorId: string; expiresOn: string }[]): number {
  const activeIds = new Set(vendors.map((v) => v.id));
  return certificates.filter((c) => activeIds.has(c.vendorId) && expiringSoon(c.expiresOn)).length;
}

export function portfolioRiskIndex(vendors: Vendor[]): number {
  return Math.round(vendors.reduce((sum, v) => sum + v.compositeRiskScore, 0) / vendors.length);
}

export function spendUnderManagement(vendors: Vendor[]): number {
  return vendors.filter((v) => v.status === 'Active').reduce((sum, v) => sum + v.annualSpend, 0);
}

/** Vendors by band for the donut: slices largest first (chart draws clockwise from data order). */
export function vendorsByBand(vendors: Vendor[]): { band: string; count: number }[] {
  const counts = { Critical: 0, Watch: 0, Low: 0 } as Record<string, number>;
  for (const v of vendors) counts[riskBandLabel(v.compositeRiskScore)]++;
  return Object.entries(counts)
    .map(([band, count]) => ({ band, count }))
    .sort((a, b) => b.count - a.count);
}

export const STAGE_ORDER: Stage[] = ['Submitted', 'Risk Review', 'Compliance Review', 'Category Approval', 'Approved'];
export function approvalsByStage(approvals: Approval[]): { stage: Stage; count: number; overdue: number }[] {
  return STAGE_ORDER.map((stage) => {
    const inStage = approvals.filter((a) => a.stage === stage);
    return { stage, count: inStage.length, overdue: inStage.filter(overdueApproval).length };
  });
}