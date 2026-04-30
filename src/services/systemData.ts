import { supabase } from '@/utils/supabase';
import {
  type AdminAlertRecord,
  type AdminSyncRecord,
} from '@/src/data/admin';
import type { AlertItem } from '@/src/types/models';

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

type AlertRow = {
  alert_id: string;
  title: string;
  body: string | null;
  type: string;
  severity: string;
  status: string;
  kind: string | null;
  read: boolean | null;
  completed_at: string | null;
  location_id: string | null;
  asset_id: string | null;
  audit_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

type SyncItemRow = {
  sync_id: string;
  user_id: string | null;
  device_label: string;
  state: string;
  detail: string | null;
  created_at: string;
  updated_at: string;
};

type ReportAccessRequestRow = {
  request_id: string;
  assignment_id: string;
  requester_user_id: string;
  status: 'Pending' | 'Approved' | 'Declined';
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportAccessRequest = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  requesterUserId: string;
  requesterLabel: string;
  status: 'Pending' | 'Approved' | 'Declined';
  createdAt: string;
};

export type AdminActivityItem = {
  id: string;
  createdAt: string;
  source: 'alert' | 'assignment' | 'submission';
  title: string;
  detail: string;
  userId?: string;
  locationId?: string;
};

const ALERT_TYPES: AdminAlertRecord['type'][] = ['Sync', 'Report', 'Asset', 'User'];
const ALERT_SEVERITIES: AdminAlertRecord['severity'][] = ['Info', 'Attention', 'Urgent'];
const ALERT_STATUSES: AdminAlertRecord['status'][] = ['Open', 'Resolved'];
const ALERT_KINDS: AlertItem['kind'][] = ['OverdueAudit', 'CriticalCondition', 'SyncIssue', 'AssetFlag'];
const SYNC_STATES: AdminSyncRecord['state'][] = ['UpToDate', 'Pending', 'Failed'];

function safe<T extends string>(allowed: readonly T[], v: unknown, fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function alertRowToAdmin(row: AlertRow): AdminAlertRecord {
  return {
    id: row.alert_id,
    title: row.title,
    type: safe(ALERT_TYPES, row.type, 'Asset'),
    severity: safe(ALERT_SEVERITIES, row.severity, 'Info'),
    status: safe(ALERT_STATUSES, row.status, 'Open'),
    locationId: asString(row.location_id) || undefined,
    userId: asString(row.user_id) || undefined,
    createdAt: row.created_at,
    body: asString(row.body),
  };
}

function alertRowToAuditor(row: AlertRow): AlertItem {
  return {
    id: row.alert_id,
    kind: safe(ALERT_KINDS, row.kind, 'AssetFlag'),
    title: row.title,
    body: asString(row.body),
    createdAt: row.created_at,
    severity: safe(ALERT_SEVERITIES, row.severity, 'Info'),
    read: Boolean(row.read),
    completedAt: row.completed_at ?? undefined,
    related: {
      assetId: asString(row.asset_id) || undefined,
      auditId: asString(row.audit_id) || undefined,
    },
  };
}

export async function fetchAdminAlerts(): Promise<AdminAlertRecord[]> {
  const { data, error } = await supabase
    .from('alert')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as unknown as AlertRow[]).map(alertRowToAdmin);
}

export async function fetchAdminSyncItems(): Promise<AdminSyncRecord[]> {
  const { data, error } = await supabase
    .from('sync_item')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return (data as unknown as SyncItemRow[]).map((row) => ({
    id: row.sync_id,
    userId: asString(row.user_id),
    deviceLabel: row.device_label,
    state: safe(SYNC_STATES, row.state, 'Pending'),
    updatedAt: row.updated_at,
    detail: asString(row.detail),
  }));
}

export async function fetchAuditorAlerts(): Promise<AlertItem[]> {
  const { data, error } = await supabase
    .from('alert')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as unknown as AlertRow[]).map(alertRowToAuditor);
}

export async function markAlertResolved(alertId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('alert').update({ status: 'Resolved' }).eq('alert_id', alertId);
    return !error;
  } catch {
    return false;
  }
}

export async function markAlertRead(alertId: string, completedAt = new Date().toISOString()): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('alert')
      .update({ read: true, completed_at: completedAt })
      .eq('alert_id', alertId);
    return !error;
  } catch {
    return false;
  }
}

export async function createReportAccessRequest(params: {
  assignmentId: string;
  auditorUserId: string;
  assignmentTitle: string;
}): Promise<boolean> {
  try {
    // Avoid duplicate pending requests for the same assignment/user.
    const { data: pendingExisting, error: pendingError } = await supabase
      .from('report_access_request')
      .select('request_id')
      .eq('assignment_id', params.assignmentId)
      .eq('requester_user_id', params.auditorUserId)
      .eq('status', 'Pending')
      .limit(1);
    if (!pendingError && pendingExisting && pendingExisting.length > 0) {
      return true;
    }

    const { error: requestError } = await supabase.from('report_access_request').insert([
      {
        assignment_id: params.assignmentId,
        requester_user_id: params.auditorUserId,
        status: 'Pending',
      },
    ]);
    if (requestError) return false;

    const { error } = await supabase.from('alert').insert([
      {
        title: `Report access request · ${params.assignmentTitle}`,
        body: `Auditor requested access to completed report "${params.assignmentTitle}".`,
        type: 'User',
        severity: 'Attention',
        status: 'Open',
        kind: 'AssetFlag',
        read: false,
      },
    ]);
    return !error;
  } catch {
    return false;
  }
}

