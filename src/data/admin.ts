export type AdminRole = 'Admin' | 'Auditor';

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'Active' | 'Inactive';
  lastActive: string;
  departmentId: string;
};

export type AdminDepartmentRecord = {
  id: string;
  name: string;
  managerName: string;
  contactEmail: string;
  notes: string;
};

export type AdminLocationType = 'Building' | 'OpenHabitat' | 'EnclosedHabitat';

export type AdminLocationRecord = {
  id: string;
  name: string;
  type: AdminLocationType;
  siteZone: string;
  departmentId: string;
  starRating: number;
  heritageSignificance: 'Low' | 'Medium' | 'High';
  significanceNotes: string;
  inspectionFrequency: 'Monthly' | 'Quarterly' | 'Biannual' | 'Annual';
  lastInspection: string;
  nextInspection: string;
  assessorComments: string;
  attachments: string[];
};

export type AdminRoomRecord = {
  id: string;
  locationId: string;
  roomName: string;
  roomNumber: string;
  floorLevel: string;
  notes: string;
};

export type AdminReportRecord = {
  id: string;
  title: string;
  assetCode: string;
  locationId: string;
  roomId: string;
  departmentId: string;
  assignedUserId: string;
  status: 'ToDo' | 'InProgress' | 'Completed';
  dueDate: string;
  submittedAt?: string;
  progressPct: number;
  findings: string;
  comments: string;
  photoCount: number;
};

export type AdminSyncRecord = {
  id: string;
  userId: string;
  deviceLabel: string;
  state: 'UpToDate' | 'Pending' | 'Failed';
  updatedAt: string;
  detail: string;
};

export type AdminAlertRecord = {
  id: string;
  title: string;
  type: 'Sync' | 'Report' | 'Asset' | 'User';
  severity: 'Info' | 'Attention' | 'Urgent';
  status: 'Open' | 'Resolved';
  locationId?: string;
  userId?: string;
  createdAt: string;
  body: string;
};

export const adminDepartments: AdminDepartmentRecord[] = [
  {
    id: 'dept-admin-ops',
    name: 'Operations',
    managerName: 'Lara T.',
    contactEmail: 'ops@currumbin.com.au',
    notes: 'Oversees day-to-day sanctuary operations and logistics.',
  },
  {
    id: 'dept-admin-animal',
    name: 'Animal Care',
    managerName: 'Mia R.',
    contactEmail: 'animalcare@currumbin.com.au',
    notes: 'Welfare, habitat and veterinary support functions.',
  },
  {
    id: 'dept-admin-fac',
    name: 'Facilities & Grounds',
    managerName: 'Samir L.',
    contactEmail: 'facilities@currumbin.com.au',
    notes: 'Infrastructure integrity, maintenance planning and service delivery.',
  },
  {
    id: 'dept-admin-visitor',
    name: 'Visitor Services',
    managerName: 'Owen C.',
    contactEmail: 'visitor@currumbin.com.au',
    notes: 'Entry, retail, guest circulation and presentation spaces.',
  },
];

export const adminUsers: AdminUserRecord[] = [
  {
    id: 'usr-admin-001',
    name: 'Admin',
    email: 'admin@currumbin.com.au',
    role: 'Admin',
    status: 'Active',
    lastActive: '2026-04-14T08:45:00+10:00',
    departmentId: 'dept-admin-ops',
  },
  {
    id: 'usr-aud-001',
    name: 'Auditor',
    email: 'auditor@currumbin.com.au',
    role: 'Auditor',
    status: 'Active',
    lastActive: '2026-04-14T08:10:00+10:00',
    departmentId: 'dept-admin-fac',
  },
  {
    id: 'usr-aud-002',
    name: 'Mia R.',
    email: 'mia.r@currumbin.com.au',
    role: 'Auditor',
    status: 'Active',
    lastActive: '2026-04-14T07:50:00+10:00',
    departmentId: 'dept-admin-animal',
  },
  {
    id: 'usr-aud-003',
    name: 'Samir L.',
    email: 'samir.l@currumbin.com.au',
    role: 'Auditor',
    status: 'Inactive',
    lastActive: '2026-04-11T15:20:00+10:00',
    departmentId: 'dept-admin-fac',
  },
];

