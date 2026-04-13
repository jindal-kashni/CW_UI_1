import type { Assessor, AuditAssignment, AuditHistoryEntry } from '@/src/types/models';

export const assessorKeyaan: Assessor = {
  id: 'assessor-keyaan',
  name: 'Auditor',
  role: 'Auditor',
  org: 'Currumbin Wildlife Sanctuary',
};

export const auditAssignments: AuditAssignment[] = [
  {
    id: 'aud-assign-001',
    title: 'Condition Report Task · CWS-ELC-030',
    dueAt: '2026-04-18',
    locationScope: { precincts: ['Central Precinct'] },
    assetId: 'ast-010',
    status: 'InProgress',
    progressPct: 55,
    assignedTo: assessorKeyaan,
    summary:
      'Single-task report for Retail POS Power Backup (UPS Unit 2) in Main Entry & Retail.',
  },
  {
    id: 'aud-assign-002',
    title: 'Condition Report Task · CWS-SAF-003',
    dueAt: '2026-04-22',
    locationScope: { precincts: ['Transit Loop'] },
    assetId: 'ast-006',
    status: 'Assigned',
    progressPct: 0,
    assignedTo: assessorKeyaan,
    summary:
      'Single-task report for Mini-Rail Station Platform Handrail – East.',
  },
  {
    id: 'aud-assign-003',
    title: 'Condition Report Task · CWS-PLB-006',
    dueAt: '2026-04-25',
    locationScope: { precincts: ['Northern Walk'] },
    assetId: 'ast-005',
    status: 'DraftSaved',
    progressPct: 25,
    assignedTo: assessorKeyaan,
    summary:
      'Single-task report for Koala Habitat Misting Line (Valve Set 2).',
  },
  {
    id: 'aud-assign-004',
    title: 'Condition Report Task · CWS-PLB-011',
    dueAt: '2026-04-19',
    locationScope: { precincts: ['Northern Walk'] },
    assetId: 'ast-012',
    status: 'Assigned',
    progressPct: 0,
    assignedTo: assessorKeyaan,
    summary:
      'Single-task report for Saltwater Crocodile Habitat Filtration Pump.',
  },
  {
    id: 'aud-assign-005',
    title: 'Condition Report Task · CWS-FAC-028',
    dueAt: '2026-04-21',
    locationScope: { precincts: ['Southern Walk'] },
    assetId: 'ast-016',
    status: 'InProgress',
    progressPct: 40,
    assignedTo: assessorKeyaan,
    summary:
      'Single-task report for Pelican Feeding Deck Timber Balustrade.',
  },
  {
    id: 'aud-assign-006',
    title: 'Condition Report Task · CWS-VEH-002',
    dueAt: '2026-04-24',
    locationScope: { precincts: ['Operations'] },
    assetId: 'ast-020',
    status: 'Assigned',
    progressPct: 0,
    assignedTo: assessorKeyaan,
    summary:
      'Single-task report for Sanctuary Utility Buggy – EV Unit 2.',
  },
  {
    id: 'aud-assign-007',
    title: 'Condition Report Task · CWS-IT-010',
    dueAt: '2026-04-27',
    locationScope: { precincts: ['Central Precinct'] },
    assetId: 'ast-015',
    status: 'DraftSaved',
    progressPct: 30,
    assignedTo: assessorKeyaan,
    summary:
      'Single-task report for Conservation Hub Public Touchscreen Kiosk.',
  },
  {
    id: 'aud-assign-008',
    title: 'Condition Report Task · CWS-GRD-021',
    dueAt: '2026-04-29',
    locationScope: { precincts: ['Southern Walk'] },
    assetId: 'ast-019',
    status: 'Assigned',
    progressPct: 0,
    assignedTo: assessorKeyaan,
    summary:
      'Single-task report for Rainforest Trail Elevated Timber Steps.',
  },
];

export const auditHistory: AuditHistoryEntry[] = [
  {
    id: 'aud-hist-2026-03',
    auditTitle: 'Monthly Walkthrough – Southern Walk',
    completedAt: '2026-03-28',
    location: { precinct: 'Southern Walk', zone: 'Wetlands Boardwalk' },
    scoreLabel: 'Acceptable',
    notes: 'Minor decking soft spots noted; no immediate closures required.',
  },
  {
    id: 'aud-hist-2026-02',
    auditTitle: 'Ops Audit – Quarantine & Holding',
    completedAt: '2026-02-27',
    location: { precinct: 'Operations', zone: 'Quarantine & Holding' },
    scoreLabel: 'Strong',
    notes: 'Gates and latches functioning well; cleaning stations fully stocked.',
  },
  {
    id: 'aud-hist-2026-01',
    auditTitle: 'Condition Report – Crocodile Filtration Pump',
    completedAt: '2026-01-31',
    location: { precinct: 'Northern Walk', zone: 'Reptile House' },
    scoreLabel: 'NeedsAttention',
    notes: 'Pump vibration exceeded threshold under sustained flow.',
  },
  {
    id: 'aud-hist-2025-12',
    auditTitle: 'Condition Report – Mini-Rail Platform Handrail',
    completedAt: '2025-12-14',
    location: { precinct: 'Transit Loop', zone: 'Mini-Rail Stations' },
    scoreLabel: 'Acceptable',
    notes: 'Corrosion treatment applied; follow-up due in 90 days.',
  },
  {
    id: 'aud-hist-2025-11',
    auditTitle: 'Condition Report – Vet Pharmacy Cold Storage',
    completedAt: '2025-11-22',
    location: { precinct: 'Operations', zone: 'Veterinary Clinic' },
    scoreLabel: 'Strong',
    notes: 'Temperature compliance sustained across full monthly cycle.',
  },
  {
    id: 'aud-hist-2025-10',
    auditTitle: 'Condition Report – Rainforest Trail Steps',
    completedAt: '2025-10-09',
    location: { precinct: 'Southern Walk', zone: 'Wetlands Boardwalk' },
    scoreLabel: 'Acceptable',
    notes: 'Surface wear noted; anti-slip strips partially replaced.',
  },
];

