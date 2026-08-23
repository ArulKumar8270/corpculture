/**
 * GSTR-layout Excel builders matching web ServiceInvoicesReport / RentalInvoiceReport.
 */

function normalizeGstEntries(productOrMachine: any): { type: string; pct: number }[] {
  if (!productOrMachine || typeof productOrMachine !== 'object') return [];
  const raw = productOrMachine.gstType;
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return arr
    .map((g: any) => ({
      type: String(g?.gstType ?? '').trim(),
      pct: Number(g?.gstPercentage) || 0,
    }))
    .filter((g: { type: string; pct: number }) => g.type || g.pct > 0);
}

function resolveGstBracket(totalPct: number): 5 | 12 | 18 | null {
  const p = Number(totalPct) || 0;
  if (p <= 0) return null;
  const candidates: Array<5 | 12 | 18> = [5, 12, 18];
  const exact = candidates.find((c) => Math.abs(p - c) < 0.01);
  if (exact != null) return exact;
  if (p < 8.5) return 5;
  if (p < 15) return 12;
  return 18;
}

type TaxBuckets = {
  cgst18: number;
  sgst18: number;
  net18: number;
  cgst12: number;
  sgst12: number;
  net12: number;
  cgst5: number;
  sgst5: number;
  net5: number;
  igst18: number;
  igst12: number;
  igst5: number;
  netTotal: number;
  totalGst: number;
  hsnStr: string;
};

function emptyBuckets(): Omit<TaxBuckets, 'hsnStr'> & { hsns: Set<string> } {
  return {
    hsns: new Set(),
    cgst18: 0,
    sgst18: 0,
    net18: 0,
    cgst12: 0,
    sgst12: 0,
    net12: 0,
    cgst5: 0,
    sgst5: 0,
    net5: 0,
    igst18: 0,
    igst12: 0,
    igst5: 0,
    netTotal: 0,
    totalGst: 0,
  };
}

function finalizeBuckets(out: ReturnType<typeof emptyBuckets>): TaxBuckets {
  const computedGst =
    out.cgst18 +
    out.sgst18 +
    out.cgst12 +
    out.sgst12 +
    out.cgst5 +
    out.sgst5 +
    out.igst18 +
    out.igst12 +
    out.igst5;
  if (computedGst < out.totalGst - 0.02) {
    out.igst18 += Math.max(0, out.totalGst - computedGst);
  }
  return {
    cgst18: out.cgst18,
    sgst18: out.sgst18,
    net18: out.net18,
    cgst12: out.cgst12,
    sgst12: out.sgst12,
    net12: out.net12,
    cgst5: out.cgst5,
    sgst5: out.sgst5,
    net5: out.net5,
    igst18: out.igst18,
    igst12: out.igst12,
    igst5: out.igst5,
    netTotal: out.netTotal,
    totalGst: out.totalGst,
    hsnStr: [...out.hsns].filter(Boolean).join(', ') || '',
  };
}

function applyLineTax(
  out: ReturnType<typeof emptyBuckets>,
  source: any,
  lineTotal: number
) {
  const line = Number(lineTotal) || 0;
  if (line <= 0) return;
  if (!source || typeof source !== 'object') {
    out.netTotal += line;
    return;
  }
  const hsn = String(source.hsn ?? '').trim();
  if (hsn) out.hsns.add(hsn);

  const gsts = normalizeGstEntries(source);
  const sumPct = gsts.reduce((s, g) => s + (Number(g.pct) || 0), 0);
  if (sumPct <= 0) {
    out.netTotal += line;
    return;
  }

  const taxable = line / (1 + sumPct / 100);
  const lineGst = line - taxable;
  out.netTotal += taxable;
  out.totalGst += lineGst;

  const bracket = resolveGstBracket(sumPct);
  const hasIgst = gsts.some((g) => /IGST/i.test(g.type));

  if (hasIgst) {
    for (const g of gsts) {
      if (!/IGST/i.test(g.type)) continue;
      const amt = taxable * ((Number(g.pct) || 0) / 100);
      const b = resolveGstBracket(Number(g.pct) || bracket || sumPct);
      if (b === 5) out.igst5 += amt;
      else if (b === 12) out.igst12 += amt;
      else out.igst18 += amt;
    }
    if (bracket === 5) out.net5 += taxable;
    else if (bracket === 12) out.net12 += taxable;
    else out.net18 += taxable;
  } else {
    for (const g of gsts) {
      const amt = taxable * ((Number(g.pct) || 0) / 100);
      const t = String(g.type).toUpperCase();
      if (/CGST/.test(t)) {
        if (bracket === 5) out.cgst5 += amt;
        else if (bracket === 12) out.cgst12 += amt;
        else out.cgst18 += amt;
      } else if (/SGST|UTGST/.test(t)) {
        if (bracket === 5) out.sgst5 += amt;
        else if (bracket === 12) out.sgst12 += amt;
        else out.sgst18 += amt;
      }
    }
    if (bracket === 5) out.net5 += taxable;
    else if (bracket === 12) out.net12 += taxable;
    else out.net18 += taxable;
  }
}