export const adminLocations: AdminLocationRecord[] = [
  {
    id: 'adm-loc-001',
    name: 'Reptile House',
    type: 'Building',
    siteZone: 'Central Precinct',
    departmentId: 'dept-admin-animal',
    starRating: 4,
    heritageSignificance: 'Medium',
    significanceNotes: 'High public traffic with species-sensitive controls.',
    inspectionFrequency: 'Monthly',
    lastInspection: '2026-04-05',
    nextInspection: '2026-05-05',
    assessorComments: 'Mechanical circulation and emergency lighting require close monitoring.',
    attachments: ['reptile_house_floorplan.pdf', 'services_riser_map.png'],
  },
  {
    id: 'adm-loc-002',
    name: 'Wetlands Boardwalk',
    type: 'OpenHabitat',
    siteZone: 'Wetlands Zone',
    departmentId: 'dept-admin-fac',
    starRating: 5,
    heritageSignificance: 'High',
    significanceNotes: 'Signature guest route with conservation storytelling significance.',
    inspectionFrequency: 'Monthly',
    lastInspection: '2026-04-02',
    nextInspection: '2026-05-02',
    assessorComments: 'Timber soft spots logged in section C.',
    attachments: ['wetlands_condition_map.jpg'],
  },
  {
    id: 'adm-loc-003',
    name: 'Koala Habitat',
    type: 'EnclosedHabitat',
    siteZone: 'North Habitat Zone',
    departmentId: 'dept-admin-animal',
    starRating: 5,
    heritageSignificance: 'High',
    significanceNotes: 'Core species attraction with welfare-critical services.',
    inspectionFrequency: 'Biannual',
    lastInspection: '2026-03-10',
    nextInspection: '2026-09-10',
    assessorComments: 'Night security systems operating within threshold.',
    attachments: ['koala_night_lighting_plan.pdf'],
  },
];

export const adminRooms: AdminRoomRecord[] = [
  {
    id: 'adm-room-001',
    locationId: 'adm-loc-001',
    roomName: 'Back Service Corridor',
    roomNumber: 'R-BSC',
    floorLevel: 'Ground',
    notes: 'Restricted access utility corridor.',
  },
  {
    id: 'adm-room-002',
    locationId: 'adm-loc-001',
    roomName: 'Quarantine Hold - Gate A',
    roomNumber: 'R-QA1',
    floorLevel: 'Ground',
    notes: 'Biosecurity controlled access room.',
  },
  {
    id: 'adm-room-003',
    locationId: 'adm-loc-002',
    roomName: 'Section C',
    roomNumber: 'W-C',
    floorLevel: 'Deck',
    notes: 'High wet season wear zone.',
  },
];

export const adminReports: AdminReportRecord[] = [
  {
    id: 'adm-rpt-001',
    title: 'Condition Report Task · CWS-PLB-011',
    assetCode: 'CWS-PLB-011',
    locationId: 'adm-loc-001',
    roomId: 'adm-room-001',
    departmentId: 'dept-admin-animal',
    assignedUserId: 'usr-aud-002',
    status: 'InProgress',
    dueDate: '2026-04-19',
    progressPct: 55,
    findings: 'Intermittent pressure drop observed under peak circulation load.',
    comments: 'Bypass active while contractor quote is pending.',
    photoCount: 2,
  },
  {
    id: 'adm-rpt-002',
    title: 'Condition Report Task · CWS-FAC-028',
    assetCode: 'CWS-FAC-028',
    locationId: 'adm-loc-002',
    roomId: 'adm-room-003',
    departmentId: 'dept-admin-fac',
    assignedUserId: 'usr-aud-001',
    status: 'ToDo',
    dueDate: '2026-04-22',
    progressPct: 0,
    findings: '',
    comments: '',
    photoCount: 0,
  },
  {
    id: 'adm-rpt-003',
    title: 'Condition Report Task · CWS-ELC-042',
    assetCode: 'CWS-ELC-042',
    locationId: 'adm-loc-003',
    roomId: 'adm-room-001',
    departmentId: 'dept-admin-ops',
    assignedUserId: 'usr-aud-001',
    status: 'Completed',
    dueDate: '2026-04-12',
    submittedAt: '2026-04-12',
    progressPct: 100,
    findings: 'Floodlight beam spread and glare control within standard.',
    comments: 'No follow-up actions.',
    photoCount: 0,
  },
  {
    id: 'adm-rpt-004',
    title: 'Condition Report Task · CWS-VEH-002',
    assetCode: 'CWS-VEH-002',
    locationId: 'adm-loc-001',
    roomId: 'adm-room-002',
    departmentId: 'dept-admin-ops',
    assignedUserId: 'usr-aud-001',
    status: 'InProgress',
    dueDate: '2026-04-24',
    progressPct: 35,
    findings: 'Power delivery cuts out on steep gradient near quarantine lane.',
    comments: 'Operating restriction applied.',
    photoCount: 3,
  },
  {
    id: 'adm-rpt-005',
    title: 'Condition Report Task · CWS-GRD-021',
    assetCode: 'CWS-GRD-021',
    locationId: 'adm-loc-002',
    roomId: 'adm-room-003',
    departmentId: 'dept-admin-fac',
    assignedUserId: 'usr-aud-003',
    status: 'Completed',
    dueDate: '2026-04-10',
    submittedAt: '2026-04-09',
    progressPct: 100,
    findings: 'Anti-slip nosing wear present on two high-use steps.',
    comments: 'Scheduled strip replacement before holiday peak.',
    photoCount: 2,
  },
];

