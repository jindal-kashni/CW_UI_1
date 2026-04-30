export type ID = string;

export type AssetCategory =
  | 'Facilities'
  | 'AnimalEnclosure'
  | 'Grounds'
  | 'Electrical'
  | 'Plumbing'
  | 'IT'
  | 'Vehicles'
  | 'Safety';

// Matches DB check constraint on `asset.condition`.
export type AssetCondition =
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Poor'
  | 'Needs urgent attention';

export type AuditStatus = 'Assigned' | 'InProgress' | 'DraftSaved' | 'Submitted' | 'Completed';

export type Criticality = 'Low' | 'Medium' | 'High' | 'Critical';

export type SyncState = 'UpToDate' | 'Pending' | 'Failed' | 'Offline';

export type Location = {
  id: ID;
  name: string;
  department_id?: ID;
  department_name?: string;
  // Backward-compatible aliases used across existing screens.
  precinct: string;
  zone: string;
  notes?: string;
};

export type Asset = {
  id: ID;
  // Identity
  asset_code: string;
  name: string;
  category: string;
  sub_category: string;
  description: string;
  make_model: string;
  serial_number: string;
  // Matches DB check constraint on `asset.status`.
  status: 'Active' | 'Under repair' | 'Decommissioned' | 'Disposed' | 'Missing';
  // Context
  location_id: ID;
  room_id: ID;
  dept_id: ID;
  assigned_to: string;
  // Condition and operational significance
  condition: AssetCondition;
  criticality: Criticality;
  remaining_life_years: number;
  utilisation: 'Low' | 'Moderate' | 'High' | 'VeryHigh';
  compatibility_of_use: 'FullyCompatible' | 'PartiallyCompatible' | 'NotCompatible';
  environmental_impact: 'Low' | 'Medium' | 'High';
  // Lifecycle and financials
  purchase_date: string; // ISO date
  purchase_cost: number;
  replacement_cost: number;
  warranty_expiry: string; // ISO date
  last_serviced_date: string; // ISO date
  next_service_date: string; // ISO date
  // Notes and metadata
  notes: string;
  created_at: string; // ISO date-time
  updated_at: string; // ISO date-time
  // Backward-compatible fields for existing screens/components.
  tag?: string;
  locationId?: ID;
  operational?: boolean;
  lastAuditedAt?: string;
};

export type AssetAuditHistoryItem = {
  id: ID;
  asset_id: ID;
  audit_date: string; // ISO date
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
  dueAt: string; // ISO date
  locationScope: { precincts: string[] };
  assetId: ID;
  status: AuditStatus;
  progressPct: number; // 0..100
  assignedTo: Assessor;
  summary: string;
};

export type AlertItem = {
  id: ID;
  kind: 'OverdueAudit' | 'CriticalCondition' | 'SyncIssue' | 'AssetFlag';
  title: string;
  body: string;
  createdAt: string; // ISO date-time
  severity: 'Info' | 'Attention' | 'Urgent';
  read: boolean;
  completedAt?: string; // ISO date-time when marked completed
  related?: { assetId?: ID; auditId?: ID };
};

export type SyncItem = {
  id: ID;
  label: string;
  state: SyncState;
  updatedAt: string; // ISO date-time
  detail?: string;
};

export type AuditHistoryEntry = {
  id: ID;
  auditTitle: string;
  completedAt: string; // ISO date
  location: { precinct: string; zone?: string };
  scoreLabel: 'Strong' | 'Acceptable' | 'NeedsAttention';
  notes: string;
};

export type UserProfile = {
  id: ID;
  name: string;
  initials: string;
  role: 'Admin' | 'Auditor';
  org: string;
  offlineMode: boolean;
  lastSyncAt: string; // ISO date-time
};

// Friendly display labels used by status pills/cards in the UI.
export function formatAssetStatus(value: Asset['status']): string {
  return value;
}

export function formatAssetCondition(value: AssetCondition): string {
  return value;
}

