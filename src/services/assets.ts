import { supabase } from '@/utils/supabase';
import type { Asset, Criticality } from '@/src/types/models';

const ASSET_COLUMNS = [
  'asset_id',
  'asset_code',
  'name',
  'category',
  'sub_category',
  'description',
  'location_id',
  'room_id',
  'dept_id',
  'foh_boh',
  'make_model',
  'serial_number',
  'criticality',
  'status',
  'inspection_frequency',
  'purchase_date',
  'purchase_cost',
  'replacement_cost',
  'warranty_expiry',
  'assigned_to',
  'utilisation',
  'compatibility_of_use',
  'environmental_impact',
  'notes',
  'asset_photo_urls',
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
  location_id: string | null;
  room_id: string | null;
  dept_id: string | null;
  foh_boh: string | null;
  make_model: string | null;
  serial_number: string | null;
  criticality: string | null;
  status: string;
  inspection_frequency: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  replacement_cost: number | null;
  warranty_expiry: string | null;
  assigned_to: string | null;
  utilisation: string | null;
  compatibility_of_use: string | null;
  environmental_impact: string | null;
  notes: string | null;
  asset_photo_urls: string[] | null;
  created_at: string;
  updated_at: string;
};

const ALLOWED_CRITICALITIES: Criticality[] = ['Low', 'Medium', 'High', 'Critical'];

const ALLOWED_STATUSES: Asset['status'][] = [
  'Active',
  'Under repair',
  'Decommissioned',
  'Disposed',
  'Missing',
];

const ALLOWED_FOH_BOH = ['FOH', 'BOH', 'Mixed'];

const ALLOWED_INSPECTION_FREQUENCIES = [
  'Monthly',
  'Quarterly',
  '6-monthly',
  'Annually',
  'Every 2 years',
  'Every 3 years',
  'Every 5 years',
  'As required',
];

function safeCriticality(v: string | null | undefined): Criticality | null {
  if (v && (ALLOWED_CRITICALITIES as string[]).includes(v)) return v as Criticality;
  return null;
}

function safeStatus(v: string | null | undefined): Asset['status'] {
  if (v && (ALLOWED_STATUSES as string[]).includes(v)) return v as Asset['status'];
  return 'Active';
}

function safeFohBoh(v: string | null | undefined): Asset['foh_boh'] {
  if (v && ALLOWED_FOH_BOH.includes(v)) return v as Asset['foh_boh'];
  return null;
}

function safeInspectionFrequency(v: string | null | undefined): Asset['inspection_frequency'] {
  if (v && ALLOWED_INSPECTION_FREQUENCIES.includes(v)) return v as Asset['inspection_frequency'];
  return null;
}

function mapAssetRow(row: AssetRow): Asset {
  return {
    id: row.asset_id,
    asset_id: row.asset_id,

    asset_code: row.asset_code,
    name: row.name,
    category: row.category,
    sub_category: row.sub_category,
    description: row.description,

    location_id: row.location_id,
    room_id: row.room_id,
    dept_id: row.dept_id,
    foh_boh: safeFohBoh(row.foh_boh),

    make_model: row.make_model,
    serial_number: row.serial_number,

    criticality: safeCriticality(row.criticality),
    status: safeStatus(row.status),
    inspection_frequency: safeInspectionFrequency(row.inspection_frequency),

    purchase_date: row.purchase_date,
    purchase_cost: row.purchase_cost,
    replacement_cost: row.replacement_cost,
    warranty_expiry: row.warranty_expiry,

    assigned_to: row.assigned_to,
    utilisation: row.utilisation,
    compatibility_of_use: row.compatibility_of_use,
    environmental_impact: row.environmental_impact,
    notes: row.notes,
    asset_photo_urls: row.asset_photo_urls,

    created_at: row.created_at,
    updated_at: row.updated_at,

    locationId: row.location_id ?? undefined,
  };
}

