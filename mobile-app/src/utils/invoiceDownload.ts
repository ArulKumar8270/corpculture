import { Linking } from 'react-native';

/** Match web ServiceInvoicesReport / RentalInvoiceReport R2 bases. */
export const SERVICE_INVOICE_R2_BASE =
  'https://pub-ef65b8bdb5974dd191a466c3120cd6b3.r2.dev';
export const RENTAL_INVOICE_R2_BASE =
  'https://pub-bcab85dac0c64221ba6b6a756f991c46.r2.dev';
export const PAYMENT_COPY_R2_BASE =
  'https://pub-982db31d50054adebd29fa1792b12fb8.r2.dev';

function docId(record: any): string {
  const raw = record?._id ?? record?.id;
  if (raw == null || raw === '') return '';
  if (typeof raw === 'object') return String((raw as { _id?: string })._id || '').trim();
  return String(raw).trim();
}

async function openFirstAvailable(urls: string[]): Promise<string | null> {
  const candidates = urls.map((u) => String(u || '').trim()).filter(Boolean);
  if (!candidates.length) return null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        await Linking.openURL(url);
        return url;
      }
    } catch {
      /* try next */
    }
  }
  await Linking.openURL(candidates[0]);
  return candidates[0];
}

export async function openServiceInvoicePdf(invoice: any): Promise<boolean> {
  const id = docId(invoice);
  if (!id) return false;
  const opened = await openFirstAvailable([
    `${SERVICE_INVOICE_R2_BASE}/${id}`,
    `${SERVICE_INVOICE_R2_BASE}/${id}.pdf`,
  ]);
  return !!opened;
}

export async function openRentalInvoicePdf(entry: any): Promise<boolean> {
  const id = docId(entry);
  if (!id) return false;
  const opened = await openFirstAvailable([
    `${RENTAL_INVOICE_R2_BASE}/${id}`,
    `${RENTAL_INVOICE_R2_BASE}/${id}.pdf`,
  ]);
  return !!opened;
}

export async function openPaymentCopyPdf(record: any): Promise<boolean> {
  const id = docId(record);
  if (!id) return false;
  const opened = await openFirstAvailable([
    `${PAYMENT_COPY_R2_BASE}/${id}`,
    `${PAYMENT_COPY_R2_BASE}/${id}.pdf`,
  ]);
  return !!opened;
}
