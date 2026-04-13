import type { SyncItem } from '@/src/types/models';

export const syncItems: SyncItem[] = [
  {
    id: 'sync-001',
    label: 'Assets reference data',
    state: 'UpToDate',
    updatedAt: '2026-04-13T09:12:00+10:00',
    detail: 'Last refreshed this morning.',
  },
  {
    id: 'sync-002',
    label: 'Draft audit forms',
    state: 'Pending',
    updatedAt: '2026-04-13T08:55:00+10:00',
    detail: '2 drafts queued for upload.',
  },
  {
    id: 'sync-003',
    label: 'Photo attachments',
    state: 'Offline',
    updatedAt: '2026-04-13T08:55:00+10:00',
    detail: 'Will upload when connected to Wi‑Fi.',
  },
  {
    id: 'sync-004',
    label: 'Condition report tasks',
    state: 'Pending',
    updatedAt: '2026-04-13T11:16:00+10:00',
    detail: '3 newly assigned tasks downloaded; 1 completion upload pending.',
  },
  {
    id: 'sync-005',
    label: 'Asset photos cache',
    state: 'Pending',
    updatedAt: '2026-04-13T11:16:00+10:00',
    detail: '18 new site photos queued for cloud backup.',
  },
];

