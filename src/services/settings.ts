import { supabase } from '@/utils/supabase';

export type AuditorSettings = {
  pushNotifications: boolean;
  autoSyncOnline: boolean;
  syncWifiOnly: boolean;
  defaultReportsView: 'location' | 'asset';
  defaultReportsTab: 'todo' | 'inprogress' | 'completed';
  reminderFrequency: 'off' | 'daily' | 'every_2_days';
  dueUrgencyIndicators: boolean;
  largeTouchTargets: boolean;
  showOnlyAssignedScope: boolean;
};

export type AdminSettings = {
  pushNotifications: boolean;
  autoSyncOnline: boolean;
  syncWifiOnly: boolean;
  defaultAdminSection: 'users' | 'locations' | 'reports' | 'assets';
  reminderFrequency: 'off' | 'daily' | 'every_2_days';
  dueUrgencyIndicators: boolean;
  largeTouchTargets: boolean;
};

const DEFAULTS: AuditorSettings = {
  pushNotifications: false,
  autoSyncOnline: true,
  syncWifiOnly: true,
  defaultReportsView: 'location',
  defaultReportsTab: 'todo',
  reminderFrequency: 'daily',
  dueUrgencyIndicators: true,
  largeTouchTargets: false,
  showOnlyAssignedScope: true,
};

const ADMIN_DEFAULTS: AdminSettings = {
  pushNotifications: false,
  autoSyncOnline: true,
  syncWifiOnly: true,
  defaultAdminSection: 'users',
  reminderFrequency: 'daily',
  dueUrgencyIndicators: true,
  largeTouchTargets: false,
};

type SettingsRow = {
  user_id: string;
  push_notifications: boolean | null;
  auto_sync_online: boolean | null;
  sync_wifi_only: boolean | null;
  default_reports_view: string | null;
  default_reports_tab: string | null;
  reminder_frequency: string | null;
  due_urgency_indicators: boolean | null;
  large_touch_targets: boolean | null;
  show_only_assigned_scope: boolean | null;
};

function safeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function mapRow(row: SettingsRow | null): AuditorSettings {
  if (!row) return DEFAULTS;
  return {
    pushNotifications: Boolean(row.push_notifications),
    autoSyncOnline: row.auto_sync_online ?? DEFAULTS.autoSyncOnline,
    syncWifiOnly: row.sync_wifi_only ?? DEFAULTS.syncWifiOnly,
    defaultReportsView: safeEnum(row.default_reports_view, ['location', 'asset'], DEFAULTS.defaultReportsView),
    defaultReportsTab: safeEnum(
      row.default_reports_tab,
      ['todo', 'inprogress', 'completed'],
      DEFAULTS.defaultReportsTab
    ),
    reminderFrequency: safeEnum(
      row.reminder_frequency,
      ['off', 'daily', 'every_2_days'],
      DEFAULTS.reminderFrequency
    ),
    dueUrgencyIndicators: row.due_urgency_indicators ?? DEFAULTS.dueUrgencyIndicators,
    largeTouchTargets: row.large_touch_targets ?? DEFAULTS.largeTouchTargets,
    // Deprecated: assets are now always shown to auditors.
    showOnlyAssignedScope: false,
  };
}

