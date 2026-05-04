import { supabase } from '@/utils/supabase';
import type { Asset, AssetCondition, Criticality } from '@/src/types/models';

// Columns we read from the `asset` table. Aligns with DB schema.
const ASSET_COLUMNS = [
  'asset_id',
  'asset_code',
  'name',
  'category',
  'sub_category',
  'description',
  'make_model',
  'serial_number',
  'condition',
  'criticality',
  'status',
  'location_id',
  'room_id',
  'dept_id',
  'assigned_to',
  'remaining_life_years',
  'utilisation',
  'compatibility_of_use',
  'environmental_impact',
  'purchase_date',
  'purchase_cost',
  'replacement_cost',
  'warranty_expiry',
  'last_serviced_date',
  'next_service_date',
  'notes',
  'created_at',
  'updated_at',
].join(',');

type AssetRow = {
  asset_id: string;
  asset_code: string;
  name: string;
  category: string;
  sub_category: string | null;
  description: string | null;
  make_model: string | null;
  serial_number: string | null;
  condition: string | null;
  criticality: string | null;
  status: string;
  location_id: string | null;
  room_id: string | null;
  dept_id: string | null;
  assigned_to: string | null;
  remaining_life_years: number | null;
  utilisation: string | null;
  compatibility_of_use: string | null;
  environmental_impact: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  replacement_cost: number | null;
  warranty_expiry: string | null;
  last_serviced_date: string | null;
  next_service_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AssetListRow = {
  asset_id: string;
  asset_code: string;
  name: string;
  category: string;
  criticality: string | null;
  status: string;
  location_id: string | null;
  room_id: string | null;
  dept_id: string | null;
};

const ALLOWED_CONDITIONS: AssetCondition[] = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Needs urgent attention',
];

const ALLOWED_CRITICALITIES: Criticality[] = ['Low', 'Medium', 'High', 'Critical'];

const ALLOWED_STATUSES: Asset['status'][] = [
  'Active',
  'Under repair',
  'Decommissioned',
  'Disposed',
  'Missing',
];

function safeCondition(v: string | null | undefined): AssetCondition {
  if (v && (ALLOWED_CONDITIONS as string[]).includes(v)) return v as AssetCondition;
  return 'Good';
}

function safeCriticality(v: string | null | undefined): Criticality {
  if (v && (ALLOWED_CRITICALITIES as string[]).includes(v)) return v as Criticality;
  return 'Medium';
}

function safeStatus(v: string | null | undefined): Asset['status'] {
  if (v && (ALLOWED_STATUSES as string[]).includes(v)) return v as Asset['status'];
  return 'Active';
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function mapAssetRow(row: AssetRow): Asset {
  return {
    id: row.asset_id,
    asset_code: row.asset_code,
    name: row.name,
    category: row.category,
    sub_category: asString(row.sub_category),
    description: asString(row.description),
    make_model: asString(row.make_model),
    serial_number: asString(row.serial_number),
    status: safeStatus(row.status),
    location_id: asString(row.location_id),
    room_id: asString(row.room_id),
    dept_id: asString(row.dept_id),
    assigned_to: asString(row.assigned_to),
    condition: safeCondition(row.condition),
    criticality: safeCriticality(row.criticality),
    remaining_life_years: typeof row.remaining_life_years === 'number' ? row.remaining_life_years : 0,
    utilisation: (asString(row.utilisation) || 'Moderate') as Asset['utilisation'],
    compatibility_of_use: (asString(row.compatibility_of_use) || 'FullyCompatible') as Asset['compatibility_of_use'],
    environmental_impact: (asString(row.environmental_impact) || 'Low') as Asset['environmental_impact'],
    purchase_date: asString(row.purchase_date),
    purchase_cost: typeof row.purchase_cost === 'number' ? row.purchase_cost : 0,
    replacement_cost: typeof row.replacement_cost === 'number' ? row.replacement_cost : 0,
    warranty_expiry: asString(row.warranty_expiry),
    last_serviced_date: asString(row.last_serviced_date),
    next_service_date: asString(row.next_service_date),
    notes: asString(row.notes),
    created_at: row.created_at,
    updated_at: row.updated_at,
    locationId: asString(row.location_id),
  };
}

function mapAssetListRow(row: AssetListRow): Asset {
  return {
    id: row.asset_id,
    asset_code: row.asset_code,
    name: row.name,
    category: row.category,
    sub_category: '',
    description: '',
    make_model: '',
    serial_number: '',
    status: safeStatus(row.status),
    location_id: asString(row.location_id),
    room_id: asString(row.room_id),
    dept_id: asString(row.dept_id),
    assigned_to: '',
    condition: 'Good',
    criticality: safeCriticality(row.criticality),
    remaining_life_years: 0,
    utilisation: 'Moderate',
    compatibility_of_use: 'FullyCompatible',
    environmental_impact: 'Low',
    purchase_date: '',
    purchase_cost: 0,
    replacement_cost: 0,
    warranty_expiry: '',
    last_serviced_date: '',
    next_service_date: '',
    notes: '',
    created_at: '',
    updated_at: '',
    locationId: asString(row.location_id),
  };
}

// Allow-list of columns that may be written to `asset`. Anything else is dropped silently
// to keep mutations safe even when callers pass extra UI-only fields.
const WRITABLE_FIELDS = [
  'asset_code',
  'name',
  'category',
  'sub_category',
  'description',
  'make_model',
  'serial_number',
  'condition',
  'criticality',
  'status',
  'location_id',
  'room_id',
  'dept_id',
  'assigned_to',
  'remaining_life_years',
  'utilisation',
  'compatibility_of_use',
  'environmental_impact',
  'purchase_date',
  'purchase_cost',
  'replacement_cost',
  'warranty_expiry',
  'last_serviced_date',
  'next_service_date',
  'notes',
] as const;

type WritableAssetField = (typeof WRITABLE_FIELDS)[number];

function buildWritablePayload(input: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of WRITABLE_FIELDS) {
    const value = (input as Record<WritableAssetField, unknown>)[key];
    if (value === undefined) continue;
    if (value === '' && (key === 'location_id' || key === 'room_id' || key === 'dept_id')) {
      // Treat empty UUID strings as null to avoid invalid UUID errors.
      payload[key] = null;
      continue;
    }
    payload[key] = value;
  }
  // Coerce known enum mismatches to safe values.
  if (typeof payload.condition === 'string' && !(ALLOWED_CONDITIONS as string[]).includes(payload.condition as string)) {
    payload.condition = 'Good';
  }
  if (typeof payload.status === 'string' && !(ALLOWED_STATUSES as string[]).includes(payload.status as string)) {
    payload.status = 'Active';
  }
  if (typeof payload.criticality === 'string' && !(ALLOWED_CRITICALITIES as string[]).includes(payload.criticality as string)) {
    payload.criticality = 'Medium';
  }
  return payload;
}

