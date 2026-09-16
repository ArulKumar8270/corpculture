/**
 * Status flags for rental invoice list chips.
 * Payment / overall report (Paid) requires: Invoice Sent + Signed Copy Uploaded.
 * Sending the invoice also uploads it (webhook), so upload is not a separate gate.
 */

export function hasRentalInvoicePaymentDetails(entry) {
  return (
    (Number(entry?.paymentAmount) || 0) > 0 ||
    !!entry?.paymentAmountType ||
    (Number(entry?.pendingAmount) || 0) > 0 ||
    (Number(entry?.tdsAmount) || 0) > 0 ||
    !!entry?.bankName ||
    !!entry?.transactionDetails ||
    !!entry?.chequeDate ||
    !!entry?.transferDate ||
    !!entry?.companyNamePayment ||
    !!entry?.otherPaymentMode
  );
}

export function getRentalInvoiceStatusFlags(entry) {
  const isSent =
    entry?.invoiceSendStatus === "Sent" ||
    !!entry?.invoiceSentAt ||
    entry?.status === "InvoiceSent";
  // Send flow uploads the invoice via webhook; treat sent as uploaded too
  const hasLink =
    Array.isArray(entry?.invoiceLink) && entry.invoiceLink.length > 0;
  const hasUploaded = hasLink || isSent;
  const hasSignedCopy =
    Array.isArray(entry?.signedInvoiceLink) &&
    entry.signedInvoiceLink.length > 0;
  const hasPaymentDetails = hasRentalInvoicePaymentDetails(entry);
  const isPaid = entry?.status === "Paid";

  return {
    hasUploaded,
    isSent,
    hasSignedCopy,
    hasPaymentDetails,
    isPaid,
  };
}

/**
 * Enable Update Payment / move to overall report (Paid) when:
 * Invoice Sent + Signed Copy Uploaded.
 */
export function getRentalInvoiceOverallReportStatus(entry) {
  const { isSent, hasSignedCopy, hasUploaded } = getRentalInvoiceStatusFlags(entry);

  const missing = [];
  if (!isSent) missing.push("Invoice Not Sent");
  if (!hasSignedCopy) missing.push("Signed Copy Not Uploaded");

  return {
    hasUploaded,
    isSent,
    hasSignedCopy,
    ok: missing.length === 0,
    missing,
    message:
      missing.length === 0
        ? ""
        : `Complete all statuses before updating payment: ${missing.join(", ")}.`,
  };
}

export function canMoveRentalInvoiceToOverallReport(entry) {
  return getRentalInvoiceOverallReportStatus(entry).ok;
}
