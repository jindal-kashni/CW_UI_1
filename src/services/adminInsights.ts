import { supabase } from '@/utils/supabase';

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export type ReferenceGroup = {
  fieldName: string;
  values: string[];
};

export type ComplianceCheckRecord = {
  id: string;
  checkType: string;
  status: string;
  checkedBy: string;
  checkDate: string;
  nextReviewDate: string;
  notes: string;
};

export type CapexForecastRecord = {
  id: string;
  item: string;
  recommendedAction: string;
  estimatedCost: number | null;
  priority: string;
  timeframe: string;
  identifiedDate: string;
  targetCompletion: string;
  notes: string;
};

export type ConstructionElementRecord = {
  id: string;
  locationId: string;
  category: string;
  elementName: string;
  material: string;
  condition: string;
  notes: string;
};

export type PowerDataServiceRecord = {
  id: string;
  roomId: string;
  dataPoints: number;
  powerPoints: number;
  lightingType: string;
  fireProtection: boolean;
  fireAlarms: boolean;
  emergencyLighting: boolean;
  exitSigns: boolean;
  notes: string;
};

export type PlumbingServiceRecord = {
  id: string;
  roomId: string;
  filteredWater: boolean;
  kitchenSink: boolean;
  bathroomSink: boolean;
  numToilets: number;
  plumbingFixtures: string;
  drainsClear: boolean;
  notes: string;
};

export async function fetchReferenceGroups(): Promise<ReferenceGroup[]> {
  const { data, error } = await supabase
    .from('ref_dropdown')
    .select('field_name, allowed_value, sort_order')
    .order('field_name', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error || !data) return [];

  const grouped = new Map<string, string[]>();
  for (const row of data as Array<Record<string, unknown>>) {
    const fieldName = asString(row.field_name);
    const allowedValue = asString(row.allowed_value);
    if (!fieldName || !allowedValue) continue;
    grouped.set(fieldName, [...(grouped.get(fieldName) ?? []), allowedValue]);
  }
  return Array.from(grouped.entries()).map(([fieldName, values]) => ({ fieldName, values }));
}

export async function fetchComplianceChecksForAsset(assetId: string): Promise<ComplianceCheckRecord[]> {
  const { data, error } = await supabase
    .from('compliance_check')
    .select('check_id, check_type, status, checked_by, check_date, next_review_date, notes')
    .eq('asset_id', assetId)
    .order('check_date', { ascending: false });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: asString(row.check_id),
    checkType: asString(row.check_type),
    status: asString(row.status),
    checkedBy: asString(row.checked_by),
    checkDate: asString(row.check_date),
    nextReviewDate: asString(row.next_review_date),
    notes: asString(row.notes),
  }));
}

export async function fetchCapexForecastForAsset(assetId: string): Promise<CapexForecastRecord[]> {
  const { data, error } = await supabase
    .from('capex_forecast')
    .select(
      'capex_id, item, recommended_action, estimated_cost, priority, timeframe, identified_date, target_completion, notes'
    )
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: asString(row.capex_id),
    item: asString(row.item),
    recommendedAction: asString(row.recommended_action),
    estimatedCost: typeof row.estimated_cost === 'number' ? row.estimated_cost : null,
    priority: asString(row.priority),
    timeframe: asString(row.timeframe),
    identifiedDate: asString(row.identified_date),
    targetCompletion: asString(row.target_completion),
    notes: asString(row.notes),
  }));
}

export async function fetchConstructionElementsForLocation(
  locationId: string
): Promise<ConstructionElementRecord[]> {
  const { data, error } = await supabase
    .from('construction_element')
    .select('element_id, location_id, category, element_name, material, condition, notes')
    .eq('location_id', locationId)
    .order('element_name', { ascending: true });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: asString(row.element_id),
    locationId: asString(row.location_id),
    category: asString(row.category),
    elementName: asString(row.element_name),
    material: asString(row.material),
    condition: asString(row.condition),
    notes: asString(row.notes),
  }));
}

