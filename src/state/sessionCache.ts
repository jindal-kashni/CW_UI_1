type Entry<T> = {
  value: T;
  ts: number;
};

const mem = new Map<string, Entry<unknown>>();

export function getSessionCache<T>(key: string, maxAgeMs = 5 * 60 * 1000): T | null {
  const entry = mem.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > maxAgeMs) {
    mem.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setSessionCache<T>(key: string, value: T) {
  mem.set(key, { value, ts: Date.now() });
}

export function clearSessionCache() {
  mem.clear();
}
