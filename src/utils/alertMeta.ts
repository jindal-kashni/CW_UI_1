import type { AlertItem } from '@/src/types/models';

export function getAlertMeaning(kind: AlertItem['kind']) {
  switch (kind) {
    case 'OverdueAudit':
      return 'An assigned audit is due soon or overdue. Complete it to keep compliance and condition tracking up to date.';
    case 'CriticalCondition':
      return 'A high-risk condition was recorded on an asset. This should be verified and actioned quickly.';
    case 'SyncIssue':
      return 'Local updates are not fully synced. Data may be stale across devices until sync succeeds.';
    case 'AssetFlag':
      return 'An asset has been flagged for follow-up by audit or maintenance observations.';
    default:
      return 'Operational alert for auditor review.';
  }
}

export function getAlertAction(kind: AlertItem['kind']) {
  switch (kind) {
    case 'OverdueAudit':
      return { label: 'Perform audit', href: '/audits' };
    case 'CriticalCondition':
      return { label: 'Inspect asset', href: null };
    case 'SyncIssue':
      return { label: 'Open sync', href: '/offline-sync' };
    case 'AssetFlag':
      return { label: 'Review asset', href: null };
    default:
      return { label: 'Open', href: '/audits' };
  }
}

