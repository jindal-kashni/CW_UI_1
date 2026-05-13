import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  AdminAuditResultRecord,
  AuditorReportRecord,
  ReportAssetForAuditRecord,
  ReportDetailsRecord,
} from '@/src/services/reports';

const STORAGE_KEY = '@cws/auditor_reports_offline_cache_v1';

type OfflineReportCache = {
  updatedAt: string | null;
  reports: AuditorReportRecord[];
  reportDetails: Record<string, ReportDetailsRecord>;
};

function emptyCache(): OfflineReportCache {
  return {
    updatedAt: null,
    reports: [],
    reportDetails: {},
  };
}

function nowIso() {
  return new Date().toISOString();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeCache(value: unknown): OfflineReportCache {
  if (!value || typeof value !== 'object') return emptyCache();
  const raw = value as Partial<OfflineReportCache>;

  return {
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    reports: safeArray<AuditorReportRecord>(raw.reports),
    reportDetails:
      raw.reportDetails && typeof raw.reportDetails === 'object'
        ? (raw.reportDetails as Record<string, ReportDetailsRecord>)
        : {},
  };
}

async function readCache(): Promise<OfflineReportCache> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCache();
    return safeCache(JSON.parse(raw));
  } catch {
    return emptyCache();
  }
}

async function writeCache(cache: OfflineReportCache): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...cache,
      updatedAt: nowIso(),
    })
  );
}

export async function getOfflineCacheUpdatedAt(): Promise<string | null> {
  const cache = await readCache();
  return cache.updatedAt;
}

export async function cacheAuditorReports(reports: AuditorReportRecord[]): Promise<void> {
  const cache = await readCache();
  await writeCache({
    ...cache,
    reports,
  });
}

export async function getCachedAuditorReports(): Promise<AuditorReportRecord[]> {
  const cache = await readCache();
  return cache.reports;
}

export async function cacheReportDetail(report: ReportDetailsRecord): Promise<void> {
  const cache = await readCache();
  const reportDetails = {
    ...cache.reportDetails,
    [report.id]: report,
  };

  const reports = mergeSummaryIntoCachedReports(cache.reports, report);

  await writeCache({
    ...cache,
    reports,
    reportDetails,
  });
}

export async function cacheReportDetails(reports: ReportDetailsRecord[]): Promise<void> {
  const cache = await readCache();
  const reportDetails = { ...cache.reportDetails };
  let summaries = cache.reports;

  for (const report of reports) {
    reportDetails[report.id] = report;
    summaries = mergeSummaryIntoCachedReports(summaries, report);
  }

  await writeCache({
    ...cache,
    reports: summaries,
    reportDetails,
  });
}

export async function getCachedReportDetail(reportId: string): Promise<ReportDetailsRecord | null> {
  if (!reportId) return null;
  const cache = await readCache();
  return cache.reportDetails[reportId] ?? null;
}

export async function getCachedReportAssetForAudit(reportAssetId: string): Promise<ReportAssetForAuditRecord | null> {
  if (!reportAssetId) return null;
  const cache = await readCache();

  for (const report of Object.values(cache.reportDetails)) {
    const asset = report.assets.find((item) => item.id === reportAssetId);
    if (!asset) continue;

    return {
      reportAssetId: asset.id,
      reportId: report.id,
      reportTitle: report.title,
      reportDescription: report.description,
      reportSummary: report.summary,
      reportDueDate: report.dueDate,
      reportProgressPct: report.progressPct,
      reportStatus: report.rawStatus,
      reportCompletedAt: report.submittedAt ?? '',
      isReportFinalised: report.rawStatus === 'Completed',
      assetId: asset.assetId,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      category: asset.category,
      subCategory: asset.subCategory,
      locationId: asset.locationId,
      locationName: asset.locationName,
      roomId: asset.roomId,
      roomName: asset.roomName,
      departmentId: asset.departmentId,
      departmentName: asset.departmentName,
      assignedUserId: asset.assignedUserId || report.assignedUserId,
      dueDate: asset.dueDate || report.dueDate,
      status: asset.status,
      notes: asset.notes,
      startedAt: asset.startedAt,
      completedAt: asset.completedAt,
    };
  }

  return null;
}

