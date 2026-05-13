import { supabase } from '@/utils/supabase';
import { type AdminReportRecord } from '@/src/data/admin';
import type { AuditAssignment, AuditStatus } from '@/src/types/models';
import { uploadPhoto, saveAttachmentReference, type CapturedPhoto } from '@/src/services/photos';
import {
  getPendingReportAudits,
  removePendingAuditSubmission,
  savePendingAuditSubmission,
  type PendingAuditPhoto,
} from '@/src/services/auditPendingQueue';
import {
  cacheAuditorReports,
  cacheReportDetail,
  getCachedAuditorReports,
  getCachedReportAssetForAudit,
  getCachedReportDetail,
  getCachedSubmittedAuditResult,
  markCachedReportFinalised,
  updateCachedReportAssetAfterSubmit,
} from '@/src/services/auditOfflineCache';

type ReportStatus = 'Draft' | 'Assigned' | 'InProgress' | 'Completed' | 'Cancelled';
type ReportAssetStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Flagged' | 'Skipped';

type AuditOperationalStatus = 'Operational' | 'Partially Operational' | 'Not Operational' | 'Not Inspected';
type AuditPriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

type AuditResultRow = {
  asset_audit_report_id: string;
  report_id: string | null;
  report_asset_id: string | null;
  asset_id: string | null;
  completed_by: string | null;
  completed_at: string | null;
  condition_rating: number | null;
  expected_remaining_life_years: number | null;
  operational_status: AuditOperationalStatus | null;
  maintenance_required: boolean | null;
  replacement_required: boolean | null;
  priority_level: AuditPriorityLevel | null;
  safety_concern: boolean | null;
  general_notes: string | null;
  issue_description: string | null;
  recommended_action: string | null;
  estimated_maintenance_cost: number | null;
  estimated_replacement_cost: number | null;
  photo_urls: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AdminAuditResultRecord = {
  id: string;
  reportId: string;
  reportAssetId: string;
  assetId: string;
  completedBy: string;
  completedAt: string;
  conditionRating: number | null;
  expectedRemainingLifeYears: number | null;
  operationalStatus: AuditOperationalStatus | '';
  maintenanceRequired: boolean;
  replacementRequired: boolean;
  priorityLevel: AuditPriorityLevel | '';
  safetyConcern: boolean;
  criticalAlert: boolean;
  generalNotes: string;
  issueDescription: string;
  recommendedAction: string;
  estimatedMaintenanceCost: number | null;
  estimatedReplacementCost: number | null;
  photoUrls: string[];
};


function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function dateOnly(value: string | null | undefined, fallback = ''): string {
  if (!value) return fallback;
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function mapReportStatusToAdminStatus(status: string): AdminReportRecord['status'] {
  if (status === 'Completed') return 'Completed';
  if (status === 'InProgress') return 'InProgress';
  return 'ToDo';
}

function getAdminReportWorkflowSummary(
  reportStatus: string,
  completedAssets: number,
  totalAssets: number
) {
  if (totalAssets === 0) return 'No assets assigned';

  const syncedLabel = `${completedAssets}/${totalAssets} asset audits synced`;

  if (reportStatus === 'Completed') {
    return `Finalised · ${syncedLabel}`;
  }

  if (reportStatus === 'Cancelled') {
    return `Cancelled · ${syncedLabel}`;
  }

  if (completedAssets === totalAssets) {
    return `Ready to finalise · ${syncedLabel}`;
  }

  if (completedAssets > 0 || reportStatus === 'InProgress') {
    return `In progress · ${syncedLabel}`;
  }

  return `Assigned · ${syncedLabel}`;
}

function mapReportAssetStatusToAuditStatus(status: string): AuditStatus {
  if (status === 'Completed') return 'Completed';
  if (status === 'InProgress') return 'InProgress';
  if (status === 'Skipped' || status === 'Flagged') return 'Submitted';
  return 'Assigned';
}

type ReportRow = {
  report_id: string;
  title: string;
  location_id: string | null;
  assigned_user_id: string | null;
  created_by: string | null;
  status: ReportStatus;
  due_at: string | null;
  progress_pct: number | null;
  summary: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  description: string | null;
};

type ReportAssetRow = {
  report_asset_id: string;
  report_id: string;
  asset_id: string | null;
  status: ReportAssetStatus;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_user_id: string | null;
  due_at: string | null;
};

type AssetLookupRow = Record<string, any> & {
  asset_id: string;
  asset_code?: string | null;
  name?: string | null;
  location_id?: string | null;
  room_id?: string | null;
  dept_id?: string | null;
  category?: string | null;
  sub_category?: string | null;
};

type LocationLookupRow = {
  location_id: string;
  dept_id: string | null;
};

type AssetLookup = {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory: string;
  locationId: string;
  locationName: string;
  roomId: string;
  roomName: string;
  departmentId: string;
  departmentName: string;
};

export type ReportAssetRecord = {
  id: string;
  reportId: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  category: string;
  subCategory: string;
  locationId: string;
  locationName: string;
  roomId: string;
  roomName: string;
  departmentId: string;
  departmentName: string;
  assignedUserId: string;
  dueDate: string;
  status: ReportAssetStatus;
  notes: string;
  startedAt?: string;
  completedAt?: string;
  auditResult?: AdminAuditResultRecord | null;
};

export type ReportDetailsRecord = AdminReportRecord & {
  description: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  rawStatus: ReportStatus;
  assets: ReportAssetRecord[];
};

export type CreateReportWithAssetsParams = {
  title: string;
  description?: string;
  summary?: string;
  locationId?: string | null;
  assignedUserId: string;
  assetIds: string[];
  dueAt?: string | null;
  status?: ReportStatus;
};

export type UpdateReportParams = {
  reportId: string;
  title?: string;
  description?: string | null;
  summary?: string | null;
  locationId?: string | null;
  assignedUserId?: string | null;
  dueAt?: string | null;
  status?: ReportStatus;
  assetIds?: string[];
};

function toAssetLookupMap(rows: AssetLookupRow[]): Record<string, AssetLookup> {
  return Object.fromEntries(
    rows.map((row) => [
      row.asset_id,
      {
        id: row.asset_id,
        code: asString(row.asset_code),
        name: asString(row.name),
        category: asString(row.category),
        subCategory: asString(row.sub_category),
        locationId: asString(row.location_id),
        locationName: '',
        roomId: asString(row.room_id),
        roomName: '',
        departmentId: asString(row.dept_id),
        departmentName: '',
      },
    ])
  );
}


function lookupName(row: Record<string, any> | null | undefined): string {
  if (!row) return '';
  return (
    asString(row.name) ||
    asString(row.location_name) ||
    asString(row.room_name) ||
    asString(row.department_name) ||
    asString(row.dept_name) ||
    asString(row.title) ||
    asString(row.label)
  );
}

async function fetchLookupNames(
  tableName: 'location' | 'room' | 'department',
  idColumn: 'location_id' | 'room_id' | 'dept_id',
  ids: string[]
): Promise<Record<string, string>> {
  const cleanIds = unique(ids);
  if (cleanIds.length === 0) return {};

  try {
    const { data, error } = await supabase.from(tableName).select('*').in(idColumn, cleanIds);

    if (error || !data) {
      if (error) console.log(`fetchLookupNames ${tableName} error:`, error.message);
      return {};
    }

    return Object.fromEntries(
      (data as Record<string, any>[]).map((row) => [asString(row[idColumn]), lookupName(row)])
    );
  } catch (error: any) {
    console.log(`fetchLookupNames ${tableName} error:`, error?.message ?? error);
    return {};
  }
}

async function enrichAssetLookups(assetMap: Record<string, AssetLookup>) {
  const locationNames = await fetchLookupNames(
    'location',
    'location_id',
    Object.values(assetMap).map((asset) => asset.locationId)
  );
  const roomNames = await fetchLookupNames(
    'room',
    'room_id',
    Object.values(assetMap).map((asset) => asset.roomId)
  );
  const departmentNames = await fetchLookupNames(
    'department',
    'dept_id',
    Object.values(assetMap).map((asset) => asset.departmentId)
  );

  return Object.fromEntries(
    Object.entries(assetMap).map(([assetId, asset]) => [
      assetId,
      {
        ...asset,
        locationName: locationNames[asset.locationId] ?? '',
        roomName: roomNames[asset.roomId] ?? '',
        departmentName: departmentNames[asset.departmentId] ?? '',
      },
    ])
  );
}

function calculateProgress(reportAssets: ReportAssetRow[]) {
  if (reportAssets.length === 0) return 0;
  const completed = reportAssets.filter((item) => item.status === 'Completed').length;
  return Math.round((completed / reportAssets.length) * 100);
}

function makeAssetSummary(reportAssets: ReportAssetRow[], assetMap: Record<string, AssetLookup>) {
  const codes = reportAssets
    .map((item) => assetMap[asString(item.asset_id)]?.code)
    .filter(Boolean);

  if (codes.length === 0) return 'No assets assigned';
  if (codes.length <= 3) return codes.join(', ');
  return `${codes.slice(0, 3).join(', ')} +${codes.length - 3} more`;
}

function auditResultRowToRecord(row: AuditResultRow): AdminAuditResultRecord {
  return {
    id: asString(row.asset_audit_report_id),
    reportId: asString(row.report_id),
    reportAssetId: asString(row.report_asset_id),
    assetId: asString(row.asset_id),
    completedBy: asString(row.completed_by),
    completedAt: row.completed_at ?? '',
    conditionRating:
      typeof row.condition_rating === 'number' && Number.isFinite(row.condition_rating)
        ? row.condition_rating
        : null,
    expectedRemainingLifeYears:
      typeof row.expected_remaining_life_years === 'number' && Number.isFinite(row.expected_remaining_life_years)
        ? row.expected_remaining_life_years
        : null,
    operationalStatus: row.operational_status ?? '',
    maintenanceRequired: Boolean(row.maintenance_required),
    replacementRequired: Boolean(row.replacement_required),
    priorityLevel: row.priority_level ?? '',
    safetyConcern: Boolean(row.safety_concern),
    criticalAlert:
      row.priority_level === 'Critical' ||
      row.condition_rating === 1 ||
      Boolean(row.safety_concern),
    generalNotes: asString(row.general_notes),
    issueDescription: asString(row.issue_description),
    recommendedAction: asString(row.recommended_action),
    estimatedMaintenanceCost:
      typeof row.estimated_maintenance_cost === 'number' && Number.isFinite(row.estimated_maintenance_cost)
        ? row.estimated_maintenance_cost
        : null,
    estimatedReplacementCost:
      typeof row.estimated_replacement_cost === 'number' && Number.isFinite(row.estimated_replacement_cost)
        ? row.estimated_replacement_cost
        : null,
    photoUrls: Array.isArray(row.photo_urls)
      ? row.photo_urls.filter((url): url is string => typeof url === 'string' && url.length > 0)
      : [],
  };
}

async function fetchLatestAuditResultsByReportAssetIds(
  reportAssetIds: string[]
): Promise<Record<string, AdminAuditResultRecord>> {
  const cleanIds = unique(reportAssetIds);
  if (cleanIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from('asset_audit_reports')
      .select(
        'asset_audit_report_id, report_id, report_asset_id, asset_id, completed_by, completed_at, condition_rating, expected_remaining_life_years, operational_status, maintenance_required, replacement_required, priority_level, safety_concern, general_notes, issue_description, recommended_action, estimated_maintenance_cost, estimated_replacement_cost, photo_urls, created_at, updated_at'
      )
      .in('report_asset_id', cleanIds)
      .order('completed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false, nullsFirst: false });

    if (error || !data) {
      if (error) console.log('fetchLatestAuditResultsByReportAssetIds error:', error.message);
      return {};
    }

    const resultMap: Record<string, AdminAuditResultRecord> = {};

    for (const row of data as unknown as AuditResultRow[]) {
      const reportAssetId = asString(row.report_asset_id);
      if (!reportAssetId || resultMap[reportAssetId]) continue;
      resultMap[reportAssetId] = auditResultRowToRecord(row);
    }

    return resultMap;
  } catch (error: any) {
    console.log('fetchLatestAuditResultsByReportAssetIds error:', error?.message ?? error);
    return {};
  }
}

function reportRowToAdminReport(
  row: ReportRow,
  reportAssets: ReportAssetRow[],
  assetMap: Record<string, AssetLookup>,
  locationDeptMap: Record<string, string>
): AdminReportRecord {
  const firstAsset = reportAssets
    .map((item) => assetMap[asString(item.asset_id)])
    .find(Boolean);

  const progressPct = asNumber(row.progress_pct, calculateProgress(reportAssets));
  const completedAssets = reportAssets.filter((item) => item.status === 'Completed').length;
  const totalAssets = reportAssets.length;

  return {
    id: row.report_id,
    title: row.title,
    assetCode: makeAssetSummary(reportAssets, assetMap),
    locationId: asString(row.location_id) || firstAsset?.locationId || '',
    roomId: firstAsset?.roomId ?? '',
    departmentId:
      firstAsset?.departmentId ||
      locationDeptMap[asString(row.location_id)] ||
      '',
    assignedUserId: asString(row.assigned_user_id),
    status: mapReportStatusToAdminStatus(row.status),
    dueDate: dateOnly(row.due_at),
    submittedAt: row.completed_at ? dateOnly(row.completed_at) : undefined,
    progressPct,
    findings: getAdminReportWorkflowSummary(row.status, completedAssets, totalAssets),
    comments: asString(row.summary || row.description),
    photoCount: 0,
  };
}

function reportAssetRowToRecord(row: ReportAssetRow, asset?: AssetLookup, auditResult?: AdminAuditResultRecord): ReportAssetRecord {
  return {
    id: row.report_asset_id,
    reportId: row.report_id,
    assetId: asString(row.asset_id),
    assetCode: asset?.code ?? '',
    assetName: asset?.name ?? 'Unknown asset',
    category: asset?.category ?? '',
    subCategory: asset?.subCategory ?? '',
    locationId: asset?.locationId ?? '',
    locationName: asset?.locationName ?? '',
    roomId: asset?.roomId ?? '',
    roomName: asset?.roomName ?? '',
    departmentId: asset?.departmentId ?? '',
    departmentName: asset?.departmentName ?? '',
    assignedUserId: asString(row.assigned_user_id),
    dueDate: dateOnly(row.due_at),
    status: row.status,
    notes: asString(row.notes),
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    auditResult: auditResult ?? null,
  };
}

function reportAssetRowToAuditAssignment(row: ReportAssetRow, asset?: AssetLookup, report?: ReportRow): AuditAssignment {
  return {
    id: row.report_asset_id,
    title: report?.title || (asset?.name ? `Condition Report Task · ${asset.name}` : 'Condition Report Task'),
    dueAt: row.due_at ?? report?.due_at ?? '',
    locationScope: { precincts: [] },
    locationId: asset?.locationId || report?.location_id || undefined,
    roomId: asset?.roomId || undefined,
    assetId: asString(row.asset_id),
    status: mapReportAssetStatusToAuditStatus(row.status),
    progressPct: row.status === 'Completed' ? 100 : row.status === 'InProgress' ? 50 : 0,
    assignedTo: {
      id: asString(row.assigned_user_id || report?.assigned_user_id) || 'unknown',
      name: 'Auditor',
      role: 'Auditor',
      org: 'Currumbin Wildlife Sanctuary',
    },
    summary: asString(row.notes || report?.summary || report?.description),
  };
}

async function fetchAssetsByIds(assetIds: string[]) {
  if (assetIds.length === 0) return {};
  const { data, error } = await supabase
    .from('asset')
    .select('*')
    .in('asset_id', assetIds);

  if (error || !data) {
    if (error) console.log('fetchAssetsByIds error:', error.message);
    return {};
  }

  const assetMap = toAssetLookupMap(data as unknown as AssetLookupRow[]);
  return enrichAssetLookups(assetMap);
}

async function fetchLocationDepartmentMap(locationIds: string[]) {
  if (locationIds.length === 0) return {};
  const { data, error } = await supabase
    .from('location')
    .select('location_id, dept_id')
    .in('location_id', locationIds);

  if (error || !data) {
    if (error) console.log('fetchLocationDepartmentMap error:', error.message);
    return {};
  }

  return Object.fromEntries(
    (data as unknown as LocationLookupRow[]).map((row) => [row.location_id, asString(row.dept_id)])
  );
}

async function syncReportProgress(reportId: string) {
  const { data, error } = await supabase
    .from('report_assets')
    .select('report_asset_id, status')
    .eq('report_id', reportId);

  if (error || !data) return;

  const rows = data as unknown as Pick<ReportAssetRow, 'report_asset_id' | 'status'>[];
  const total = rows.length;
  const completed = rows.filter((row) => row.status === 'Completed').length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Asset completion should update progress only.
  // The parent report must not become Completed until the auditor explicitly finalises it.
  const { data: reportData } = await supabase
    .from('reports')
    .select('status')
    .eq('report_id', reportId)
    .maybeSingle();

  const currentReportStatus = asString((reportData as { status?: string } | null)?.status);
  if (currentReportStatus === 'Completed' || currentReportStatus === 'Cancelled') return;

  const update: Record<string, unknown> = {
    progress_pct: progress,
    status: progress > 0 ? 'InProgress' : 'Assigned',
    completed_at: null,
  };

  await supabase.from('reports').update(update).eq('report_id', reportId);
}

export async function fetchAdminReports(): Promise<AdminReportRecord[]> {
  const { data: reportData, error: reportError } = await supabase
    .from('reports')
    .select(
      'report_id, title, location_id, assigned_user_id, created_by, status, due_at, progress_pct, summary, completed_at, created_at, updated_at, description'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (reportError || !reportData) {
    if (reportError) console.log('fetchAdminReports error:', reportError.message);
    return [];
  }

  const reports = reportData as unknown as ReportRow[];
  const reportIds = reports.map((row) => row.report_id);

  const { data: reportAssetData, error: reportAssetError } = await supabase
    .from('report_assets')
    .select(
      'report_asset_id, report_id, asset_id, status, started_at, completed_at, notes, created_at, updated_at, assigned_user_id, due_at'
    )
    .in('report_id', reportIds);

  if (reportAssetError) {
    console.log('fetchAdminReports report_assets error:', reportAssetError.message);
  }

  const reportAssets = (reportAssetData ?? []) as unknown as ReportAssetRow[];
  const assetMap = await fetchAssetsByIds(unique(reportAssets.map((row) => row.asset_id)));
  const locationDeptMap = await fetchLocationDepartmentMap(unique(reports.map((row) => row.location_id)));

  return reports.map((report) =>
    reportRowToAdminReport(
      report,
      reportAssets.filter((asset) => asset.report_id === report.report_id),
      assetMap,
      locationDeptMap
    )
  );
}

export async function fetchReportAssets(reportId: string): Promise<ReportAssetRecord[]> {
  if (!reportId) return [];

  const { data, error } = await supabase
    .from('report_assets')
    .select(
      'report_asset_id, report_id, asset_id, status, started_at, completed_at, notes, created_at, updated_at, assigned_user_id, due_at'
    )
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    if (error) console.log('fetchReportAssets error:', error.message);
    const cached = await getCachedReportDetail(reportId);
    return cached?.assets ?? [];
  }

  const rows = data as unknown as ReportAssetRow[];
  const [assetMap, auditResultMap] = await Promise.all([
    fetchAssetsByIds(unique(rows.map((row) => row.asset_id))),
    fetchLatestAuditResultsByReportAssetIds(rows.map((row) => row.report_asset_id)),
  ]);

  return rows.map((row) =>
    reportAssetRowToRecord(row, assetMap[asString(row.asset_id)], auditResultMap[row.report_asset_id])
  );
}

export async function fetchReportById(reportId: string): Promise<ReportDetailsRecord | null> {
  if (!reportId) return null;

  try {
    const { data, error } = await supabase
      .from('reports')
      .select(
        'report_id, title, location_id, assigned_user_id, created_by, status, due_at, progress_pct, summary, completed_at, created_at, updated_at, description'
      )
      .eq('report_id', reportId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.log('fetchReportById error:', error.message);
      return await getCachedReportDetail(reportId);
    }

    const report = data as unknown as ReportRow;
    const assets = await fetchReportAssets(reportId);
    const assetMap = Object.fromEntries(
      assets.map((asset) => [
        asset.assetId,
        {
          id: asset.assetId,
          code: asset.assetCode,
          name: asset.assetName,
          category: asset.category,
          subCategory: asset.subCategory,
          locationId: asset.locationId,
          locationName: asset.locationName,
          roomId: asset.roomId,
          roomName: asset.roomName,
          departmentId: asset.departmentId,
          departmentName: asset.departmentName,
        },
      ])
    );
    const locationDeptMap = await fetchLocationDepartmentMap(unique([report.location_id]));
    const adminRecord = reportRowToAdminReport(
      report,
      assets.map((asset) => ({
        report_asset_id: asset.id,
        report_id: asset.reportId,
        asset_id: asset.assetId,
        status: asset.status,
        started_at: asset.startedAt ?? null,
        completed_at: asset.completedAt ?? null,
        notes: asset.notes,
        created_at: '',
        updated_at: '',
        assigned_user_id: asset.assignedUserId || null,
        due_at: asset.dueDate || null,
      })),
      assetMap,
      locationDeptMap
    );

    const detail: ReportDetailsRecord = {
      ...adminRecord,
      description: asString(report.description),
      summary: asString(report.summary),
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      createdBy: asString(report.created_by),
      rawStatus: report.status,
      assets,
    };

    await cacheReportDetail(detail);
    return detail;
  } catch (error: any) {
    console.log('fetchReportById error:', error?.message ?? error);
    return await getCachedReportDetail(reportId);
  }
}

export async function createReportWithAssets(
  params: CreateReportWithAssetsParams
): Promise<{ ok: boolean; reportId?: string; error?: string }> {
  const assetIds = unique(params.assetIds);

  if (!params.title.trim()) return { ok: false, error: 'Report title is required.' };
  if (!params.assignedUserId) return { ok: false, error: 'Please select an auditor.' };
  if (assetIds.length === 0) return { ok: false, error: 'Select at least one asset.' };

  try {
    const { data: user } = await supabase.auth.getUser();
    const createdBy = user.user?.id ?? null;

    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert([
        {
          title: params.title.trim(),
          description: params.description?.trim() || null,
          summary: params.summary?.trim() || null,
          location_id: params.locationId ?? null,
          assigned_user_id: params.assignedUserId,
          created_by: createdBy,
          status: params.status ?? 'Assigned',
          due_at: params.dueAt ?? null,
          progress_pct: 0,
        },
      ])
      .select('report_id')
      .single();

    if (reportError || !reportData) {
      return { ok: false, error: reportError?.message ?? 'Could not create report.' };
    }

    const reportId = asString((reportData as { report_id?: string }).report_id);

    const reportAssetRows = assetIds.map((assetId) => ({
      report_id: reportId,
      asset_id: assetId,
      status: 'NotStarted' as ReportAssetStatus,
      assigned_user_id: params.assignedUserId,
      due_at: params.dueAt ?? null,
    }));

    const { error: assetError } = await supabase.from('report_assets').insert(reportAssetRows);

    if (assetError) {
      await supabase.from('reports').delete().eq('report_id', reportId);
      return { ok: false, error: assetError.message };
    }

    return { ok: true, reportId };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'Could not create report.' };
  }
}

export async function updateReport(params: UpdateReportParams): Promise<{ ok: boolean; error?: string }> {
  if (!params.reportId) return { ok: false, error: 'Report ID is required.' };

  try {
    const update: Record<string, unknown> = {};

    if (params.title !== undefined) update.title = params.title.trim();
    if (params.description !== undefined) update.description = params.description?.trim() || null;
    if (params.summary !== undefined) update.summary = params.summary?.trim() || null;
    if (params.locationId !== undefined) update.location_id = params.locationId || null;
    if (params.assignedUserId !== undefined) update.assigned_user_id = params.assignedUserId || null;
    if (params.dueAt !== undefined) update.due_at = params.dueAt || null;
    if (params.status !== undefined) update.status = params.status;

    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from('reports').update(update).eq('report_id', params.reportId);
      if (error) return { ok: false, error: error.message };
    }

    if (params.assetIds) {
      const newAssetIds = unique(params.assetIds);

      const { data: existingData, error: existingError } = await supabase
        .from('report_assets')
        .select('report_asset_id, asset_id, status')
        .eq('report_id', params.reportId);

      if (existingError) return { ok: false, error: existingError.message };

      const existing = (existingData ?? []) as unknown as Pick<
        ReportAssetRow,
        'report_asset_id' | 'asset_id' | 'status'
      >[];

      const existingAssetIds = unique(existing.map((row) => row.asset_id));
      const toAdd = newAssetIds.filter((id) => !existingAssetIds.includes(id));
      const toRemove = existing.filter(
        (row) => row.asset_id && !newAssetIds.includes(row.asset_id) && row.status !== 'Completed'
      );

      if (toAdd.length > 0) {
        const { error: addError } = await supabase.from('report_assets').insert(
          toAdd.map((assetId) => ({
            report_id: params.reportId,
            asset_id: assetId,
            status: 'NotStarted' as ReportAssetStatus,
            assigned_user_id: params.assignedUserId,
            due_at: params.dueAt ?? null,
          }))
        );
        if (addError) return { ok: false, error: addError.message };
      }

      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('report_assets')
          .delete()
          .in(
            'report_asset_id',
            toRemove.map((row) => row.report_asset_id)
          );
        if (removeError) return { ok: false, error: removeError.message };
      }

      await syncReportProgress(params.reportId);
    }

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'Could not update report.' };
  }
}

