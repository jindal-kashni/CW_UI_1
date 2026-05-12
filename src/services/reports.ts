import { supabase } from '@/utils/supabase';
import { type AdminReportRecord } from '@/src/data/admin';
import type { AuditAssignment, AuditStatus } from '@/src/types/models';

type ReportStatus = 'Draft' | 'Assigned' | 'InProgress' | 'Completed' | 'Cancelled';
type ReportAssetStatus = 'NotStarted' | 'InProgress' | 'Completed' | 'Flagged' | 'Skipped';

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

type AssetLookupRow = {
  asset_id: string;
  asset_code: string | null;
  name: string | null;
  location_id: string | null;
  room_id: string | null;
  dept_id: string | null;
};

type LocationLookupRow = {
  location_id: string;
  dept_id: string | null;
};

type AssetLookup = {
  id: string;
  code: string;
  name: string;
  locationId: string;
  roomId: string;
  departmentId: string;
};

export type ReportAssetRecord = {
  id: string;
  reportId: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  locationId: string;
  roomId: string;
  departmentId: string;
  assignedUserId: string;
  dueDate: string;
  status: ReportAssetStatus;
  notes: string;
  startedAt?: string;
  completedAt?: string;
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
        locationId: asString(row.location_id),
        roomId: asString(row.room_id),
        departmentId: asString(row.dept_id),
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
    findings: totalAssets > 0 ? `${completedAssets}/${totalAssets} assets completed` : 'No assets assigned',
    comments: asString(row.summary || row.description),
    photoCount: 0,
  };
}

function reportAssetRowToRecord(row: ReportAssetRow, asset?: AssetLookup): ReportAssetRecord {
  return {
    id: row.report_asset_id,
    reportId: row.report_id,
    assetId: asString(row.asset_id),
    assetCode: asset?.code ?? '',
    assetName: asset?.name ?? 'Unknown asset',
    locationId: asset?.locationId ?? '',
    roomId: asset?.roomId ?? '',
    departmentId: asset?.departmentId ?? '',
    assignedUserId: asString(row.assigned_user_id),
    dueDate: dateOnly(row.due_at),
    status: row.status,
    notes: asString(row.notes),
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
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
    .select('asset_id, asset_code, name, location_id, room_id, dept_id')
    .in('asset_id', assetIds);

  if (error || !data) {
    if (error) console.log('fetchAssetsByIds error:', error.message);
    return {};
  }

  return toAssetLookupMap(data as unknown as AssetLookupRow[]);
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

  const update: Partial<ReportRow> = {
    progress_pct: progress,
    status: progress === 100 && total > 0 ? 'Completed' : progress > 0 ? 'InProgress' : 'Assigned',
    completed_at: progress === 100 && total > 0 ? new Date().toISOString() : null,
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
    return [];
  }

  const rows = data as unknown as ReportAssetRow[];
  const assetMap = await fetchAssetsByIds(unique(rows.map((row) => row.asset_id)));

  return rows.map((row) => reportAssetRowToRecord(row, assetMap[asString(row.asset_id)]));
}

export async function fetchReportById(reportId: string): Promise<ReportDetailsRecord | null> {
  if (!reportId) return null;

  const { data, error } = await supabase
    .from('reports')
    .select(
      'report_id, title, location_id, assigned_user_id, created_by, status, due_at, progress_pct, summary, completed_at, created_at, updated_at, description'
    )
    .eq('report_id', reportId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.log('fetchReportById error:', error.message);
    return null;
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
        locationId: asset.locationId,
        roomId: asset.roomId,
        departmentId: asset.departmentId,
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

  return {
    ...adminRecord,
    description: asString(report.description),
    summary: asString(report.summary),
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    createdBy: asString(report.created_by),
    rawStatus: report.status,
    assets,
  };
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
      const { data, error } = await supabase
        .from('report_assets')
        .update({
          status: params.progressPct > 0 ? 'InProgress' : 'NotStarted',
          started_at: new Date().toISOString(),
          draft_payload: params.draftPayload ?? {},
          last_saved_at: new Date().toISOString(),
        })
        .eq('report_asset_id', reportAssetId)
        .select('report_id');

      if (error || !data || data.length === 0) return false;

      await syncReportProgress(asString((data[0] as { report_id?: string }).report_id));
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
  findings: string;
  comments: string;
  photoTaken?: boolean;
  photoReference?: string | null;
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
        .in('status', ['NotStarted', 'InProgress', 'Flagged'])
        .order('due_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { ok: false, error: error?.message ?? 'No active report asset assignment found.' };
      }

      reportAsset = data as unknown as ReportAssetRow;
    }

    const { data: user } = await supabase.auth.getUser();
    const completedBy = user.user?.id ?? null;

    const photoUrls =
      params.photoReference || params.photoTaken
        ? [params.photoReference || 'Photo attached']
        : null;

    const { data: auditData, error: auditError } = await supabase
      .from('asset_audit_reports')
      .insert([
        {
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
          priority_level: params.priorityLevel ?? 'Medium',
          safety_concern: Boolean(params.safetyConcern),
          critical_alert: Boolean(params.criticalAlert),
          general_notes: params.comments,
          issue_description: params.findings,
          recommended_action: params.recommendedAction ?? null,
          estimated_maintenance_cost: params.estimatedMaintenanceCost ?? null,
          estimated_replacement_cost: params.estimatedReplacementCost ?? null,
          photo_urls: photoUrls,
        },
      ])
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
        notes: params.comments,
      })
      .eq('report_asset_id', reportAsset.report_asset_id);

    if (assignmentError) {
      return { ok: false, error: assignmentError.message };
    }

    await syncReportProgress(reportAsset.report_id);

    return {
      ok: true,
      auditId: asString((auditData as { asset_audit_report_id?: string }).asset_audit_report_id),
    };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'Submission failed.' };
  }
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
  if (status === 'Completed' || progressPct >= 100) return 'Completed';
  if (status === 'InProgress' || progressPct > 0) return 'InProgress';
  return 'Assigned';
}

export async function fetchAuditorReports(): Promise<{
  ok: boolean;
  reports: AuditorReportRecord[];
  error?: string;
}> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user?.id) {
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
      return {
        ok: false,
        reports: [],
        error: reportError?.message ?? 'Could not load assigned reports.',
      };
    }

    const reports = reportData as unknown as ReportRow[];
    const reportIds = reports.map((report) => report.report_id);

    if (reportIds.length === 0) {
      return { ok: true, reports: [] };
    }

    const { data: reportAssetData, error: reportAssetError } = await supabase
      .from('report_assets')
      .select(
        'report_asset_id, report_id, asset_id, status, started_at, completed_at, notes, created_at, updated_at, assigned_user_id, due_at'
      )
      .in('report_id', reportIds);

    if (reportAssetError) {
      return {
        ok: false,
        reports: [],
        error: reportAssetError.message,
      };
    }

    const reportAssets = (reportAssetData ?? []) as unknown as ReportAssetRow[];

    return {
      ok: true,
      reports: reports.map((report) => {
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
          locationName: '',
          assignedUserId: asString(report.assigned_user_id),
          status: toAuditorReportStatus(report.status, progressPct),
          dueDate: dateOnly(report.due_at),
          progressPct,
          assetCount,
          completedAssetCount,
          createdAt: report.created_at,
          updatedAt: report.updated_at,
        };
      }),
    };
  } catch (error: any) {
    return {
      ok: false,
      reports: [],
      error: error?.message ?? 'Could not load assigned reports.',
    };
  }
}