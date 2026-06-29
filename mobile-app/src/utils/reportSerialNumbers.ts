/** Collect all serial numbers from a report (top-level + material line items). */
export function collectReportSerialNumbers(report: unknown): string {
  if (!report || typeof report !== 'object') return 'N/A';
  const r = report as Record<string, unknown>;
  const serials = new Set<string>();

  const add = (value: unknown) => {
    const v = String(value ?? '').trim();
    if (!v || v === '—' || v === 'N/A' || v === '-') return;
    if (/^x+$/i.test(v)) return;
    serials.add(v);
  };

  const groups = Array.isArray(r.materialGroups) ? r.materialGroups : [];
  groups.forEach((group) => {
    if (group && typeof group === 'object') {
      add((group as { serialNo?: string }).serialNo);
    }
    const products =
      group && typeof group === 'object' && Array.isArray((group as { products?: unknown }).products)
        ? (group as { products: unknown[] }).products
        : [];
    products.forEach((product) => {
      if (product && typeof product === 'object') {
        add((product as { serialNo?: string }).serialNo);
      }
    });
  });

  const materials = Array.isArray(r.materials) ? r.materials : [];
  materials.forEach((material) => {
    if (material && typeof material === 'object') {
      add((material as { serialNo?: string }).serialNo);
    }
  });

  add(r.serialNo);

  return serials.size > 0 ? Array.from(serials).join(', ') : 'N/A';
}