export async function deleteReport(reportId: string): Promise<{ ok: boolean; error?: string }> {
  if (!reportId) return { ok: false, error: 'Report ID is required.' };

  const { error } = await supabase.from('reports').delete().eq('report_id', reportId);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function reassignReport(params: {
  reportId: string;
  assignedUserId: string;
  includeInProgress?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  if (!params.reportId) return { ok: false, error: 'Report ID is required.' };
  if (!params.assignedUserId) return { ok: false, error: 'Auditor is required.' };

  try {
    const allowedStatuses = params.includeInProgress
      ? ['NotStarted', 'InProgress', 'Flagged', 'Skipped']
      : ['NotStarted', 'Flagged', 'Skipped'];

    const { error: reportError } = await supabase
      .from('reports')
      .update({
        assigned_user_id: params.assignedUserId,
      })
      .eq('report_id', params.reportId);

    if (reportError) {
      return { ok: false, error: reportError.message };
    }

    const { error: assetError } = await supabase
      .from('report_assets')
      .update({
        assigned_user_id: params.assignedUserId,
      })
      .eq('report_id', params.reportId)
      .in('status', allowedStatuses);

    if (assetError) {
      return { ok: false, error: assetError.message };
    }

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'Could not reassign report.' };
  }
}

export async function fetchAuditAssignments(): Promise<AuditAssignment[]> {
  const { data: reportAssetData, error: reportAssetError } = await supabase
    .from('report_assets')
    .select(
      'report_asset_id, report_id, asset_id, status, started_at, completed_at, notes, created_at, updated_at, assigned_user_id, due_at'
    )
    .neq('status', 'Completed')
    .order('due_at', { ascending: true });

  if (reportAssetError || !reportAssetData) {
    if (reportAssetError) console.log('fetchAuditAssignments error:', reportAssetError.message);
    return [];
  }

  const reportAssets = reportAssetData as unknown as ReportAssetRow[];
  const [assetMap, reportResult] = await Promise.all([
    fetchAssetsByIds(unique(reportAssets.map((row) => row.asset_id))),
    supabase
      .from('reports')
      .select(
        'report_id, title, location_id, assigned_user_id, created_by, status, due_at, progress_pct, summary, completed_at, created_at, updated_at, description'
      )
      .in('report_id', unique(reportAssets.map((row) => row.report_id))),
  ]);

  const reports = Object.fromEntries(
    (((reportResult.data ?? []) as unknown as ReportRow[]).map((row) => [row.report_id, row]))
  );

  return reportAssets.map((row) =>
    reportAssetRowToAuditAssignment(row, assetMap[asString(row.asset_id)], reports[row.report_id])
  );
}

export async function createAuditAssignmentsBulk(params: {
  assignedUserId: string;
  assetIds: string[];
  dueAt?: string;
  title?: string;
  locationId?: string | null;
  summary?: string;
}): Promise<{ ok: boolean; created?: AuditAssignment[]; reportId?: string; error?: string }> {
  const assetIds = unique(params.assetIds);

  if (!params.assignedUserId || assetIds.length === 0) {
    return { ok: false, error: 'Select at least one asset and an assignee.' };
  }

  try {
    const { data: assignee, error: assigneeError } = await supabase
      .from('user_profile')
      .select('user_id, role')
      .eq('user_id', params.assignedUserId)
      .maybeSingle();

    if (assigneeError || !assignee) {
      return { ok: false, error: assigneeError?.message ?? 'Assignee not found.' };
    }

    if (asString((assignee as Record<string, unknown>).role) !== 'Auditor') {
      return { ok: false, error: 'You can only assign reports to users with Auditor role.' };
    }

    const assetMap = await fetchAssetsByIds(assetIds);
    const firstAsset = assetMap[assetIds[0]];

    const result = await createReportWithAssets({
      title: params.title || `Condition Report · ${assetIds.length} asset${assetIds.length === 1 ? '' : 's'}`,
      summary: params.summary || `Condition report assigned for ${assetIds.length} selected asset${assetIds.length === 1 ? '' : 's'}.`,
      description: params.summary || undefined,
      locationId: params.locationId ?? firstAsset?.locationId ?? null,
      assignedUserId: params.assignedUserId,
      assetIds,
      dueAt: params.dueAt,
      status: 'Assigned',
    });

    if (!result.ok || !result.reportId) {
      return { ok: false, error: result.error ?? 'Could not create report.' };
    }

    const created = await fetchAuditAssignments();
    const createdForReport = created.filter((assignment) => {
      return assetIds.includes(assignment.assetId);
    });

    await supabase.from('alert').insert([
      {
        title: 'New audit report assigned',
        body: `You have been assigned a new audit report with ${assetIds.length} asset${assetIds.length === 1 ? '' : 's'}.`,
        type: 'Report',
        severity: 'Info',
        status: 'Open',
        kind: 'AssetFlag',
        read: false,
        user_id: params.assignedUserId,
        location_id: params.locationId ?? firstAsset?.locationId ?? null,
        asset_id: assetIds[0] ?? null,
        audit_id: result.reportId,
      },
    ]);

    return {
      ok: true,
      reportId: result.reportId,
      created: createdForReport.length > 0 ? createdForReport : created,
    };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'Bulk report assignment failed.' };
  }
}


