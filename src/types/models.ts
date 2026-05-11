export type ID = string;

export type AssetCategory =
  | 'Electrical Equipment'
  | 'HVAC / Refrigeration'
  | 'Vehicles & Mobile Machinery'
  | 'Furniture & External Fixtures'
  | 'WHS & Safety Equipment'
  | 'Interior Infrastructure'
  | 'Exterior Infrastructure'
  | 'Playground Assets'
  | 'Grounds & Maintenance Equipment'
  | 'Other / Miscellaneous';

export type AssetStatus =
  | 'Active'
  | 'Under repair'
  | 'Decommissioned'
  | 'Disposed'
  | 'Missing';

export type AssetSubCategory = string;

export type Criticality = 'Low' | 'Medium' | 'High' | 'Critical';

export type InspectionFrequency =
  | 'Monthly'
  | 'Quarterly'
  | '6-monthly'
  | 'Annually'
  | 'Every 2 years'
  | 'Every 3 years'
  | 'Every 5 years'
  | 'As required';

export type FohBoh = 'FOH' | 'BOH' | 'Mixed';

export type ConditionRating = 1 | 2 | 3 | 4 | 5;

export type OperationalStatus =
  | 'Operational'
  | 'Partially Operational'
  | 'Not Operational'
  | 'Not Inspected';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ReportStatus =
  | 'Draft'
  | 'Assigned'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled';

export type ReportAssetStatus =
  | 'NotStarted'
  | 'InProgress'
  | 'Completed'
  | 'Flagged'
  | 'Skipped';

export type SyncState = 'UpToDate' | 'Pending' | 'Failed' | 'Offline';

export type UserRole = 'Admin' | 'Auditor';

/**
 * Kept for backward compatibility with older screens.
 * New audit condition should use condition_rating in AssetAuditReport.
 */
export type AssetCondition =
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Poor'
  | 'Needs urgent attention';

/**
 * Old assignment status.
 * Kept temporarily for old screens that have not been refactored yet.
 */
export type AuditStatus =
  | 'Assigned'
  | 'InProgress'
  | 'DraftSaved'
  | 'Submitted'
  | 'Completed';

export type Location = {
  id: ID;
  location_id?: ID;
  name: string;
  location_type?: string;
  site_zone?: string;
  dept_id?: ID | null;
  department_id?: ID | null;
  department_name?: string;
  star_rating?: number;
  evacuation_plan_status?: string | null;
  notes?: string;

  // Backward-compatible aliases used across existing screens.
  precinct: string;
  zone: string;
};

