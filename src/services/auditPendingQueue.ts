import AsyncStorage from '@react-native-async-storage/async-storage';

export type PendingAuditStatus = 'Draft' | 'PendingSync' | 'SyncFailed';
export type PendingOperationalStatus = 'Operational' | 'Partially Operational' | 'Not Operational' | 'Not Inspected';
export type PendingPriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type PendingAuditPhoto = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  uploadedUrl?: string | null;
  remotePath?: string | null;
};

export type PendingAuditSubmission = {
  id: string;
  reportId: string;
  reportAssetId: string;
  assetId: string;
  assetCode?: string;
  assetName?: string;
  locationId?: string;

  status: PendingAuditStatus;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;

  conditionRating: number;
  expectedRemainingLifeYears: number | null;
  operationalStatus: PendingOperationalStatus;

  maintenanceRequired: boolean;
  replacementRequired: boolean;
  priorityLevel: PendingPriorityLevel;
  estimatedMaintenanceCost: number | null;
  estimatedReplacementCost: number | null;

  safetyConcern: boolean;
  issueDescription: string | null;
  recommendedAction: string | null;
  generalNotes: string | null;

  photos: PendingAuditPhoto[];
};

const STORAGE_KEY = '@cws/pending_audit_submissions_v1';

function nowIso() {
  return new Date().toISOString();
}

function safeSubmission(value: unknown): PendingAuditSubmission | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<PendingAuditSubmission>;

  if (!item.reportId || !item.reportAssetId || !item.assetId) return null;

  return {
    id: item.id || item.reportAssetId,
    reportId: item.reportId,
    reportAssetId: item.reportAssetId,
    assetId: item.assetId,
    assetCode: item.assetCode || '',
    assetName: item.assetName || '',
    locationId: item.locationId || '',
    status: item.status || 'Draft',
    lastError: item.lastError ?? null,
    createdAt: item.createdAt || nowIso(),
    updatedAt: item.updatedAt || nowIso(),
    conditionRating: typeof item.conditionRating === 'number' ? item.conditionRating : 3,
    expectedRemainingLifeYears:
      typeof item.expectedRemainingLifeYears === 'number' ? item.expectedRemainingLifeYears : null,
    operationalStatus: item.operationalStatus || 'Operational',
    maintenanceRequired: Boolean(item.maintenanceRequired),
    replacementRequired: Boolean(item.replacementRequired),
    priorityLevel: item.priorityLevel || 'Low',
    estimatedMaintenanceCost:
      typeof item.estimatedMaintenanceCost === 'number' ? item.estimatedMaintenanceCost : null,
    estimatedReplacementCost:
      typeof item.estimatedReplacementCost === 'number' ? item.estimatedReplacementCost : null,
    safetyConcern: Boolean(item.safetyConcern),
    issueDescription: item.issueDescription ?? null,
    recommendedAction: item.recommendedAction ?? null,
    generalNotes: item.generalNotes ?? null,
    photos: Array.isArray(item.photos)
      ? item.photos.filter((photo): photo is PendingAuditPhoto => Boolean(photo?.uri))
      : [],
  };
}

export async function getAllPendingAuditSubmissions(): Promise<PendingAuditSubmission[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(safeSubmission)
      .filter((item): item is PendingAuditSubmission => Boolean(item));
  } catch {
    return [];
  }
}

async function setAllPendingAuditSubmissions(items: PendingAuditSubmission[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getPendingReportAudits(reportId: string): Promise<PendingAuditSubmission[]> {
  const items = await getAllPendingAuditSubmissions();
  return items.filter((item) => item.reportId === reportId);
}

export async function getPendingAuditForReportAsset(reportAssetId: string): Promise<PendingAuditSubmission | null> {
  const items = await getAllPendingAuditSubmissions();
  return items.find((item) => item.reportAssetId === reportAssetId) ?? null;
}

export async function savePendingAuditSubmission(
  submission: Omit<PendingAuditSubmission, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<void> {
  const items = await getAllPendingAuditSubmissions();
  const existing = items.find((item) => item.reportAssetId === submission.reportAssetId);
  const timestamp = nowIso();

  const next: PendingAuditSubmission = {
    ...submission,
    id: submission.id || existing?.id || submission.reportAssetId,
    createdAt: submission.createdAt || existing?.createdAt || timestamp,
    updatedAt: timestamp,
    photos: submission.photos ?? [],
  };

  const withoutExisting = items.filter((item) => item.reportAssetId !== submission.reportAssetId);
  await setAllPendingAuditSubmissions([...withoutExisting, next]);
}

export async function removePendingAuditSubmission(reportAssetId: string): Promise<void> {
  const items = await getAllPendingAuditSubmissions();
  await setAllPendingAuditSubmissions(items.filter((item) => item.reportAssetId !== reportAssetId));
}

export async function clearPendingReportAudits(reportId: string): Promise<void> {
  const items = await getAllPendingAuditSubmissions();
  await setAllPendingAuditSubmissions(items.filter((item) => item.reportId !== reportId));
}

export function getPendingReportStats(items: PendingAuditSubmission[], reportAssetIds: string[]) {
  const relevant = items.filter((item) => reportAssetIds.includes(item.reportAssetId));
  const drafts = relevant.filter((item) => item.status === 'Draft').length;
  const pendingSync = relevant.filter((item) => item.status === 'PendingSync').length;
  const syncFailed = relevant.filter((item) => item.status === 'SyncFailed').length;

  return {
    totalPending: relevant.length,
    drafts,
    pendingSync,
    syncFailed,
    hasBlockingPending: relevant.length > 0,
  };
}
