import { supabase } from '@/utils/supabase';
import { type AdminReportRecord } from '@/src/data/admin';
import type { AuditAssignment, AuditStatus } from '@/src/types/models';

// audit_log holds completed condition reports (the historical record).
// audit_assignment holds the work queue (todo / in-progress / draft).

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function dateOnly(value: string | null | undefined, fallback?: string): string {
  if (typeof value !== 'string' || !value) return fallback ?? '';
  return value.length >= 10 ? value.slice(0, 10) : value;
}

const ASSIGNMENT_STATUSES: AuditStatus[] = ['Assigned', 'InProgress', 'DraftSaved', 'Submitted', 'Completed'];
function safeAssignmentStatus(v: unknown): AuditStatus {
  if (typeof v === 'string' && (ASSIGNMENT_STATUSES as string[]).includes(v)) {
    return v as AuditStatus;
  }
  return 'Assigned';
}

type AuditLogRow = {
  audit_id: string;
  location_id: string | null;
  room_id: string | null;
  asset_id: string | null;
  audit_date: string | null;
  inspector_name: string | null;
  findings: string | null;
  photo_taken: boolean | null;
  photo_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AuditAssignmentRow = {
  assignment_id: string;
  title: string;
  asset_id: string | null;
  location_id: string | null;
  room_id: string | null;
  due_at: string | null;
  status: string;
  progress_pct: number | null;
  assigned_user_id: string | null;
  created_by: string | null;
  summary: string | null;
  precincts: string[] | null;
  created_at: string;
  updated_at: string;
};

function logRowToAdminReport(row: AuditLogRow): AdminReportRecord {
  return {
    id: row.audit_id,
    title: `Condition Report · ${asString(row.inspector_name) || 'Auditor'}`,
    assetCode: '',
    locationId: asString(row.location_id),
    roomId: asString(row.room_id),
    departmentId: '',
    assignedUserId: '',
    status: 'Completed',
    dueDate: dateOnly(row.audit_date) || dateOnly(row.created_at),
    submittedAt: row.created_at,
    progressPct: 100,
    findings: asString(row.findings),
    comments: asString(row.notes),
    photoCount: row.photo_taken ? 1 : 0,
  };
}

function assignmentRowToAdminReport(row: AuditAssignmentRow): AdminReportRecord {
  const status = safeAssignmentStatus(row.status);
  const adminStatus =
    status === 'Completed' || status === 'Submitted'
      ? 'Completed'
      : status === 'InProgress' || status === 'DraftSaved'
        ? 'InProgress'
        : 'ToDo';
  return {
    id: row.assignment_id,
    title: row.title,
    assetCode: '',
    locationId: asString(row.location_id),
    roomId: asString(row.room_id),
    departmentId: '',
    assignedUserId: asString(row.assigned_user_id),
    status: adminStatus,
    dueDate: dateOnly(row.due_at),
    progressPct: asNumber(row.progress_pct),
    findings: '',
    comments: asString(row.summary),
    photoCount: 0,
  };
}

function assignmentRowToAuditAssignment(row: AuditAssignmentRow): AuditAssignment {
  return {
    id: row.assignment_id,
    title: row.title,
    dueAt: row.due_at ?? '',
    locationScope: { precincts: row.precincts ?? [] },
    assetId: asString(row.asset_id),
    status: safeAssignmentStatus(row.status),
    progressPct: asNumber(row.progress_pct),
    assignedTo: {
      id: asString(row.assigned_user_id) || 'unknown',
      name: 'Auditor',
      role: 'Auditor',
      org: 'Currumbin Wildlife Sanctuary',
    },
    summary: asString(row.summary),
  };
}

export async function fetchAdminReports(): Promise<AdminReportRecord[]> {
  const [logs, assignments] = await Promise.all([
    supabase
      .from('audit_log')
      .select('audit_id, location_id, room_id, asset_id, audit_date, inspector_name, findings, photo_taken, photo_reference, notes, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('audit_assignment')
      .select('assignment_id, title, asset_id, location_id, room_id, due_at, status, progress_pct, assigned_user_id, created_by, summary, precincts, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const rows: AdminReportRecord[] = [];
  if (!assignments.error && assignments.data) {
    for (const row of assignments.data as unknown as AuditAssignmentRow[]) {
      if (row.status !== 'Completed') {
        rows.push(assignmentRowToAdminReport(row));
      }
    }
  }
  if (!logs.error && logs.data) {
    for (const row of logs.data as unknown as AuditLogRow[]) {
      rows.push(logRowToAdminReport(row));
    }
  }
  return rows;
}

export async function fetchAuditAssignments(): Promise<AuditAssignment[]> {
  const { data, error } = await supabase
    .from('audit_assignment')
    .select('assignment_id, title, asset_id, location_id, room_id, due_at, status, progress_pct, assigned_user_id, created_by, summary, precincts, created_at, updated_at')
    .order('due_at', { ascending: true });
  if (error || !data) return [];
  return (data as unknown as AuditAssignmentRow[]).map(assignmentRowToAuditAssignment);
}

// Submit a completed condition report to audit_log AND, if there is a matching
// audit_assignment, mark it Completed.
export async function submitConditionReport(params: {
  assetId: string;
  inspectorName?: string;
  findings: string;
  comments: string;
  photoTaken?: boolean;
  photoReference?: string | null;
  assignmentId?: string;
}): Promise<{ ok: boolean; auditId?: string; error?: string }> {
  try {
    const { data: assetRow, error: assetError } = await supabase
      .from('asset')
      .select('asset_id, location_id, room_id')
      .eq('asset_id', params.assetId)
      .maybeSingle();
    if (assetError || !assetRow) {
      return { ok: false, error: assetError?.message ?? 'Asset not found' };
    }
    if (!assetRow.location_id) {
      return { ok: false, error: 'Asset has no location set; report requires location_id.' };
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('audit_log')
      .insert([
        {
          location_id: assetRow.location_id,
          room_id: assetRow.room_id,
          asset_id: assetRow.asset_id,
          audit_date: today,
          inspector_name: params.inspectorName ?? 'Auditor',
          findings: params.findings,
          photo_taken: Boolean(params.photoTaken),
          photo_reference: params.photoReference ?? null,
          notes: params.comments,
        },
      ])
      .select('audit_id')
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message ?? 'Insert failed' };
    }

    if (params.assignmentId) {
      const { data: updated, error: assignmentError } = await supabase
        .from('audit_assignment')
        .update({ status: 'Completed', progress_pct: 100 })
        .eq('assignment_id', params.assignmentId)
        .select('assignment_id');
      if (assignmentError || !updated || updated.length === 0) {
        return {
          ok: false,
          error: assignmentError?.message ?? 'Could not close assignment after report submission.',
        };
      }
    } else {
      // Best-effort: close any open assignment matching this asset for the
      // current user (based on RLS, only their own row will be writable).
      const { error: assignmentError } = await supabase
        .from('audit_assignment')
        .update({ status: 'Completed', progress_pct: 100 })
        .eq('asset_id', params.assetId)
        .neq('status', 'Completed');
      if (assignmentError) {
        return { ok: false, error: assignmentError.message };
      }
    }
    return { ok: true, auditId: data.audit_id as string };
  } catch (error: any) {
    return { ok: false, error: error?.message ?? 'Submission failed' };
  }
}

// Save assignment progress as a draft. Updates the assignment row (auditor RLS
// allows updating only their own).
export async function saveAuditDraft(params: {
  assetId?: string;
  assignmentId?: string;
  progressPct: number;
}): Promise<boolean> {
  try {
    const update = { status: 'DraftSaved' as const, progress_pct: params.progressPct };
    if (params.assignmentId) {
      const { data, error } = await supabase
        .from('audit_assignment')
        .update(update)
        .eq('assignment_id', params.assignmentId)
        .select('assignment_id');
      return !error && Boolean(data && data.length > 0);
    }
    if (params.assetId) {
      const { data, error } = await supabase
        .from('audit_assignment')
        .update(update)
        .eq('asset_id', params.assetId)
        .in('status', ['Assigned', 'InProgress', 'DraftSaved'])
        .select('assignment_id');
      return !error && Boolean(data && data.length > 0);
    }
    return false;
  } catch {
    return false;
  }
}