export async function fetchAssets(params?: {
  offset?: number;
  limit?: number;
}): Promise<Asset[]> {
  const offset = Math.max(0, params?.offset ?? 0);
  const limit = Math.max(1, params?.limit ?? 50);
  const to = offset + limit - 1;
  const { data, error } = await supabase
    .from('asset')
    .select(ASSET_COLUMNS)
    .order('name', { ascending: true })
    .range(offset, to);
  if (error) throw error;
  return (data as unknown as AssetRow[]).map(mapAssetRow);
}

export async function fetchAssetsForList(params?: {
  offset?: number;
  limit?: number;
}): Promise<Asset[]> {
  const offset = Math.max(0, params?.offset ?? 0);
  const limit = Math.max(1, params?.limit ?? 50);
  const to = offset + limit - 1;
  const LIST_COLUMNS = [
    'asset_id',
    'asset_code',
    'name',
    'category',
    'criticality',
    'status',
    'location_id',
    'room_id',
    'dept_id',
  ].join(',');
  const { data, error } = await supabase
    .from('asset')
    .select(LIST_COLUMNS)
    .order('name', { ascending: true })
    .range(offset, to);
  if (error) throw error;
  return (data as unknown as AssetListRow[]).map(mapAssetListRow);
}

export async function fetchAssetById(id: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('asset')
    .select(ASSET_COLUMNS)
    .eq('asset_id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapAssetRow(data as unknown as AssetRow);
}

export async function createAsset(payload: Record<string, unknown>): Promise<Asset> {
  const safe = buildWritablePayload(payload);
  const { data, error } = await supabase
    .from('asset')
    .insert([safe])
    .select(ASSET_COLUMNS)
    .single();
  if (error) throw error;
  return mapAssetRow(data as unknown as AssetRow);
}

export async function updateAsset(
  id: string,
  updates: Partial<Omit<Asset, 'id' | 'created_at' | 'updated_at'>>
): Promise<Asset> {
  const safe = buildWritablePayload(updates as Record<string, unknown>);
  const { data, error } = await supabase
    .from('asset')
    .update({
      ...safe,
      updated_at: new Date().toISOString(),
    })
    .eq('asset_id', id)
    .select(ASSET_COLUMNS)
    .single();
  if (error) throw error;
  return mapAssetRow(data as unknown as AssetRow);
}

export async function deleteAsset(id: string): Promise<void> {
  const { error } = await supabase.from('asset').delete().eq('asset_id', id);
  if (error) throw error;
}

export async function searchAssets(params: {
  query?: string;
  category?: string;
  condition?: string;
  criticality?: string;
  status?: string;
  dept_id?: string;
  location_id?: string;
  room_id?: string;
}) {
  let queryBuilder = supabase
    .from('asset')
    .select(ASSET_COLUMNS)
    .order('name', { ascending: true });

  if (params.query && params.query.trim()) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${params.query}%,asset_code.ilike.%${params.query}%,category.ilike.%${params.query}%,description.ilike.%${params.query}%`
    );
  }

  if (params.category) queryBuilder = queryBuilder.eq('category', params.category);
  if (params.condition) queryBuilder = queryBuilder.eq('condition', params.condition);
  if (params.criticality) queryBuilder = queryBuilder.eq('criticality', params.criticality);
  if (params.status) queryBuilder = queryBuilder.eq('status', params.status);
  if (params.dept_id) queryBuilder = queryBuilder.eq('dept_id', params.dept_id);
  if (params.location_id) queryBuilder = queryBuilder.eq('location_id', params.location_id);
  if (params.room_id) queryBuilder = queryBuilder.eq('room_id', params.room_id);

  const { data, error } = await queryBuilder.limit(100);

  if (error) throw error;

  return (data as any[]).map(mapAssetRow);
}
