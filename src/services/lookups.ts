import { supabase } from '@/utils/supabase';

const locationNameCache = new Map<string, string>();
const roomNameCache = new Map<string, string>();
const departmentNameCache = new Map<string, string>();
const userNameCache = new Map<string, string>();

async function loadMap(
  table: 'location' | 'room' | 'department' | 'user_profile',
  idColumn: string,
  nameColumn: string,
  ids: string[],
  cache: Map<string, string>
) {
  const pending = ids.filter((id) => id && !cache.has(id));
  if (pending.length === 0) return;
  const { data, error } = await supabase
    .from(table)
    .select(`${idColumn}, ${nameColumn}`)
    .in(idColumn, pending);
  if (error || !data) return;
  for (const row of data as unknown as Array<Record<string, unknown>>) {
    const id = typeof row[idColumn] === 'string' ? (row[idColumn] as string) : '';
    const name = typeof row[nameColumn] === 'string' ? (row[nameColumn] as string) : '';
    if (id && name) cache.set(id, name);
  }
}

export async function resolveLocationNames(ids: string[]) {
  await loadMap('location', 'location_id', 'name', ids, locationNameCache);
  return Object.fromEntries(ids.map((id) => [id, locationNameCache.get(id) ?? '']));
}

export async function resolveRoomNames(ids: string[]) {
  await loadMap('room', 'room_id', 'room_name', ids, roomNameCache);
  return Object.fromEntries(ids.map((id) => [id, roomNameCache.get(id) ?? '']));
}

export async function resolveDepartmentNames(ids: string[]) {
  await loadMap('department', 'dept_id', 'name', ids, departmentNameCache);
  return Object.fromEntries(ids.map((id) => [id, departmentNameCache.get(id) ?? '']));
}

export async function resolveUserNames(ids: string[]) {
  await loadMap('user_profile', 'user_id', 'name', ids, userNameCache);
  return Object.fromEntries(ids.map((id) => [id, userNameCache.get(id) ?? '']));
}