export type Room = {
  id: ID;
  room_id?: ID;
  location_id: ID;
  room_name?: string | null;
  room_number?: string | null;
  floor_level?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Department = {
  id: ID;
  dept_id?: ID;
  name: string;
  manager_name?: string | null;
  contact_email?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Asset = {
  id: ID;
  asset_id?: ID;

  // Static asset identity
  asset_code: string;
  name: string;
  category: AssetCategory | string;
  sub_category: AssetSubCategory | string | null;
  description: string | null;

  // Location and ownership
  location_id: ID | null;
  room_id: ID | null;
  dept_id: ID | null;
  foh_boh: FohBoh | null;

  // Asset details
  make_model: string | null;
  serial_number: string | null;

  // Financial and lifecycle data
  purchase_date: string | null;
  purchase_cost: number | null;
  replacement_cost: number | null;
  warranty_expiry: string | null;
  criticality: Criticality | null;
  inspection_frequency: InspectionFrequency | string | null;
  status: AssetStatus;

  // Photos
  asset_photo_urls?: string[] | null;

  // Existing static fields still present in DB.
  assigned_to?: string | null;
  utilisation?: string | null;
  compatibility_of_use?: string | null;
  environmental_impact?: string | null;
  notes?: string | null;

  // Metadata
  created_at: string;
  updated_at: string;

  // Joined display data from Supabase queries.
  location?: {
    location_id?: ID;
    name?: string;
    site_zone?: string | null;
  } | null;
  room?: {
    room_id?: ID;
    room_name?: string | null;
    room_number?: string | null;
    floor_level?: number | null;
  } | null;
  department?: {
    dept_id?: ID;
    name?: string;
  } | null;

  // Backward-compatible fields for existing screens/components.
  tag?: string;
  locationId?: ID;
  operational?: boolean;
  lastAuditedAt?: string;
  condition?: AssetCondition;
  remaining_life_years?: number;
  last_serviced_date?: string;
  next_service_date?: string;
};

export type Report = {
  id: ID;
  report_id?: ID;
  title: string;
  description?: string | null;
  location_id?: ID | null;
  assigned_user_id?: ID | null;
  created_by?: ID | null;
  status: ReportStatus;
  due_at?: string | null;
  progress_pct: number;
  summary?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;

  location?: {
    location_id?: ID;
    name?: string;
    site_zone?: string | null;
  } | null;

  assigned_user?: {
    user_id?: ID;
    name?: string;
    email?: string;
    role?: UserRole;
  } | null;
};

export type ReportAsset = {
  id: ID;
  report_asset_id?: ID;
  report_id: ID;
  asset_id: ID | null;
  assigned_user_id?: ID | null;
  status: ReportAssetStatus;
  started_at?: string | null;
  completed_at?: string | null;
  due_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;

  asset?: Asset | null;
};

export type AssetAuditReport = {
  id: ID;
  asset_audit_report_id?: ID;

  report_id: ID;
  report_asset_id: ID;
  asset_id: ID | null;

  completed_by: ID | null;
  completed_at: string | null;

  condition_rating: ConditionRating;
  expected_remaining_life_years: number | null;
  operational_status: OperationalStatus;

  maintenance_required: boolean;
  replacement_required: boolean;
  priority_level: PriorityLevel;

  estimated_maintenance_cost?: number | null;
  estimated_replacement_cost?: number | null;

  safety_concern: boolean;
  critical_alert?: boolean;

  issue_description?: string | null;
  recommended_action?: string | null;
  general_notes: string | null;
  photo_urls: string[] | null;

  created_at: string;
  updated_at: string;

  asset?: Asset | null;
  report?: Report | null;
  report_asset?: ReportAsset | null;
};

export type RefDropdown = {
  ref_id?: ID;
  field_name: string;
  allowed_value: string;
  parent_value?: string | null;
  star_rating_map?: number | null;
  sort_order?: number | null;
};

export type AssetAuditHistoryItem = {
  id: ID;
  asset_id: ID;
  audit_date: string;
  inspector_name: string;
  findings: string;
  photo_taken: boolean;
  notes: string;
};

export type Assessor = {
  id: ID;
  name: string;
  role: 'Auditor' | 'Supervisor';
  org: string;
};

export type AuditAssignment = {
  id: ID;
  title: string;
  dueAt: string;
  locationScope: { precincts: string[] };
  locationId?: ID;
  roomId?: ID;
  assetId: ID;
  status: AuditStatus;
  progressPct: number;
  assignedTo: Assessor;
  summary: string;
};

export type AlertItem = {
  id: ID;
  kind: 'OverdueAudit' | 'CriticalCondition' | 'SyncIssue' | 'AssetFlag';
  title: string;
  body: string;
  createdAt: string;
  severity: 'Info' | 'Attention' | 'Urgent';
  read: boolean;
  completedAt?: string;
  related?: {
    assetId?: ID;
    auditId?: ID;
    assetAuditReportId?: ID;
  };
};

export type SyncItem = {
  id: ID;
  label: string;
  state: SyncState;
  updatedAt: string;
  detail?: string;
};

export type AuditHistoryEntry = {
  id: ID;
  auditTitle: string;
  completedAt: string;
  location: { precinct: string; zone?: string };
  scoreLabel: 'Strong' | 'Acceptable' | 'NeedsAttention';
  notes: string;
};

export type UserProfile = {
  id: ID;
  user_id?: ID;
  name: string;
  email?: string;
  initials: string;
  role: UserRole;
  org: string;
  offlineMode: boolean;
  lastSyncAt: string;
};

export function formatAssetStatus(value: AssetStatus | string): string {
  return value;
}

export function formatAssetCondition(value: AssetCondition): string {
  return value;
}

export function formatConditionRating(value: ConditionRating | number | null | undefined): string {
  switch (value) {
    case 5:
      return 'Excellent';
    case 4:
      return 'Good';
    case 3:
      return 'Fair';
    case 2:
      return 'Poor';
    case 1:
      return 'Needs urgent attention';
    default:
      return 'Not rated';
  }
}