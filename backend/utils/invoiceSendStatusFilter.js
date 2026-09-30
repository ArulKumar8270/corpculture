export const unwrapEqFilter = (value) =>
    value && typeof value === "object" && !Array.isArray(value) && value.$eq !== undefined
        ? value.$eq
        : value;

export const isSentInvoiceSendStatus = (value) =>
    String(unwrapEqFilter(value) || "").trim().toLowerCase() === "sent";

/** `{ $ne: "Paid" }` also matches Cancelled. Reminder and company-report lists should not. */
export const withoutPaidOrCancelled = (status) => {
    if (!status || typeof status !== "object" || Array.isArray(status)) return status;
    const keys = Object.keys(status);
    if (keys.length === 1 && keys[0] === "$ne" && String(status.$ne).trim().toLowerCase() === "paid") {
        return { $nin: ["Paid", "Cancelled"] };
    }
    return status;
};

/** Web treats signed copies / invoice links / sent-at as in record, even if invoiceSendStatus stayed NotSent. */
export const sentOrRecordedInvoiceFilter = () => ({
    $or: [
        { invoiceSendStatus: "Sent" },
        { invoiceSentAt: { $ne: null } },
        { "invoiceLink.0": { $exists: true } },
        { "signedInvoiceLink.0": { $exists: true } },
    ],
});

/**
 * Same query POST /service-invoice/all builds for the reminder payload:
 * invoiceType invoice, status not Paid, invoiceSendStatus Sent
 * (sent, or a sent time / invoice link / signed copy).
 */
export const notPaidRecordedInvoiceFilter = (companyId) => ({
    companyId,
    invoiceType: { $regex: /^invoice$/i },
    status: { $nin: ["Paid", "Cancelled"] },
    $and: [sentOrRecordedInvoiceFilter()],
});