async function fetchReportStatus(reportId: string): Promise<ReportStatus | null> {
  if (!reportId) return null;

  const { data, error } = await supabase
    .from('reports')
    .select('status')
    .eq('report_id', reportId)
    .maybeSingle();

  if (error || !data) return null;
  return asString((data as { status?: string }).status) as ReportStatus;
}

function isFinalisedReportStatus(status: string | null | undefined) {
  return status === 'Completed' || status === 'Cancelled';
}

function pendingPhotoToCapturedPhoto(photo: PendingAuditPhoto): CapturedPhoto {
  return {
    uri: photo.uri,
    fileName: photo.fileName ?? undefined,
    mimeType: photo.mimeType ?? undefined,
    width: photo.width ?? undefined,
    height: photo.height ?? undefined,
  } as CapturedPhoto;
}

function isProbablyRemoteUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://');
}

export async function saveAuditDraft(params: {
  assetId?: string;
  assignmentId?: string;
  reportAssetId?: string;
  progressPct: number;
  draftPayload?: Record<string, any>;
}): Promise<boolean> {
  const reportAssetId = params.reportAssetId ?? params.assignmentId;

  try {
    if (reportAssetId) {
      const { data: existing, error: existingError } = await supabase
        .from('report_assets')
        .select('report_asset_id, report_id, status')
        .eq('report_asset_id', reportAssetId)
        .maybeSingle();

      if (existingError || !existing) return false;

      const reportId = asString((existing as { report_id?: string }).report_id);
      const currentStatus = asString((existing as { status?: string }).status) as ReportAssetStatus;
      const reportStatus = await fetchReportStatus(reportId);

      if (isFinalisedReportStatus(reportStatus)) return false;

      const nextStatus: ReportAssetStatus = currentStatus === 'Completed'
        ? 'Completed'
        : params.progressPct > 0
          ? 'InProgress'
          : 'NotStarted';

      const { error } = await supabase
        .from('report_assets')
        .update({
          status: nextStatus,
          started_at: currentStatus === 'Completed' ? undefined : new Date().toISOString(),
          draft_payload: params.draftPayload ?? {},
          last_saved_at: new Date().toISOString(),
        })
        .eq('report_asset_id', reportAssetId);

      if (error) return false;

      await syncReportProgress(reportId);
      return true;
    }

    if (params.assetId) {
      const { data, error } = await supabase
        .from('report_assets')
        .update({
          status: params.progressPct > 0 ? 'InProgress' : 'NotStarted',
          started_at: new Date().toISOString(),
          draft_payload: params.draftPayload ?? {},
          last_saved_at: new Date().toISOString(),
        })
        .eq('asset_id', params.assetId)
        .in('status', ['NotStarted', 'InProgress', 'Flagged'])
        .select('report_id');

      if (error || !data || data.length === 0) return false;

      await syncReportProgress(asString((data[0] as { report_id?: string }).report_id));
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function fetchAuditDraft(reportAssetId: string): Promise<Record<string, any> | null> {
  if (!reportAssetId) return null;

  try {
    const { data, error } = await supabase
      .from('report_assets')
      .select('draft_payload')
      .eq('report_asset_id', reportAssetId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return (data as { draft_payload?: Record<string, any> }).draft_payload ?? null;
  } catch {
    return null;
  }
}

export async function submitConditionReport(params: {
  assetId: string;
  inspectorName?: string;
  findings?: string;
  comments?: string;
  issueDescription?: string | null;
  generalNotes?: string | null;
  photoTaken?: boolean;
  photoReference?: string | null;
  photoUrls?: string[];
  assignmentId?: string;
  reportAssetId?: string;
  conditionRating?: number;
  expectedRemainingLifeYears?: number | null;
  operationalStatus?: 'Operational' | 'Partially Operational' | 'Not Operational' | 'Not Inspected';
  maintenanceRequired?: boolean;
  replacementRequired?: boolean;
  priorityLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  safetyConcern?: boolean;
  criticalAlert?: boolean;
  recommendedAction?: string | null;
  estimatedMaintenanceCost?: number | null;
  estimatedReplacementCost?: number | null;
}): Promise<{ ok: boolean; auditId?: string; error?: string }> {
  const reportAssetId = params.reportAssetId ?? params.assignmentId;

  try {
    let reportAsset: ReportAssetRow | null = null;

    if (reportAssetId) {
      const { data, error } = await supabase
        .from('report_assets')
        .select(
          'report_asset_id, report_id, asset_id, status, started_at, completed_at, notes, created_at, updated_at, assigned_user_id, due_at'
        )
        .eq('report_asset_id', reportAssetId)
        .maybeSingle();

      if (error || !data) {
        return { ok: false, error: error?.message ?? 'Report asset assignment not found.' };
      }

      reportAsset = data as unknown as ReportAssetRow;
    } else {
      const { data, error } = await supabase
        .from('report_assets')
        .select(
          'report_asset_id, report_id, asset_id, status, started_at, completed_at, notes, created_at, updated_at, assigned_user_id, due_at'
        )
        .eq('asset_id', params.assetId)
        .in('status', ['NotStarted', 'InProgress', 'Completed', 'Flagged'])
        .order('due_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { ok: false, error: error?.message ?? 'No active report asset assignment found.' };
      }

      reportAsset = data as unknown as ReportAssetRow;
    }

    const reportStatus = await fetchReportStatus(reportAsset.report_id);
    if (isFinalisedReportStatus(reportStatus)) {
      return { ok: false, error: 'This report has already been finalised and can no longer be edited.' };
    }

    const { data: user } = await supabase.auth.getUser();
    const completedBy = user.user?.id ?? null;

    const photoUrls = Array.isArray(params.photoUrls)
      ? params.photoUrls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
      : params.photoReference || params.photoTaken
        ? [params.photoReference || 'Photo attached']
        : [];

    const issueDescription = params.issueDescription ?? params.findings ?? null;
    const generalNotes = params.generalNotes ?? params.comments ?? null;

    const auditPayload = {
      report_id: reportAsset.report_id,
      report_asset_id: reportAsset.report_asset_id,
      asset_id: params.assetId || reportAsset.asset_id,
      completed_by: completedBy,
      completed_at: new Date().toISOString(),
      condition_rating: params.conditionRating ?? 3,
      expected_remaining_life_years: params.expectedRemainingLifeYears ?? null,
      operational_status: params.operationalStatus ?? 'Operational',
      maintenance_required: Boolean(params.maintenanceRequired),
      replacement_required: Boolean(params.replacementRequired),
      priority_level: params.priorityLevel ?? 'Low',
      safety_concern: Boolean(params.safetyConcern),
      general_notes: generalNotes,
      issue_description: issueDescription,
      recommended_action: params.recommendedAction ?? null,
      estimated_maintenance_cost: params.estimatedMaintenanceCost ?? null,
      estimated_replacement_cost: params.estimatedReplacementCost ?? null,
      photo_urls: photoUrls,
    };

    const { data: auditData, error: auditError } = await supabase
      .from('asset_audit_reports')
      .upsert(auditPayload, { onConflict: 'report_asset_id' })
      .select('asset_audit_report_id')
      .single();

    if (auditError || !auditData) {
      return { ok: false, error: auditError?.message ?? 'Audit report submission failed.' };
    }

    const { error: assignmentError } = await supabase
      .from('report_assets')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        notes: generalNotes ?? issueDescription,
        draft_payload: auditPayload,
        last_saved_at: new Date().toISOString(),
      })
      .eq('report_asset_id', reportAsset.report_asset_id);

    if (assignmentError) {
      return { ok: false, error: assignmentError.message };
    }

    await syncReportProgress(reportAsset.report_id);

    const submittedAuditId = asString((auditData as { asset_audit_report_id?: string }).asset_audit_report_id);
    const cachedAuditResult = auditResultRowToRecord({
      ...auditPayload,
      asset_audit_report_id: submittedAuditId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as AuditResultRow);

    await updateCachedReportAssetAfterSubmit({
      reportId: reportAsset.report_id,
      reportAssetId: reportAsset.report_asset_id,
      auditResult: cachedAuditResult,
    });

    // Refresh from Supabase when possible so cached report status/progress exactly matches DB.
    await fetchReportById(reportAsset.report_id);

    return {
      ok: true,
      auditId: submittedAuditId,
    };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'Submission failed.' };
  }
}

export async function fetchSubmittedAuditResult(reportAssetId: string): Promise<AdminAuditResultRecord | null> {
  if (!reportAssetId) return null;

  try {
    const { data, error } = await supabase
      .from('asset_audit_reports')
      .select(
        'asset_audit_report_id, report_id, report_asset_id, asset_id, completed_by, completed_at, condition_rating, expected_remaining_life_years, operational_status, maintenance_required, replacement_required, priority_level, safety_concern, general_notes, issue_description, recommended_action, estimated_maintenance_cost, estimated_replacement_cost, photo_urls'
      )
      .eq('report_asset_id', reportAssetId)
      .maybeSingle();

    if (error || !data) return await getCachedSubmittedAuditResult(reportAssetId);
    return auditResultRowToRecord(data as unknown as AuditResultRow);
  } catch {
    return await getCachedSubmittedAuditResult(reportAssetId);
  }
}

export async function finaliseAuditorReport(reportId: string): Promise<{ ok: boolean; error?: string }> {
  if (!reportId) return { ok: false, error: 'Report ID is required.' };

  try {
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select('report_id, status, assigned_user_id')
      .eq('report_id', reportId)
      .maybeSingle();

    if (reportError || !reportData) {
      return { ok: false, error: reportError?.message ?? 'Report could not be found.' };
    }

    const reportStatus = asString((reportData as { status?: string }).status) as ReportStatus;
    if (reportStatus === 'Completed') return { ok: true };
    if (reportStatus === 'Cancelled') return { ok: false, error: 'Cancelled reports cannot be finalised.' };

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? '';
    const assignedUserId = asString((reportData as { assigned_user_id?: string }).assigned_user_id);

    if (assignedUserId && userId && assignedUserId !== userId) {
      return { ok: false, error: 'Only the assigned auditor can finalise this report.' };
    }

    const { data: assetData, error: assetError } = await supabase
      .from('report_assets')
      .select('report_asset_id, status')
      .eq('report_id', reportId);

    if (assetError || !assetData) {
      return { ok: false, error: assetError?.message ?? 'Could not load report assets.' };
    }

    const assets = assetData as Array<{ report_asset_id: string; status: ReportAssetStatus }>;
    if (assets.length === 0) {
      return { ok: false, error: 'This report has no assigned assets.' };
    }

    const incomplete = assets.filter((asset) => asset.status !== 'Completed');
    if (incomplete.length > 0) {
      return { ok: false, error: 'Complete every asset before finalising this report.' };
    }

    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'Completed',
        progress_pct: 100,
        completed_at: completedAt,
      })
      .eq('report_id', reportId);

    if (updateError) return { ok: false, error: updateError.message };

    await markCachedReportFinalised(reportId);
    await fetchReportById(reportId);
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'Could not finalise this report.' };
  }
}

