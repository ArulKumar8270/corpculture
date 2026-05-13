/** Normalize Mongo ObjectId / populated ref / $oid shape from API or navigation params to a string id. */
export function normalizeMongoId(raw: unknown): string {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'string' || typeof raw === 'number') {
    const s = String(raw).trim();
    if (!s || s === 'null' || s === 'undefined') return '';
    return s;
  }
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (o._id != null) return normalizeMongoId(o._id);
    if (o.$oid != null) return String(o.$oid);
  }
  return '';
}
