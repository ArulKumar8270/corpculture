const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

function isObjectId(value: unknown): boolean {
  return typeof value === 'string' && OBJECT_ID_RE.test(value);
}

/** Resolve a display name from a Material ref or legacy nested productName shapes. */
export function resolveMaterialName(materialOrName: unknown): string {
  if (materialOrName == null) return '';
  if (typeof materialOrName === 'string') {
    return isObjectId(materialOrName) ? '' : materialOrName.trim();
  }
  if (typeof materialOrName !== 'object') return '';

  const obj = materialOrName as Record<string, unknown>;

  if (typeof obj.name === 'string') {
    const name = obj.name.trim();
    if (name && !isObjectId(name)) return name;
  }

  if (obj.productName != null) {
    const nested = resolveMaterialName(obj.productName);
    if (nested) return nested;
  }

  return '';
}

/** Human-readable name from a service product document (company catalog row). */
export function getServiceProductDisplayName(product: unknown): string {
  if (!product || typeof product !== 'object') return 'N/A';
  const p = product as Record<string, unknown>;
  const fromMaterial = resolveMaterialName(p.productName);
  if (fromMaterial) return fromMaterial;
  if (typeof p.name === 'string' && p.name.trim() && !isObjectId(p.name)) return p.name.trim();
  return 'N/A';
}

/** Human-readable name from an invoice / quotation line item. */
export function getInvoiceLineProductDisplayName(line: unknown): string {
  if (!line || typeof line !== 'object') return 'N/A';
  const row = line as Record<string, unknown>;

  if (typeof row.productName === 'string') {
    const direct = row.productName.trim();
    if (direct && !isObjectId(direct)) return direct;
  }

  if (row.productName && typeof row.productName === 'object') {
    const fromLine = resolveMaterialName(row.productName);
    if (fromLine) return fromLine;
  }

  const productId = row.productId;
  if (productId && typeof productId === 'object') {
    const fromProduct = getServiceProductDisplayName(productId);
    if (fromProduct !== 'N/A') return fromProduct;
    const pid = productId as Record<string, unknown>;
    const fromMaterial = resolveMaterialName(pid.productName);
    if (fromMaterial) return fromMaterial;
  }

  return 'N/A';
}

/** Searchable text for a service product (name + sku + hsn). */
export function getServiceProductSearchText(product: unknown): string {
  if (!product || typeof product !== 'object') return '';
  const p = product as Record<string, unknown>;
  return [
    getServiceProductDisplayName(product),
    String(p.sku ?? ''),
    String(p.hsn ?? ''),
  ]
    .join(' ')
    .toLowerCase();
}
