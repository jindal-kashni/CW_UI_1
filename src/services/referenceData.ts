import { supabase } from '@/utils/supabase';

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export type DepartmentRecord = {
  id: string;
  name: string;
};

export type LocationRecord = {
  id: string;
  name: string;
  type: string;
  siteZone: string;
  departmentId: string;
  starRating: number;
  evacuationPlanStatus: string;
  heritageListed: boolean;
  iconic: boolean;
  socialSignificance: string;
  culturalHeritage: string;
  communityAttachment: string;
  governmentCommitment: string;
  inspectionDate: string;
  inspectorName: string;
  assessorComments: string;
};

export type RoomRecord = {
  id: string;
  locationId: string;
  name: string;
  roomNumber: string;
  floorLevel: string;
  notes: string;
};

export async function fetchDepartments(): Promise<DepartmentRecord[]> {
  const { data, error } = await supabase.from('department').select('*').order('name', { ascending: true });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: asString(row.dept_id),
    name: asString(row.name),
  }));
}

export async function fetchLocations(): Promise<LocationRecord[]> {
  const { data, error } = await supabase.from('location').select('*').order('name', { ascending: true });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map(mapLocationRow);
}

export async function fetchRooms(): Promise<RoomRecord[]> {
  const { data, error } = await supabase.from('room').select('*').order('room_name', { ascending: true });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: asString(row.room_id),
    locationId: asString(row.location_id),
    name: asString(row.room_name || row.name),
    roomNumber: asString(row.room_number),
    floorLevel: asString(row.floor_level),
    notes: asString(row.notes),
  }));
}

export async function createLocation(payload: {
  name: string;
  type: 'building' | 'open_habitat' | 'enclosed_habitat';
  siteZone?: string;
  departmentId?: string;
  starRating?: number;
  evacuationPlanStatus?: string;
  heritageListed?: boolean;
  iconic?: boolean;
  socialSignificance?: string;
  culturalHeritage?: string;
  communityAttachment?: string;
  governmentCommitment?: string;
  inspectionDate?: string;
  inspectorName?: string;
  assessorComments?: string;
}): Promise<LocationRecord> {
  const { data, error } = await supabase
    .from('location')
    .insert([
      {
        name: payload.name.trim(),
        location_type: payload.type,
        site_zone: payload.siteZone?.trim() || null,
        dept_id: payload.departmentId || null,
        star_rating: payload.starRating ?? 3,
        evacuation_plan_status: payload.evacuationPlanStatus || null,
        heritage_listed: payload.heritageListed ?? false,
        iconic: payload.iconic ?? false,
        social_significance: payload.socialSignificance?.trim() || null,
        cultural_heritage: payload.culturalHeritage?.trim() || null,
        community_attachment: payload.communityAttachment?.trim() || null,
        government_commitment: payload.governmentCommitment?.trim() || null,
        inspection_date: payload.inspectionDate || null,
        inspector_name: payload.inspectorName?.trim() || null,
        assessor_comments: payload.assessorComments?.trim() || null,
      },
    ])
    .select('*')
    .single();
  if (error) throw error;
  return mapLocationRow(data as Record<string, unknown>);
}

export async function updateLocation(
  id: string,
  updates: {
    name: string;
    type: 'building' | 'open_habitat' | 'enclosed_habitat';
    siteZone?: string;
    departmentId?: string;
    starRating?: number;
    evacuationPlanStatus?: string;
    heritageListed?: boolean;
    iconic?: boolean;
    socialSignificance?: string;
    culturalHeritage?: string;
    communityAttachment?: string;
    governmentCommitment?: string;
    inspectionDate?: string;
    inspectorName?: string;
    assessorComments?: string;
  }
): Promise<LocationRecord> {
  const { data, error } = await supabase
    .from('location')
    .update({
      name: updates.name.trim(),
      location_type: updates.type,
      site_zone: updates.siteZone?.trim() || null,
      dept_id: updates.departmentId || null,
      star_rating: updates.starRating ?? 3,
      evacuation_plan_status: updates.evacuationPlanStatus || null,
      heritage_listed: updates.heritageListed ?? false,
      iconic: updates.iconic ?? false,
      social_significance: updates.socialSignificance?.trim() || null,
      cultural_heritage: updates.culturalHeritage?.trim() || null,
      community_attachment: updates.communityAttachment?.trim() || null,
      government_commitment: updates.governmentCommitment?.trim() || null,
      inspection_date: updates.inspectionDate || null,
      inspector_name: updates.inspectorName?.trim() || null,
      assessor_comments: updates.assessorComments?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('location_id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapLocationRow(data as Record<string, unknown>);
}

function mapLocationRow(row: Record<string, unknown>): LocationRecord {
  return {
    id: asString(row.location_id),
    name: asString(row.name),
    type: asString(row.location_type || row.type || row.kind),
    siteZone: asString(row.site_zone || row.siteZone || row.zone),
    departmentId: asString(row.dept_id || row.department_id),
    starRating: typeof row.star_rating === 'number' ? row.star_rating : 3,
    evacuationPlanStatus: asString(row.evacuation_plan_status),
    heritageListed: Boolean(row.heritage_listed),
    iconic: Boolean(row.iconic),
    socialSignificance: asString(row.social_significance),
    culturalHeritage: asString(row.cultural_heritage),
    communityAttachment: asString(row.community_attachment),
    governmentCommitment: asString(row.government_commitment),
    inspectionDate: asString(row.inspection_date),
    inspectorName: asString(row.inspector_name),
    assessorComments: asString(row.assessor_comments),
  };
}

export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase.from('location').delete().eq('location_id', id);
  if (error) throw error;
}