export async function syncPendingAuditSubmissions(reportId?: string): Promise<{
  ok: boolean;
  syncedCount: number;
  failedCount: number;
  error?: string;
}> {
  const pendingItems = reportId
    ? await getPendingReportAudits(reportId)
    : [];

  const syncableItems = pendingItems.filter((item) => item.status === 'PendingSync' || item.status === 'SyncFailed');

  if (syncableItems.length === 0) {
    return { ok: true, syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;
  let lastError = '';

  for (const item of syncableItems) {
    try {
      const photoUrls: string[] = [];

      for (const photo of item.photos ?? []) {
        const existingUrl = photo.uploadedUrl || photo.remotePath;
        if (existingUrl) {
          photoUrls.push(existingUrl);
          continue;
        }

        if (!photo.uri) continue;

        if (isProbablyRemoteUrl(photo.uri)) {
          photoUrls.push(photo.uri);
          continue;
        }

        const upload = await uploadPhoto(pendingPhotoToCapturedPhoto(photo), `asset/${item.assetId}`);

        if (!upload.ok) {
          throw new Error(upload.error || 'Photo upload failed.');
        }

        const safeFileName =
          photo.fileName?.trim() ||
          upload.data.path?.split('/').pop() ||
          `audit-photo-${Date.now()}.jpg`;

        const fileUrl = upload.data.publicUrl ?? upload.data.path;
        if (fileUrl) photoUrls.push(fileUrl);

        if (fileUrl && item.locationId) {
          try {
            await saveAttachmentReference({
              locationId: item.locationId,
              fileUrl,
              fileName: safeFileName,
              description: `Photo for asset ${item.assetCode || item.assetName || item.assetId}`,
            });
          } catch (attachmentError) {
            console.log('saveAttachmentReference during pending sync failed:', attachmentError);
          }
        }
      }

      const result = await submitConditionReport({
        reportAssetId: item.reportAssetId,
        assetId: item.assetId,
        conditionRating: item.conditionRating,
        expectedRemainingLifeYears: item.expectedRemainingLifeYears,
        operationalStatus: item.operationalStatus,
        maintenanceRequired: item.maintenanceRequired,
        replacementRequired: item.replacementRequired,
        priorityLevel: item.priorityLevel,
        estimatedMaintenanceCost: item.estimatedMaintenanceCost,
        estimatedReplacementCost: item.estimatedReplacementCost,
        safetyConcern: item.safetyConcern,
        issueDescription: item.issueDescription,
        recommendedAction: item.recommendedAction,
        generalNotes: item.generalNotes,
        photoUrls,
      });

      if (!result.ok) {
        throw new Error(result.error || 'Pending audit sync failed.');
      }

      await removePendingAuditSubmission(item.reportAssetId);
      syncedCount += 1;
    } catch (error: any) {
      failedCount += 1;
      lastError = error?.message ?? 'Pending audit sync failed.';
      await savePendingAuditSubmission({
        ...item,
        status: 'SyncFailed',
        lastError,
      });
    }
  }

  return {
    ok: failedCount === 0,
    syncedCount,
    failedCount,
    error: failedCount > 0 ? lastError || 'Some pending audits could not be synced.' : undefined,
  };
}

export type AuditorReportStatus = 'Assigned' | 'InProgress' | 'Completed';

export type AuditorReportRecord = {
  id: string;
  title: string;
  description: string;
  summary: string;
  locationId: string;
  locationName: string;
  assignedUserId: string;
  status: AuditorReportStatus;
  dueDate: string;
  progressPct: number;
  assetCount: number;
  completedAssetCount: number;
  createdAt: string;
  updatedAt: string;
};

function toAuditorReportStatus(status: ReportStatus, progressPct: number): AuditorReportStatus {
  if (status === 'Completed') return 'Completed';
  if (status === 'InProgress' || progressPct > 0) return 'InProgress';
  return 'Assigned';
}

export async function fetchAuditorReports(): Promise<{
  ok: boolean;
  reports: AuditorReportRecord[];
  error?: string;
  fromCache?: boolean;
}> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user?.id) {
      const cached = await getCachedAuditorReports();
      if (cached.length > 0) {
        return {
          ok: true,
          reports: cached,
          fromCache: true,
          error: 'Showing cached reports because the signed-in user could not be verified online.',
        };
      }

      return {
        ok: false,
        reports: [],
        error: userError?.message ?? 'You must be signed in to view assigned reports.',
      };
    }

    const userId = userData.user.id;

    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .select(
        'report_id, title, location_id, assigned_user_id, created_by, status, due_at, progress_pct, summary, completed_at, created_at, updated_at, description'
      )
      .eq('assigned_user_id', userId)
      .neq('status', 'Cancelled')
      .order('due_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (reportError || !reportData) {
      const cached = await getCachedAuditorReports();
      if (cached.length > 0) {
        return {
          ok: true,
          reports: cached,
          fromCache: true,
          error: reportError?.message ?? 'Showing cached reports because the database is not reachable.',
        };
      }

      return {
        ok: false,
        reports: [],
        error: reportError?.message ?? 'Could not load assigned reports.',
      };
    }

    const reports = reportData as unknown as ReportRow[];
    const reportIds = reports.map((report) => report.report_id);

    if (reportIds.length === 0) {
      await cacheAuditorReports([]);
      return { ok: true, reports: [] };
    }

    const { data: reportAssetData, error: reportAssetError } = await supabase
      .from('report_assets')
      .select(
        'report_asset_id, report_id, asset_id, status, started_at, completed_at, notes, created_at, updated_at, assigned_user_id, due_at'
      )
      .in('report_id', reportIds);

    if (reportAssetError) {
      const cached = await getCachedAuditorReports();
      if (cached.length > 0) {
        return {
          ok: true,
          reports: cached,
          fromCache: true,
          error: reportAssetError.message,
        };
      }

      return {
        ok: false,
        reports: [],
        error: reportAssetError.message,
      };
    }

    const reportAssets = (reportAssetData ?? []) as unknown as ReportAssetRow[];
    const locationNames = await fetchLookupNames('location', 'location_id', unique(reports.map((report) => report.location_id)));

    const reportRecords = reports.map((report) => {
      const assets = reportAssets.filter((asset) => asset.report_id === report.report_id);
      const assetCount = assets.length;
      const completedAssetCount = assets.filter((asset) => asset.status === 'Completed').length;
      const progressPct = asNumber(report.progress_pct, calculateProgress(assets));

      return {
        id: report.report_id,
        title: report.title,
        description: asString(report.description),
        summary: asString(report.summary),
        locationId: asString(report.location_id),
        locationName: locationNames[asString(report.location_id)] ?? '',
        assignedUserId: asString(report.assigned_user_id),
        status: toAuditorReportStatus(report.status, progressPct),
        dueDate: dateOnly(report.due_at),
        progressPct,
        assetCount,
        completedAssetCount,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      } satisfies AuditorReportRecord;
    });

    await cacheAuditorReports(reportRecords);

    // The Reports tab is the offline preparation point. When it loads online,
    // cache the full report bundles so list, detail, and asset form screens can
    // still work after the auditor leaves Wi-Fi.
    await Promise.all(
      reportRecords.map(async (report) => {
        try {
          await fetchReportById(report.id);
        } catch (error) {
          console.log('offline report detail pre-cache failed:', report.id, error);
        }
      })
    );

    return {
      ok: true,
      reports: reportRecords,
      fromCache: false,
    };
  } catch (error: any) {
    const cached = await getCachedAuditorReports();
    if (cached.length > 0) {
      return {
        ok: true,
        reports: cached,
        fromCache: true,
        error: error?.message ?? 'Showing cached reports because the database is not reachable.',
      };
    }

    return {
      ok: false,
      reports: [],
      error: error?.message ?? 'Could not load assigned reports.',
    };
  }
}