export async function resolveReportAccessRequest(params: {
  requestId: string;
  assignmentId: string;
  auditorUserId: string;
  assignmentTitle: string;
  approved: boolean;
}): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const { data, error } = await supabase.functions.invoke<{ success: boolean; error?: string }>(
      'admin-resolve-report-access',
      {
        body: {
          requestId: params.requestId,
          approved: params.approved,
        },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      }
    );
    if (error) return false;
    return Boolean(data?.success);
  } catch {
    return false;
  }
}

export async function fetchPendingReportAccessRequestsForAdmin(): Promise<ReportAccessRequest[]> {
  try {
    const { data, error } = await supabase
      .from('report_access_request')
      .select('request_id, assignment_id, requester_user_id, status, decided_by, decided_at, created_at, updated_at')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });
    if (error || !data) return [];

    const rows = data as unknown as ReportAccessRequestRow[];
    const assignmentIds = Array.from(new Set(rows.map((r) => r.assignment_id)));
    const requesterIds = Array.from(new Set(rows.map((r) => r.requester_user_id)));

    const [assignmentsResult, usersResult] = await Promise.all([
      supabase
        .from('audit_assignment')
        .select('assignment_id, title')
        .in('assignment_id', assignmentIds),
      supabase
        .from('user_profile')
        .select('user_id, email, name')
        .in('user_id', requesterIds),
    ]);

    const assignmentById = Object.fromEntries(
      ((assignmentsResult.data ?? []) as any[]).map((row) => [row.assignment_id as string, row.title as string])
    ) as Record<string, string>;
    const requesterById = Object.fromEntries(
      ((usersResult.data ?? []) as any[]).map((row) => [
        row.user_id as string,
        (row.name as string) || (row.email as string) || row.user_id,
      ])
    ) as Record<string, string>;

    return rows.map((row) => ({
      id: row.request_id,
      assignmentId: row.assignment_id,
      assignmentTitle: assignmentById[row.assignment_id] ?? row.assignment_id,
      requesterUserId: row.requester_user_id,
      requesterLabel: requesterById[row.requester_user_id] ?? row.requester_user_id,
      status: row.status,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function fetchAuditorReportAccessStates(auditorUserId: string): Promise<{
  approvedAssignmentIds: string[];
  pendingAssignmentIds: string[];
}> {
  try {
    const { data, error } = await supabase
      .from('report_access_request')
      .select('assignment_id, status')
      .eq('requester_user_id', auditorUserId);
    if (error || !data) return { approvedAssignmentIds: [], pendingAssignmentIds: [] };
    const approved: string[] = [];
    const pending: string[] = [];
    for (const row of data as any[]) {
      if (row.status === 'Approved') approved.push(row.assignment_id as string);
      if (row.status === 'Pending') pending.push(row.assignment_id as string);
    }
    return { approvedAssignmentIds: approved, pendingAssignmentIds: pending };
  } catch {
    return { approvedAssignmentIds: [], pendingAssignmentIds: [] };
  }
}

export async function fetchAdminActivityTimeline(limit = 20): Promise<AdminActivityItem[]> {
  try {
    const [alertsResult, assignmentsResult, submissionsResult] = await Promise.all([
      supabase
        .from('alert')
        .select('alert_id, title, type, severity, status, body, user_id, location_id, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('audit_assignment')
        .select('assignment_id, title, status, assigned_user_id, location_id, updated_at, created_at')
        .order('updated_at', { ascending: false })
        .limit(limit),
      supabase
        .from('audit_log')
        .select('audit_id, inspector_name, findings, location_id, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    const alertItems: AdminActivityItem[] = ((alertsResult.data ?? []) as any[]).map((row) => ({
      id: `alert-${row.alert_id as string}`,
      createdAt: asString(row.created_at),
      source: 'alert',
      title: asString(row.title) || 'Alert',
      detail: `${asString(row.type)} · ${asString(row.severity)} · ${asString(row.status)}`,
      userId: asString(row.user_id) || undefined,
      locationId: asString(row.location_id) || undefined,
    }));

    const assignmentItems: AdminActivityItem[] = ((assignmentsResult.data ?? []) as any[]).map((row) => ({
      id: `assignment-${row.assignment_id as string}`,
      createdAt: asString(row.updated_at) || asString(row.created_at),
      source: 'assignment',
      title: asString(row.title) || 'Assignment updated',
      detail: `Status: ${asString(row.status)}`,
      userId: asString(row.assigned_user_id) || undefined,
      locationId: asString(row.location_id) || undefined,
    }));

    const submissionItems: AdminActivityItem[] = ((submissionsResult.data ?? []) as any[]).map((row) => ({
      id: `submission-${row.audit_id as string}`,
      createdAt: asString(row.created_at),
      source: 'submission',
      title: `Condition report submitted · ${asString(row.inspector_name) || 'Auditor'}`,
      detail: asString(row.findings) || 'Submission logged.',
      locationId: asString(row.location_id) || undefined,
    }));

    return [...alertItems, ...assignmentItems, ...submissionItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch {
    return [];
  }
}
