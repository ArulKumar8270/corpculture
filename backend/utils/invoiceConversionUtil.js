import CommonDetails from "../models/commonDetailsModel.js";

export const normalizeInvoiceType = (value) =>
    String(value ?? "").trim().toLowerCase();

export const isQuotationType = (value) => normalizeInvoiceType(value) === "quotation";

export const isInvoiceType = (value) => normalizeInvoiceType(value) === "invoice";

/** Preserves format template; only replaces the trailing sequential number segment. */
export const generateInvoiceNumber = (invoiceCount, format) => {
    if (!format || format.trim() === "") {
        return invoiceCount.toString();
    }

    const lastNumberMatch = format.match(/(\d+)(?!.*\d)/);

    if (lastNumberMatch) {
        const numberDigits = lastNumberMatch[1].length;
        const prefix = format.substring(0, format.lastIndexOf(lastNumberMatch[1]));
        const formattedNumber = invoiceCount.toString().padStart(numberDigits, "0");
        return prefix + formattedNumber;
    }

    return format + invoiceCount.toString().padStart(5, "0");
};

/**
 * Atomically reserve the next global invoice number (increments count once).
 * Use when converting quotation -> invoice to avoid duplicate/skipped numbers.
 */
export const reserveNextInvoiceNumber = async () => {
    const commonDetails = await CommonDetails.findOneAndUpdate(
        {},
        { $inc: { invoiceCount: 1 } },
        { new: true, upsert: true }
    ).lean();

    if (!commonDetails) {
        throw new Error("Global invoice settings not found. Please configure invoice settings first.");
    }

    const count =
        typeof commonDetails.invoiceCount === "number"
            ? commonDetails.invoiceCount
            : parseInt(commonDetails.invoiceCount, 10) || 0;

    if (count <= 0) {
        throw new Error("Invalid global invoice count.");
    }

    const format = commonDetails.globalInvoiceFormat || "";
    return generateInvoiceNumber(count, format);
};