export function aggregateServiceInvoiceTaxForExport(invoice: any): TaxBuckets {
  const out = emptyBuckets();
  const products = Array.isArray(invoice?.products) ? invoice.products : [];
  for (const line of products) {
    applyLineTax(out, line?.productId, Number(line?.totalAmount) || 0);
  }
  return finalizeBuckets(out);
}

export function aggregateRentalEntryTaxForExport(entry: any): TaxBuckets {
  const out = emptyBuckets();
  const products = Array.isArray(entry?.products) ? entry.products : [];
  if (products.length > 0) {
    for (const p of products) {
      applyLineTax(out, p.machineId, p.productTotal);
    }
  } else if (entry?.machineId && typeof entry.machineId === 'object') {
    applyLineTax(out, entry.machineId, entry.grandTotal);
  } else {
    out.netTotal += Number(entry?.grandTotal) || 0;
  }
  return finalizeBuckets(out);
}

function derivePaidAmount(invoice: any): number {
  const stored = invoice?.paymentAmount;
  const n = stored !== undefined && stored !== null && stored !== '' ? Number(stored) : NaN;
  if (invoice?.status === 'Paid' && (Number.isNaN(n) || n === 0)) {
    return Number(invoice?.grandTotal) || 0;
  }
  if (!Number.isNaN(n)) return n;
  return 0;
}

function rentalServiceModeLabel(inv: any): string {
  const r = inv?.rentalId;
  if (r && typeof r === 'object') {
    return [r.rentalType, r.rentalTitle].filter(Boolean).join(' — ');
  }
  return '';
}

