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