export const adminAlerts: AdminAlertRecord[] = [
  {
    id: 'adm-alert-001',
    title: 'Sync backlog detected for 2 devices',
    type: 'Sync',
    severity: 'Attention',
    status: 'Open',
    createdAt: '2026-04-14T07:48:00+10:00',
    body: 'Two field iPads have pending uploads older than 6 hours.',
  },
  {
    id: 'adm-alert-002',
    title: 'Urgent condition flagged in Reptile House',
    type: 'Asset',
    severity: 'Urgent',
    status: 'Open',
    locationId: 'adm-loc-001',
    createdAt: '2026-04-14T06:40:00+10:00',
    body: 'Primary filtration pump recorded as needing urgent attention. Immediate review recommended.',
  },
  {
    id: 'adm-alert-003',
    title: 'Completed report awaiting admin review',
    type: 'Report',
    severity: 'Info',
    status: 'Open',
    userId: 'usr-aud-001',
    createdAt: '2026-04-13T16:15:00+10:00',
    body: 'CWS-ELC-042 submission is ready for admin sign-off.',
  },
  {
    id: 'adm-alert-004',
    title: 'Inactive auditor account over 72 hours',
    type: 'User',
    severity: 'Attention',
    status: 'Resolved',
    userId: 'usr-aud-003',
    createdAt: '2026-04-12T09:00:00+10:00',
    body: 'User account flagged for inactivity and queue reassignment.',
  },
];

export const adminSyncItems: AdminSyncRecord[] = [
  {
    id: 'adm-sync-001',
    userId: 'usr-aud-001',
    deviceLabel: 'iPad Pro 12.9 - Field Unit A',
    state: 'Pending',
    updatedAt: '2026-04-14T08:11:00+10:00',
    detail: '5 report payloads queued for upload.',
  },
  {
    id: 'adm-sync-002',
    userId: 'usr-aud-002',
    deviceLabel: 'iPad Air - Animal Care',
    state: 'Failed',
    updatedAt: '2026-04-14T08:05:00+10:00',
    detail: 'Photo upload failed due to unstable network segment.',
  },
  {
    id: 'adm-sync-003',
    userId: 'usr-admin-001',
    deviceLabel: 'Admin Console',
    state: 'UpToDate',
    updatedAt: '2026-04-14T08:44:00+10:00',
    detail: 'All records in sync.',
  },
];

export const adminDepartmentById = Object.fromEntries(
  adminDepartments.map((item) => [item.id, item])
) as Record<string, AdminDepartmentRecord>;

export const adminUserById = Object.fromEntries(adminUsers.map((item) => [item.id, item])) as Record<
  string,
  AdminUserRecord
>;

export const adminLocationById = Object.fromEntries(
  adminLocations.map((item) => [item.id, item])
) as Record<string, AdminLocationRecord>;

export const adminRoomById = Object.fromEntries(adminRooms.map((item) => [item.id, item])) as Record<
  string,
  AdminRoomRecord
>;

export const adminReportById = Object.fromEntries(
  adminReports.map((item) => [item.id, item])
) as Record<string, AdminReportRecord>;