export async function fetchAuditorSettings(userId: string | null | undefined): Promise<AuditorSettings> {
  if (!userId) return DEFAULTS;
  const { data, error } = await supabase
    .from('user_settings')
    .select(
      'user_id, push_notifications, auto_sync_online, sync_wifi_only, default_reports_view, default_reports_tab, reminder_frequency, due_urgency_indicators, large_touch_targets, show_only_assigned_scope'
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return DEFAULTS;

  const mapped = mapRow((data as SettingsRow | null) ?? null);

  // First login (or legacy user) bootstrap: ensure a persisted row exists.
  if (!data) {
    const now = new Date().toISOString();
    await supabase.from('user_settings').upsert(
      [
        {
          user_id: userId,
          push_notifications: mapped.pushNotifications,
          auto_sync_online: mapped.autoSyncOnline,
          sync_wifi_only: mapped.syncWifiOnly,
          default_reports_view: mapped.defaultReportsView,
          default_reports_tab: mapped.defaultReportsTab,
          reminder_frequency: mapped.reminderFrequency,
          due_urgency_indicators: mapped.dueUrgencyIndicators,
          large_touch_targets: mapped.largeTouchTargets,
          show_only_assigned_scope: false,
          updated_at: now,
        },
      ],
      { onConflict: 'user_id' }
    );
  }

  return mapped;
}

export async function saveAuditorSettings(
  userId: string,
  settings: AuditorSettings
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase.from('user_settings').upsert(
      [
        {
          user_id: userId,
          push_notifications: settings.pushNotifications,
          auto_sync_online: settings.autoSyncOnline,
          sync_wifi_only: settings.syncWifiOnly,
          default_reports_view: settings.defaultReportsView,
          default_reports_tab: settings.defaultReportsTab,
          reminder_frequency: settings.reminderFrequency,
          due_urgency_indicators: settings.dueUrgencyIndicators,
          large_touch_targets: settings.largeTouchTargets,
          show_only_assigned_scope: false,
          updated_at: now,
        },
      ],
      { onConflict: 'user_id' }
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not save settings.',
    };
  }
}

export const defaultAuditorSettings = DEFAULTS;

function mapAdminRow(row: SettingsRow | null): AdminSettings {
  if (!row) return ADMIN_DEFAULTS;
  return {
    pushNotifications: Boolean(row.push_notifications),
    autoSyncOnline: row.auto_sync_online ?? ADMIN_DEFAULTS.autoSyncOnline,
    syncWifiOnly: row.sync_wifi_only ?? ADMIN_DEFAULTS.syncWifiOnly,
    // Reuse existing persisted enum field for admin landing section.
    defaultAdminSection: safeEnum(
      row.default_reports_tab,
      ['users', 'locations', 'reports', 'assets'],
      ADMIN_DEFAULTS.defaultAdminSection
    ),
    reminderFrequency: safeEnum(
      row.reminder_frequency,
      ['off', 'daily', 'every_2_days'],
      ADMIN_DEFAULTS.reminderFrequency
    ),
    dueUrgencyIndicators: row.due_urgency_indicators ?? ADMIN_DEFAULTS.dueUrgencyIndicators,
    largeTouchTargets: row.large_touch_targets ?? ADMIN_DEFAULTS.largeTouchTargets,
  };
}

export async function fetchAdminSettings(userId: string | null | undefined): Promise<AdminSettings> {
  if (!userId) return ADMIN_DEFAULTS;
  const { data, error } = await supabase
    .from('user_settings')
    .select(
      'user_id, push_notifications, auto_sync_online, sync_wifi_only, default_reports_view, default_reports_tab, reminder_frequency, due_urgency_indicators, large_touch_targets, show_only_assigned_scope'
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return ADMIN_DEFAULTS;
  const mapped = mapAdminRow((data as SettingsRow | null) ?? null);
  if (!data) {
    await saveAdminSettings(userId, mapped);
  }
  return mapped;
}

export async function saveAdminSettings(
  userId: string,
  settings: AdminSettings
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase.from('user_settings').upsert(
      [
        {
          user_id: userId,
          push_notifications: settings.pushNotifications,
          auto_sync_online: settings.autoSyncOnline,
          sync_wifi_only: settings.syncWifiOnly,
          // Keep auditor-specific view untouched for admins.
          default_reports_tab: settings.defaultAdminSection,
          reminder_frequency: settings.reminderFrequency,
          due_urgency_indicators: settings.dueUrgencyIndicators,
          large_touch_targets: settings.largeTouchTargets,
          show_only_assigned_scope: false,
          updated_at: now,
        },
      ],
      { onConflict: 'user_id' }
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not save settings.',
    };
  }
}

export const defaultAdminSettings = ADMIN_DEFAULTS;
