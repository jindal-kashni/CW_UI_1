import { supabase } from '@/utils/supabase';
import { fetchAdminAuditResults, type AdminAuditResultSearchRecord } from '@/src/services/reports';

export type DashboardReportWorkflowStatus = 'Assigned' | 'In Progress' | 'Ready to finalise' | 'Finalised' | 'Overdue' | 'Cancelled';

export type AdminDashboardReportItem = {
  id: string;
  title: string;
  rawStatus: string;
  workflowStatus: DashboardReportWorkflowStatus;
  dueAt: string | null;
  completedAt: string | null;
  progressPct: number;
  assetCount: number;
  completedAssetCount: number;
  assignedUserId: string | null;
  locationId: string | null;
  locationName: string;
  departmentId: string | null;
  departmentName: string;
  isFinalised: boolean;
  isReadyToFinalise: boolean;
  isOverdue: boolean;
};

export type AdminDashboardAuditItem = {
  id: string;
  reportId: string;
  reportTitle: string;
  reportCompletedAt: string | null;
  assetId: string;
  assetCode: string;
  assetName: string;
  category: string;
  subCategory: string;
  locationId: string | null;
  locationName: string;
  roomId: string | null;
  roomName: string;
  departmentId: string | null;
  departmentName: string;
  completedBy: string | null;
  completedAt: string | null;
  conditionRating: number | null;
  operationalStatus: string;
  priorityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  maintenanceRequired: boolean;
  replacementRequired: boolean;
  safetyConcern: boolean;
  issueDescription: string;
  recommendedAction: string;
  generalNotes: string;
  estimatedMaintenanceCost: number | null;
  estimatedReplacementCost: number | null;
  assetReplacementCost: number | null;
  highRisk: boolean;
};

export type AdminDashboardLocationIssue = {
  locationId: string;
  locationName: string;
  departmentName: string;
  issueCount: number;
  highRiskCount: number;
  maintenanceCount: number;
  replacementCount: number;
  safetyCount: number;
};

export type AdminDashboardCalendarEventType =
  | 'ReportDue'
  | 'ReportOverdue'
  | 'ReadyToFinalise'
  | 'ReportFinalised'
  | 'HighRiskFinding';

export type AdminDashboardCalendarEvent = {
  id: string;
  date: string;
  type: AdminDashboardCalendarEventType;
  title: string;
  subtitle: string;
  route: string;
};

export type AdminDashboardConditionBreakdown = {
  rating: number;
  label: string;
  count: number;
};

export type AdminDashboardData = {
  generatedAt: string;
  reports: AdminDashboardReportItem[];
  finalisedAuditResults: AdminDashboardAuditItem[];
  criticalAlerts: AdminDashboardAuditItem[];
  capexPipeline: AdminDashboardAuditItem[];
  maintenanceRequired: AdminDashboardAuditItem[];
  replacementRequired: AdminDashboardAuditItem[];
  poorConditionAssets: AdminDashboardAuditItem[];
  topIssueLocations: AdminDashboardLocationIssue[];
  recentlyFinalisedReports: AdminDashboardReportItem[];
  calendarEvents: AdminDashboardCalendarEvent[];
  conditionBreakdown: AdminDashboardConditionBreakdown[];
  totals: {
    assignedReports: number;
    inProgressReports: number;
    readyToFinaliseReports: number;
    overdueReports: number;
    dueThisWeekReports: number;
    finalisedReports: number;
    criticalAlerts: number;
    maintenanceRequired: number;
    replacementRequired: number;
    poorConditionAssets: number;
    capexEstimate: number;
    maintenanceEstimate: number;
    assetCountWithFinalisedResults: number;
  };
};

