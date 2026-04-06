/** Normalize payment notification emails from an invoice document (web + API). */
export function invoicePaymentEmailsFromRecord(inv: any): string[] {
  if (Array.isArray(inv?.paymentContactEmails) && inv.paymentContactEmails.length) {
    const cleaned = inv.paymentContactEmails
      .map((e: unknown) => String(e ?? '').trim())
      .filter((s: string) => s.length > 0);
    return [...new Set(cleaned)];
  }
  const one = String(inv?.paymentContactEmail ?? '').trim();
  return one ? [one] : [];
}

export function normalizePaymentContactPayload(emails: string[] | undefined) {
  const list = [...new Set((emails || []).map((e) => String(e ?? '').trim()).filter(Boolean))];
  return {
    paymentContactEmails: list,
    paymentContactEmail: list[0] || '',
  };
}