export type ReportAssetForAuditRecord = {
  reportAssetId: string;
  reportId: string;
  reportTitle: string;
  reportDescription: string;
  reportSummary: string;
  reportDueDate: string;
  reportProgressPct: number;
  reportStatus: ReportStatus;
  reportCompletedAt: string;
  isReportFinalised: boolean;
  assetId: string;
  assetCode: string;
  assetName: string;
  category: string;
  subCategory: string;
  locationId: string;
  locationName: string;
  roomId: string;
  roomName: string;
  departmentId: string;
  departmentName: string;
  assignedUserId: string;
  dueDate: string;
  status: ReportAssetStatus;
  notes: string;
  startedAt?: string;
  completedAt?: string;
};

export async function fetchReportAssetForAudit(reportAssetId: string): Promise<{
  ok: boolean;
  item?: ReportAssetForAuditRecord;
  error?: string;
  fromCache?: boolean;
}> {
  if (!reportAssetId) {
    return { ok: false, error: 'Report asset ID is required.' };
  }

  try {
    const { data: reportAssetData, error: reportAssetError } = await supabase
      .from('report_assets')
      .select(
        'report_asset_id, report_id, asset_id, status, started_at, completed_at, notes, created_at, updated_at, assigned_user_id, due_at'
      )
      .eq('report_asset_id', reportAssetId)
      .maybeSingle();

    if (reportAssetError || !reportAssetData) {
      const cached = await getCachedReportAssetForAudit(reportAssetId);
      if (cached) {
        return {
          ok: true,
          item: cached,
          fromCache: true,
          error: reportAssetError?.message ?? 'Showing cached asset details because the database is not reachable.',
        };
      }

      return {
        ok: false,
        error: reportAssetError?.message ?? 'This assigned report asset could not be found.',
      };
    }

    const reportAsset = reportAssetData as unknown as ReportAssetRow;

    const [{ data: reportData, error: reportError }, assetMap] = await Promise.all([
      supabase
        .from('reports')
        .select(
          'report_id, title, location_id, assigned_user_id, created_by, status, due_at, progress_pct, summary, completed_at, created_at, updated_at, description'
        )
        .eq('report_id', reportAsset.report_id)
        .maybeSingle(),
      fetchAssetsByIds(unique([reportAsset.asset_id])),
    ]);

    if (reportError || !reportData) {
      const cached = await getCachedReportAssetForAudit(reportAssetId);
      if (cached) {
        return {
          ok: true,
          item: cached,
          fromCache: true,
          error: reportError?.message ?? 'Showing cached report asset because the database is not reachable.',
        };
      }

      return {
        ok: false,
        error: reportError?.message ?? 'The parent report could not be found.',
      };
    }

    const report = reportData as unknown as ReportRow;
    const asset = assetMap[asString(reportAsset.asset_id)];

    if (!asset) {
      const cached = await getCachedReportAssetForAudit(reportAssetId);
      if (cached) {
        return {
          ok: true,
          item: cached,
          fromCache: true,
          error: 'Showing cached asset details because the linked asset could not be reached online.',
        };
      }

      return { ok: false, error: 'The linked asset could not be found.' };
    }

    const progressPct = asNumber(report.progress_pct, 0);

    return {
      ok: true,
      item: {
        reportAssetId: reportAsset.report_asset_id,
        reportId: reportAsset.report_id,
        reportTitle: report.title,
        reportDescription: asString(report.description),
        reportSummary: asString(report.summary),
        reportDueDate: dateOnly(report.due_at),
        reportProgressPct: progressPct,
        reportStatus: report.status,
        reportCompletedAt: report.completed_at ?? '',
        isReportFinalised: report.status === 'Completed',
        assetId: asset.id,
        assetCode: asset.code,
        assetName: asset.name,
        category: asset.category,
        subCategory: asset.subCategory,
        locationId: asset.locationId,
        locationName: asset.locationName,
        roomId: asset.roomId,
        roomName: asset.roomName,
        departmentId: asset.departmentId,
        departmentName: asset.departmentName,
        assignedUserId: asString(reportAsset.assigned_user_id || report.assigned_user_id),
        dueDate: dateOnly(reportAsset.due_at || report.due_at),
        status: reportAsset.status,
        notes: asString(reportAsset.notes),
        startedAt: reportAsset.started_at ?? undefined,
        completedAt: reportAsset.completed_at ?? undefined,
      },
    };
  } catch (error: any) {
    console.log('fetchReportAssetForAudit error:', error?.message ?? error);
    const cached = await getCachedReportAssetForAudit(reportAssetId);
    if (cached) {
      return {
        ok: true,
        item: cached,
        fromCache: true,
        error: error?.message ?? 'Showing cached asset details because the database is not reachable.',
      };
    }

    return {
      ok: false,
      error: error?.message ?? 'Could not load this report asset.',
    };
  }
}
