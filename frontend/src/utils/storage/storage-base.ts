export type StorageItemValue = string | number | boolean | null | object;

export abstract class StorageBase {
  protected retrieve<Fallback extends StorageItemValue>(raw: string | null, fallback: Fallback): Fallback | null {
    if (raw === null || raw === undefined) return fallback;
    try { return JSON.parse(raw) as Fallback; } catch { return fallback; }
  }
  protected warn(method: string, key: string, error: unknown) {
    console.warn(`[Storage] ${method} failed for key "${key}":`, error);
  }
}

export type AssertNoExtras<T extends string> = T extends never ? true : false;