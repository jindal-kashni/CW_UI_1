export const departments = [
  { id: 'dept-operations', name: 'Operations' },
  { id: 'dept-animal-care', name: 'Animal Care' },
  { id: 'dept-visitor-services', name: 'Visitor Services' },
  { id: 'dept-facilities', name: 'Facilities & Grounds' },
] as const;

export const rooms = [
  { id: 'room-entry-retail-office', name: 'Retail Admin Office', location_id: 'loc-central-entrance' },
  { id: 'room-entry-pos-bay', name: 'POS Equipment Bay', location_id: 'loc-central-entrance' },
  { id: 'room-lorikeet-north-flight', name: 'North Flight Zone', location_id: 'loc-lorikeet-aviary' },
  { id: 'room-koala-misting-hub', name: 'Misting Hub', location_id: 'loc-koala-habitat' },
  { id: 'room-reptile-back-service', name: 'Back Service Corridor', location_id: 'loc-reptile-house' },
  { id: 'room-minirail-east-platform', name: 'East Platform', location_id: 'loc-minirail' },
  { id: 'room-vet-treatment-1', name: 'Treatment Room 1', location_id: 'loc-vet-clinic' },
  { id: 'room-quarantine-gate-a', name: 'Gate A', location_id: 'loc-quarantine' },
  { id: 'room-wetlands-section-c', name: 'Boardwalk Section C', location_id: 'loc-wetlands' },
  { id: 'room-birdshow-seating-r3', name: 'Seating Row 3', location_id: 'loc-bird-show' },
] as const;

export const departmentById = Object.fromEntries(departments.map((d) => [d.id, d])) as Record<
  string,
  (typeof departments)[number]
>;
export const roomById = Object.fromEntries(rooms.map((r) => [r.id, r])) as Record<
  string,
  (typeof rooms)[number]
>;