function buildGstrWorksheet(XLSX: any, rows: any[][]): any {
  const COLS = 27;
  const headerTop = new Array(COLS).fill('');
  const headerSub = new Array(COLS).fill('');
  headerTop[0] = 'S No';
  headerTop[1] = 'Invoice Date';
  headerTop[2] = 'Invoice Number';
  headerTop[3] = 'Retailer name';
  headerTop[4] = 'GST Number';
  headerTop[5] = 'Service Mode';
  headerTop[6] = 'HSN';
  headerTop[7] = 'GST @ 18%';
  headerTop[9] = '18% Net Amount';
  headerTop[10] = 'GST @ 12%';
  headerTop[12] = '12% Net Amount';
  headerTop[13] = 'GST @ 5%';
  headerTop[15] = '5% Net Amount';
  headerTop[16] = 'IGST @ 18%';
  headerTop[17] = 'IGST @ 12%';
  headerTop[18] = 'IGST @ 5%';
  headerTop[19] = 'Net Amount';
  headerTop[20] = 'Total GST Value';
  headerTop[21] = 'Total amount';
  headerTop[22] = 'Invoice Value';
  headerTop[23] = 'TDS Amount';
  headerTop[24] = 'Paid Amount';
  headerTop[25] = 'Balance Amount';
  headerTop[26] = 'Credit Amount';
  headerSub[7] = 'CGST';
  headerSub[8] = 'SGST';
  headerSub[10] = 'CGST';
  headerSub[11] = 'SGST';
  headerSub[13] = 'CGST';
  headerSub[14] = 'SGST';

  const merges: any[] = [];
  for (let c = 0; c <= 6; c += 1) merges.push({ s: { r: 0, c }, e: { r: 1, c } });
  merges.push({ s: { r: 0, c: 7 }, e: { r: 0, c: 8 } });
  merges.push({ s: { r: 0, c: 9 }, e: { r: 1, c: 9 } });
  merges.push({ s: { r: 0, c: 10 }, e: { r: 0, c: 11 } });
  merges.push({ s: { r: 0, c: 12 }, e: { r: 1, c: 12 } });
  merges.push({ s: { r: 0, c: 13 }, e: { r: 0, c: 14 } });
  merges.push({ s: { r: 0, c: 15 }, e: { r: 1, c: 15 } });
  for (let c = 16; c <= 26; c += 1) merges.push({ s: { r: 0, c }, e: { r: 1, c } });

  const ws = XLSX.utils.aoa_to_sheet([headerTop, headerSub, ...rows]);
  ws['!merges'] = merges;
  ws['!cols'] = Array.from({ length: COLS }, (_, i) => ({
    wch: i === 3 ? 28 : i === 6 ? 14 : i <= 2 ? 14 : 12,
  }));
  return ws;
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export function buildServiceInvoiceGstrWorksheet(XLSX: any, invoices: any[]): any {
  const dataRows = invoices.map((inv, idx) => {
    const t = aggregateServiceInvoiceTaxForExport(inv);
    const grand = Number(inv.grandTotal) || 0;
    const paid = derivePaidAmount(inv);
    const tds = Number(inv.tdsAmount) || 0;
    return [
      idx + 1,
      inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '',
      inv.invoiceNumber ?? '',
      inv.companyId?.companyName ?? '',
      inv.companyId?.gstNo ?? '',
      inv.serviceId?.serviceTitle ?? '',
      t.hsnStr,
      round2(t.cgst18),
      round2(t.sgst18),
      round2(t.net18),
      round2(t.cgst12),
      round2(t.sgst12),
      round2(t.net12),
      round2(t.cgst5),
      round2(t.sgst5),
      round2(t.net5),
      round2(t.igst18),
      round2(t.igst12),
      round2(t.igst5),
      round2(t.netTotal),
      round2(t.totalGst),
      round2(t.netTotal + t.totalGst),
      round2(grand),
      round2(tds),
      round2(paid),
      round2(Math.max(0, grand - paid - tds)),
      0,
    ];
  });
  return buildGstrWorksheet(XLSX, dataRows);
}

export function buildRentalInvoiceGstrWorksheet(XLSX: any, entries: any[]): any {
  const dataRows = entries.map((inv, idx) => {
    const t = aggregateRentalEntryTaxForExport(inv);
    const grand = Number(inv.grandTotal) || 0;
    const paid = derivePaidAmount(inv);
    const tds = Number(inv.tdsAmount) || 0;
    const dateVal = inv.invoiceDate || inv.entryDate || inv.createdAt;
    return [
      idx + 1,
      dateVal ? new Date(dateVal).toLocaleDateString('en-IN') : '',
      inv.invoiceNumber ?? '',
      inv.companyId?.companyName ?? '',
      inv.companyId?.gstNo ?? '',
      rentalServiceModeLabel(inv),
      t.hsnStr,
      round2(t.cgst18),
      round2(t.sgst18),
      round2(t.net18),
      round2(t.cgst12),
      round2(t.sgst12),
      round2(t.net12),
      round2(t.cgst5),
      round2(t.sgst5),
      round2(t.net5),
      round2(t.igst18),
      round2(t.igst12),
      round2(t.igst5),
      round2(t.netTotal),
      round2(t.totalGst),
      round2(t.netTotal + t.totalGst),
      round2(grand),
      round2(tds),
      round2(paid),
      round2(Math.max(0, grand - paid - tds)),
      0,
    ];
  });
  return buildGstrWorksheet(XLSX, dataRows);
}

export function excelBufferToBase64(excelBuffer: ArrayBuffer | Uint8Array | number[]): string {
  const bytes =
    excelBuffer instanceof ArrayBuffer
      ? new Uint8Array(excelBuffer)
      : excelBuffer instanceof Uint8Array
        ? excelBuffer
        : new Uint8Array(excelBuffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