export async function getCachedSubmittedAuditResult(reportAssetId: string): Promise<AdminAuditResultRecord | null> {
  if (!reportAssetId) return null;
  const cache = await readCache();

  for (const report of Object.values(cache.reportDetails)) {
    const asset = report.assets.find((item) => item.id === reportAssetId);
    if (asset?.auditResult) return asset.auditResult;
  }

  return null;
}

export async function updateCachedReportAssetAfterSubmit(params: {
  reportId: string;
  reportAssetId: string;
  auditResult?: AdminAuditResultRecord | null;
}): Promise<void> {
  const cache = await readCache();
  const report = cache.reportDetails[params.reportId];
  if (!report) return;

  const completedAt = new Date().toISOString();
  const assets = report.assets.map((asset) =>
    asset.id === params.reportAssetId
      ? {
          ...asset,
          status: 'Completed' as const,
          completedAt,
          auditResult: params.auditResult ?? asset.auditResult ?? null,
        }
      : asset
  );

  const completedAssetCount = assets.filter((asset) => asset.status === 'Completed').length;
  const progressPct = assets.length === 0 ? 0 : Math.round((completedAssetCount / assets.length) * 100);

  const updatedReport: ReportDetailsRecord = {
    ...report,
    progressPct,
    findings: assets.length > 0 ? `${completedAssetCount}/${assets.length} assets completed` : 'No assets assigned',
    assets,
    rawStatus: report.rawStatus === 'Completed' ? 'Completed' : progressPct > 0 ? 'InProgress' : report.rawStatus,
    status: report.rawStatus === 'Completed' ? 'Completed' : progressPct > 0 ? 'InProgress' : 'ToDo',
  };

  await cacheReportDetail(updatedReport);
}

export async function markCachedReportFinalised(reportId: string): Promise<void> {
  const cache = await readCache();
  const report = cache.reportDetails[reportId];
  const completedAt = new Date().toISOString();

  if (report) {
    await cacheReportDetail({
      ...report,
      rawStatus: 'Completed',
      status: 'Completed',
      progressPct: 100,
      submittedAt: completedAt.slice(0, 10),
    });
    return;
  }

  const reports = cache.reports.map((item) =>
    item.id === reportId
      ? {
          ...item,
          status: 'Completed' as const,
          progressPct: 100,
          completedAssetCount: item.assetCount,
        }
      : item
  );

  await writeCache({ ...cache, reports });
}

export async function clearOfflineReportCache(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function mergeSummaryIntoCachedReports(
  cachedReports: AuditorReportRecord[],
  report: ReportDetailsRecord
): AuditorReportRecord[] {
  const completedAssetCount = report.assets.filter((asset) => asset.status === 'Completed').length;
  const summary: AuditorReportRecord = {
    id: report.id,
    title: report.title,
    description: report.description,
    summary: report.summary,
    locationId: report.locationId,
    locationName: report.assets[0]?.locationName || report.locationId || '',
    assignedUserId: report.assignedUserId,
    status: report.rawStatus === 'Completed' ? 'Completed' : report.progressPct > 0 ? 'InProgress' : 'Assigned',
    dueDate: report.dueDate,
    progressPct: report.progressPct,
    assetCount: report.assets.length,
    completedAssetCount,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };

  const without = cachedReports.filter((item) => item.id !== report.id);
  return [...without, summary].sort((a, b) => {
    const aDue = a.dueDate || '9999-12-31';
    const bDue = b.dueDate || '9999-12-31';
    if (aDue !== bDue) return aDue.localeCompare(bDue);
    return b.createdAt.localeCompare(a.createdAt);
  });
}