export async function fetchConstructionElementById(
  elementId: string
): Promise<ConstructionElementRecord | null> {
  const { data, error } = await supabase
    .from('construction_element')
    .select('element_id, location_id, category, element_name, material, condition, notes')
    .eq('element_id', elementId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: asString(row.element_id),
    locationId: asString(row.location_id),
    category: asString(row.category),
    elementName: asString(row.element_name),
    material: asString(row.material),
    condition: asString(row.condition),
    notes: asString(row.notes),
  };
}

export async function fetchPowerDataServiceForRooms(
  roomIds: string[]
): Promise<PowerDataServiceRecord[]> {
  if (roomIds.length === 0) return [];
  const { data, error } = await supabase
    .from('power_data_service')
    .select(
      'service_id, room_id, data_points, power_points, lighting_type, fire_protection, fire_alarms, emergency_lighting, exit_signs, notes'
    )
    .in('room_id', roomIds);
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: asString(row.service_id),
    roomId: asString(row.room_id),
    dataPoints: typeof row.data_points === 'number' ? row.data_points : 0,
    powerPoints: typeof row.power_points === 'number' ? row.power_points : 0,
    lightingType: asString(row.lighting_type),
    fireProtection: Boolean(row.fire_protection),
    fireAlarms: Boolean(row.fire_alarms),
    emergencyLighting: Boolean(row.emergency_lighting),
    exitSigns: Boolean(row.exit_signs),
    notes: asString(row.notes),
  }));
}

export async function fetchPowerDataServiceById(
  serviceId: string
): Promise<PowerDataServiceRecord | null> {
  const { data, error } = await supabase
    .from('power_data_service')
    .select(
      'service_id, room_id, data_points, power_points, lighting_type, fire_protection, fire_alarms, emergency_lighting, exit_signs, notes'
    )
    .eq('service_id', serviceId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: asString(row.service_id),
    roomId: asString(row.room_id),
    dataPoints: typeof row.data_points === 'number' ? row.data_points : 0,
    powerPoints: typeof row.power_points === 'number' ? row.power_points : 0,
    lightingType: asString(row.lighting_type),
    fireProtection: Boolean(row.fire_protection),
    fireAlarms: Boolean(row.fire_alarms),
    emergencyLighting: Boolean(row.emergency_lighting),
    exitSigns: Boolean(row.exit_signs),
    notes: asString(row.notes),
  };
}

export async function fetchPlumbingServiceForRooms(
  roomIds: string[]
): Promise<PlumbingServiceRecord[]> {
  if (roomIds.length === 0) return [];
  const { data, error } = await supabase
    .from('plumbing_service')
    .select(
      'plumbing_id, room_id, filtered_water, kitchen_sink, bathroom_sink, num_toilets, plumbing_fixtures, drains_clear, notes'
    )
    .in('room_id', roomIds);
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: asString(row.plumbing_id),
    roomId: asString(row.room_id),
    filteredWater: Boolean(row.filtered_water),
    kitchenSink: Boolean(row.kitchen_sink),
    bathroomSink: Boolean(row.bathroom_sink),
    numToilets: typeof row.num_toilets === 'number' ? row.num_toilets : 0,
    plumbingFixtures: asString(row.plumbing_fixtures),
    drainsClear: Boolean(row.drains_clear),
    notes: asString(row.notes),
  }));
}

export async function fetchPlumbingServiceById(
  plumbingId: string
): Promise<PlumbingServiceRecord | null> {
  const { data, error } = await supabase
    .from('plumbing_service')
    .select(
      'plumbing_id, room_id, filtered_water, kitchen_sink, bathroom_sink, num_toilets, plumbing_fixtures, drains_clear, notes'
    )
    .eq('plumbing_id', plumbingId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: asString(row.plumbing_id),
    roomId: asString(row.room_id),
    filteredWater: Boolean(row.filtered_water),
    kitchenSink: Boolean(row.kitchen_sink),
    bathroomSink: Boolean(row.bathroom_sink),
    numToilets: typeof row.num_toilets === 'number' ? row.num_toilets : 0,
    plumbingFixtures: asString(row.plumbing_fixtures),
    drainsClear: Boolean(row.drains_clear),
    notes: asString(row.notes),
  };
}