type ReportRow = {
  report_id: string;
  title: string | null;
  location_id: string | null;
  assigned_user_id: string | null;
  status: string | null;
  due_at: string | null;
  progress_pct: number | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ReportAssetRow = {
  report_asset_id: string;
  report_id: string;
  asset_id: string | null;
  status: string | null;
  completed_at: string | null;
};

type AssetRow = {
  asset_id: string;
  asset_code: string | null;
  name: string | null;
  category: string | null;
  sub_category: string | null;
  location_id: string | null;
  room_id: string | null;
  dept_id: string | null;
  status: string | null;
  condition: string | null;
  replacement_cost: number | string | null;
};

type LocationRow = {
  location_id: string;
  name: string | null;
  dept_id: string | null;
};

type DepartmentRow = {
  dept_id: string;
  name: string | null;
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function dateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function startOfTodayMs() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function calculateProgress(reportAssets: ReportAssetRow[]): number {
  if (reportAssets.length === 0) return 0;
  const completed = reportAssets.filter((item) => item.status === 'Completed').length;
  return Math.round((completed / reportAssets.length) * 100);
}

function priorityRank(priority: string) {
  if (priority === 'Critical') return 4;
  if (priority === 'High') return 3;
  if (priority === 'Medium') return 2;
  return 1;
}

function conditionLabel(rating: number) {
  if (rating === 5) return 'Excellent';
  if (rating === 4) return 'Good';
  if (rating === 3) return 'Fair';
  if (rating === 2) return 'Poor';
  if (rating === 1) return 'Needs urgent attention';
  return 'Unknown';
}

function dashboardAuditItemFromResult(row: AdminAuditResultSearchRecord): AdminDashboardAuditItem {
  const priorityLevel = (['Low', 'Medium', 'High', 'Critical'].includes(row.priorityLevel)
    ? row.priorityLevel
    : 'Low') as AdminDashboardAuditItem['priorityLevel'];
  const conditionRating = typeof row.conditionRating === 'number' ? row.conditionRating : null;
  const safetyConcern = Boolean(row.safetyConcern);
  const highRisk = priorityLevel === 'Critical' || conditionRating === 1 || safetyConcern;

  return {
    id: row.id,
    reportId: row.reportId,
    reportTitle: asString(row.reportTitle, 'Unknown report'),
    reportCompletedAt: row.reportCompletedAt || null,
    assetId: row.assetId,
    assetCode: asString(row.assetCode, 'No asset code'),
    assetName: asString(row.assetName, 'Unknown asset'),
    category: asString(row.category, 'Uncategorised'),
    subCategory: asString(row.subCategory, 'No sub-category'),
    locationId: row.locationId || null,
    locationName: asString(row.locationName, 'No location set'),
    roomId: row.roomId || null,
    roomName: asString(row.roomName, 'No room set'),
    departmentId: row.departmentId || null,
    departmentName: asString(row.departmentName, 'No department set'),
    completedBy: row.completedBy || null,
    completedAt: row.completedAt || null,
    conditionRating,
    operationalStatus: asString(row.operationalStatus, 'Not Inspected'),
    priorityLevel,
    maintenanceRequired: Boolean(row.maintenanceRequired),
    replacementRequired: Boolean(row.replacementRequired),
    safetyConcern,
    issueDescription: asString(row.issueDescription),
    recommendedAction: asString(row.recommendedAction),
    generalNotes: asString(row.generalNotes),
    estimatedMaintenanceCost: row.estimatedMaintenanceCost,
    estimatedReplacementCost: row.estimatedReplacementCost,
    assetReplacementCost: null,
    highRisk,
  };
}

async function fetchRowsByIds<T>(
  table: string,
  select: string,
  idColumn: string,
  ids: string[]
): Promise<T[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from(table).select(select).in(idColumn, ids);
  if (error || !data) {
    if (error) console.log(`fetchRowsByIds ${table} error:`, error.message);
    return [];
  }
  return data as unknown as T[];
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const { data: reportData, error: reportError } = await supabase
    .from('reports')
    .select('report_id, title, location_id, assigned_user_id, status, due_at, progress_pct, completed_at, created_at, updated_at')
    .neq('status', 'Cancelled')
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(300);

  if (reportError || !reportData) {
    if (reportError) console.log('fetchAdminDashboardData reports error:', reportError.message);
  }

  const reports = (reportData ?? []) as unknown as ReportRow[];
  const reportIds = reports.map((report) => report.report_id);

  const reportAssets = await fetchRowsByIds<ReportAssetRow>(
    'report_assets',
    'report_asset_id, report_id, asset_id, status, completed_at',
    'report_id',
    reportIds
  );

  const assetIds = unique(reportAssets.map((row) => row.asset_id));
  const assets = await fetchRowsByIds<AssetRow>(
    'asset',
    'asset_id, asset_code, name, category, sub_category, location_id, room_id, dept_id, status, condition, replacement_cost',
    'asset_id',
    assetIds
  );

  const assetById = Object.fromEntries(assets.map((asset) => [asset.asset_id, asset]));

  const locationIds = unique([
    ...reports.map((row) => row.location_id),
    ...assets.map((row) => row.location_id),
  ]);

  const locations = await fetchRowsByIds<LocationRow>('location', 'location_id, name, dept_id', 'location_id', locationIds);
  const locationById = Object.fromEntries(locations.map((location) => [location.location_id, location]));

  const departmentIds = unique([
    ...assets.map((row) => row.dept_id),
    ...locations.map((row) => row.dept_id),
  ]);

  const departments = await fetchRowsByIds<DepartmentRow>('department', 'dept_id, name', 'dept_id', departmentIds);
  const departmentById = Object.fromEntries(departments.map((department) => [department.dept_id, department]));

  const reportAssetsByReportId = reportAssets.reduce<Record<string, ReportAssetRow[]>>((acc, row) => {
    acc[row.report_id] = acc[row.report_id] ? [...acc[row.report_id], row] : [row];
    return acc;
  }, {});

  const todayMs = startOfTodayMs();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const reportItems: AdminDashboardReportItem[] = reports.map((report) => {
    const assetsForReport = reportAssetsByReportId[report.report_id] ?? [];
    const completedAssetCount = assetsForReport.filter((asset) => asset.status === 'Completed').length;
    const assetCount = assetsForReport.length;
    const progressPct = asNumber(report.progress_pct, calculateProgress(assetsForReport));
    const isFinalised = report.status === 'Completed';
    const isReadyToFinalise = assetCount > 0 && completedAssetCount === assetCount && !isFinalised;
    const dueMs = report.due_at ? new Date(report.due_at).getTime() : NaN;
    const isOverdue = !isFinalised && Number.isFinite(dueMs) && dueMs < todayMs;
    const firstAsset = assetsForReport
      .map((asset) => (asset.asset_id ? assetById[asset.asset_id] : null))
      .find(Boolean) as AssetRow | null | undefined;
    const locationId = report.location_id || firstAsset?.location_id || null;
    const location = locationId ? locationById[locationId] : undefined;
    const departmentId = firstAsset?.dept_id || location?.dept_id || null;
    const department = departmentId ? departmentById[departmentId] : undefined;

    let workflowStatus: DashboardReportWorkflowStatus = 'Assigned';
    if (isFinalised) workflowStatus = 'Finalised';
    else if (isReadyToFinalise) workflowStatus = 'Ready to finalise';
    else if (isOverdue) workflowStatus = 'Overdue';
    else if (report.status === 'InProgress' || progressPct > 0) workflowStatus = 'In Progress';
    else if (report.status === 'Cancelled') workflowStatus = 'Cancelled';

    return {
      id: report.report_id,
      title: asString(report.title, 'Untitled report'),
      rawStatus: asString(report.status, 'Assigned'),
      workflowStatus,
      dueAt: report.due_at,
      completedAt: report.completed_at,
      progressPct,
      assetCount,
      completedAssetCount,
      assignedUserId: report.assigned_user_id,
      locationId,
      locationName: asString(location?.name, locationId ? 'Unknown location' : 'No location set'),
      departmentId,
      departmentName: asString(department?.name, 'No department set'),
      isFinalised,
      isReadyToFinalise,
      isOverdue,
    };
  });

  const reportById = Object.fromEntries(reportItems.map((report) => [report.id, report]));

  const allAuditResults = await fetchAdminAuditResults({ limit: 1000 });
  const finalisedAuditResults = allAuditResults
    .filter((result) => result.isFinalised)
    .map(dashboardAuditItemFromResult);

  const criticalAlerts = finalisedAuditResults
    .filter((item) => item.highRisk)
    .sort((a, b) => {
      const priorityDelta = priorityRank(b.priorityLevel) - priorityRank(a.priorityLevel);
      if (priorityDelta !== 0) return priorityDelta;
      return (a.conditionRating ?? 99) - (b.conditionRating ?? 99);
    });

  const capexPipeline = finalisedAuditResults
    .filter((item) => item.replacementRequired)
    .sort((a, b) => (b.estimatedReplacementCost ?? 0) - (a.estimatedReplacementCost ?? 0));

  const maintenanceRequired = finalisedAuditResults
    .filter((item) => item.maintenanceRequired)
    .sort((a, b) => (b.estimatedMaintenanceCost ?? 0) - (a.estimatedMaintenanceCost ?? 0));

  const replacementRequired = finalisedAuditResults.filter((item) => item.replacementRequired);
  const poorConditionAssets = finalisedAuditResults.filter((item) => (item.conditionRating ?? 5) <= 2);

  const issueByLocation = finalisedAuditResults.reduce<Record<string, AdminDashboardLocationIssue>>((acc, item) => {
    const hasIssue = item.highRisk || item.maintenanceRequired || item.replacementRequired || item.safetyConcern;
    if (!hasIssue || !item.locationId) return acc;
    acc[item.locationId] = acc[item.locationId] ?? {
      locationId: item.locationId,
      locationName: item.locationName,
      departmentName: item.departmentName,
      issueCount: 0,
      highRiskCount: 0,
      maintenanceCount: 0,
      replacementCount: 0,
      safetyCount: 0,
    };
    acc[item.locationId].issueCount += 1;
    if (item.highRisk) acc[item.locationId].highRiskCount += 1;
    if (item.maintenanceRequired) acc[item.locationId].maintenanceCount += 1;
    if (item.replacementRequired) acc[item.locationId].replacementCount += 1;
    if (item.safetyConcern) acc[item.locationId].safetyCount += 1;
    return acc;
  }, {});

  const topIssueLocations = Object.values(issueByLocation)
    .sort((a, b) => b.issueCount - a.issueCount)
    .slice(0, 6);

  const recentlyFinalisedReports = reportItems
    .filter((report) => report.isFinalised)
    .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime())
    .slice(0, 6);

  const conditionBreakdown: AdminDashboardConditionBreakdown[] = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    label: conditionLabel(rating),
    count: finalisedAuditResults.filter((item) => item.conditionRating === rating).length,
  }));

  const dueThisWeekReports = reportItems.filter((report) => {
    if (report.isFinalised || !report.dueAt) return false;
    const dueMs = new Date(report.dueAt).getTime();
    return Number.isFinite(dueMs) && dueMs >= todayMs && dueMs <= todayMs + sevenDaysMs;
  });

  const calendarEvents: AdminDashboardCalendarEvent[] = [];
  reportItems.forEach((report) => {
    if (!report.isFinalised && report.dueAt) {
      calendarEvents.push({
        id: `due-${report.id}`,
        date: dateOnly(report.dueAt) ?? '',
        type: report.isOverdue ? 'ReportOverdue' : 'ReportDue',
        title: report.title,
        subtitle: `${report.workflowStatus} · ${report.completedAssetCount}/${report.assetCount} assets`,
        route: `/admin/reports/${report.id}`,
      });
    }

    if (report.isReadyToFinalise) {
      calendarEvents.push({
        id: `ready-${report.id}`,
        date: dateOnly(report.dueAt) ?? dateOnly(new Date().toISOString()) ?? '',
        type: 'ReadyToFinalise',
        title: report.title,
        subtitle: 'Ready to finalise',
        route: `/admin/reports/${report.id}`,
      });
    }

    if (report.isFinalised && report.completedAt) {
      calendarEvents.push({
        id: `finalised-${report.id}`,
        date: dateOnly(report.completedAt) ?? '',
        type: 'ReportFinalised',
        title: report.title,
        subtitle: 'Finalised report',
        route: `/admin/reports/${report.id}`,
      });
    }
  });

  criticalAlerts.slice(0, 30).forEach((item) => {
    if (!item.completedAt) return;
    calendarEvents.push({
      id: `risk-${item.id}`,
      date: dateOnly(item.completedAt) ?? '',
      type: 'HighRiskFinding',
      title: item.assetName,
      subtitle: `${item.priorityLevel} · ${item.reportTitle}`,
      route: `/admin/reports/${item.reportId}`,
    });
  });

  const capexEstimate = capexPipeline.reduce(
    (sum, item) => sum + (item.estimatedReplacementCost ?? 0),
    0
  );
  const maintenanceEstimate = maintenanceRequired.reduce(
    (sum, item) => sum + (item.estimatedMaintenanceCost ?? 0),
    0
  );
  const assetIdsWithResults = unique(finalisedAuditResults.map((item) => item.assetId));

  return {
    generatedAt: new Date().toISOString(),
    reports: reportItems,
    finalisedAuditResults,
    criticalAlerts,
    capexPipeline,
    maintenanceRequired,
    replacementRequired,
    poorConditionAssets,
    topIssueLocations,
    recentlyFinalisedReports,
    calendarEvents: calendarEvents.filter((event) => Boolean(event.date)),
    conditionBreakdown,
    totals: {
      assignedReports: reportItems.filter((report) => report.workflowStatus === 'Assigned').length,
      inProgressReports: reportItems.filter((report) => report.workflowStatus === 'In Progress').length,
      readyToFinaliseReports: reportItems.filter((report) => report.isReadyToFinalise).length,
      overdueReports: reportItems.filter((report) => report.isOverdue).length,
      dueThisWeekReports: dueThisWeekReports.length,
      finalisedReports: reportItems.filter((report) => report.isFinalised).length,
      criticalAlerts: criticalAlerts.length,
      maintenanceRequired: maintenanceRequired.length,
      replacementRequired: replacementRequired.length,
      poorConditionAssets: poorConditionAssets.length,
      capexEstimate,
      maintenanceEstimate,
      assetCountWithFinalisedResults: assetIdsWithResults.length,
    },
  };
}