const WRITABLE_FIELDS = [
  'asset_code',
  'name',
  'category',
  'sub_category',
  'description',
  'location_id',
  'room_id',
  'dept_id',
  'foh_boh',
  'make_model',
  'serial_number',
  'criticality',
  'status',
  'inspection_frequency',
  'purchase_date',
  'purchase_cost',
  'replacement_cost',
  'warranty_expiry',
  'assigned_to',
  'utilisation',
  'compatibility_of_use',
  'environmental_impact',
  'notes',
  'asset_photo_urls',
] as const;

type WritableAssetField = (typeof WRITABLE_FIELDS)[number];

function nullIfEmptyUuid(key: string, value: unknown) {
  if (
    value === '' &&
    ['location_id', 'room_id', 'dept_id'].includes(key)
  ) {
    return null;
  }

  return value;
}

function buildWritablePayload(input: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const key of WRITABLE_FIELDS) {
    const value = (input as Record<WritableAssetField, unknown>)[key];
    if (value === undefined) continue;
    payload[key] = nullIfEmptyUuid(key, value);
  }

  if (
    typeof payload.status === 'string' &&
    !(ALLOWED_STATUSES as string[]).includes(payload.status)
  ) {
    payload.status = 'Active';
  }

  if (
    typeof payload.criticality === 'string' &&
    !(ALLOWED_CRITICALITIES as string[]).includes(payload.criticality)
  ) {
    payload.criticality = null;
  }

  if (
    typeof payload.foh_boh === 'string' &&
    !ALLOWED_FOH_BOH.includes(payload.foh_boh)
  ) {
    payload.foh_boh = null;
  }

  if (
    typeof payload.inspection_frequency === 'string' &&
    !ALLOWED_INSPECTION_FREQUENCIES.includes(payload.inspection_frequency)
  ) {
    payload.inspection_frequency = null;
  }

  return payload;
}

function cleanSearchTerm(value: string) {
  return value.trim().replace(/[%_,]/g, '');
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
  return fetchAssets(params);
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
  const { error } = await supabase
    .from('asset')
    .delete()
    .eq('asset_id', id);

  if (error) throw error;
}

export async function searchAssets(params: {
  query?: string;
  category?: string;
  sub_category?: string;
  criticality?: string;
  status?: string;
  foh_boh?: string;
  inspection_frequency?: string;
  dept_id?: string;
  location_id?: string;
  room_id?: string;
}): Promise<Asset[]> {
  let queryBuilder = supabase
    .from('asset')
    .select(ASSET_COLUMNS)
    .order('name', { ascending: true });

  const term = params.query ? cleanSearchTerm(params.query) : '';

  if (term) {
    queryBuilder = queryBuilder.or(
      [
        `name.ilike.%${term}%`,
        `asset_code.ilike.%${term}%`,
        `category.ilike.%${term}%`,
        `sub_category.ilike.%${term}%`,
        `description.ilike.%${term}%`,
        `make_model.ilike.%${term}%`,
        `serial_number.ilike.%${term}%`,
      ].join(',')
    );
  }

  if (params.category) queryBuilder = queryBuilder.eq('category', params.category);
  if (params.sub_category) queryBuilder = queryBuilder.eq('sub_category', params.sub_category);
  if (params.criticality) queryBuilder = queryBuilder.eq('criticality', params.criticality);
  if (params.status) queryBuilder = queryBuilder.eq('status', params.status);
  if (params.foh_boh) queryBuilder = queryBuilder.eq('foh_boh', params.foh_boh);
  if (params.inspection_frequency) {
    queryBuilder = queryBuilder.eq('inspection_frequency', params.inspection_frequency);
  }
  if (params.dept_id) queryBuilder = queryBuilder.eq('dept_id', params.dept_id);
  if (params.location_id) queryBuilder = queryBuilder.eq('location_id', params.location_id);
  if (params.room_id) queryBuilder = queryBuilder.eq('room_id', params.room_id);

  const { data, error } = await queryBuilder.limit(600);

  if (error) throw error;

  return (data as unknown as AssetRow[]).map(mapAssetRow);
}