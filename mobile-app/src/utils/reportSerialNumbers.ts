/** Collect all serial numbers from a report (top-level + material line items). */
export function collectReportSerialNumbers(report: unknown): string {
  if (!report || typeof report !== 'object') return 'N/A';
  const r = report as Record<string, unknown>;
  const serials = new Set<string>();

  if (typeof r.serialNo === 'string' && r.serialNo.trim()) {
    serials.add(r.serialNo.trim());
  }

  const groups = Array.isArray(r.materialGroups) ? r.materialGroups : [];
  groups.forEach((group) => {
    const products = group && typeof group === 'object' && Array.isArray((group as { products?: unknown }).products)
      ? (group as { products: unknown[] }).products
      : [];
    products.forEach((product) => {
      if (product && typeof product === 'object') {
        const serial = (product as { serialNo?: string }).serialNo;
        if (typeof serial === 'string' && serial.trim()) serials.add(serial.trim());
      }
    });
  });

  return serials.size > 0 ? Array.from(serials).join(', ') : 'N/A';
}
