import { Linking } from 'react-native';

const hasInvoiceReadingPair = (entryOld: unknown, entryNew: unknown) => {
    if (entryNew === undefined || entryNew === null || entryNew === '') return false;
    if (entryOld === undefined || entryOld === null || entryOld === '') return false;
    return true;
};

/** Normalize sendTo from API (email strings or contact objects) to email strings. */
export const parseSendToEmails = (sendTo: unknown): string[] => {
    const raw = Array.isArray(sendTo) ? sendTo : sendTo != null && sendTo !== '' ? [sendTo] : [];
    const emails: string[] = [];
    const seen = new Set<string>();
    for (const item of raw) {
        const email =
            typeof item === 'object' && item !== null && !Array.isArray(item)
                ? String((item as { email?: string }).email || '').trim()
                : String(item ?? '').trim();
        if (!email || seen.has(email.toLowerCase())) continue;
        seen.add(email.toLowerCase());
        emails.push(email);
    }
    return emails;
};

const calculateRentalCountAmount = (
    machineOld: unknown,
    entryOld: unknown,
    entryNew: unknown,
    freeC: unknown,
    extraAmt: unknown
) => {
    const openReading = hasInvoiceReadingPair(entryOld, entryNew)
        ? parseFloat(String(entryOld)) || 0
        : parseFloat(String(machineOld)) || 0;
    const newReading = parseFloat(String(entryNew)) || 0;
    const free = parseFloat(String(freeC)) || 0;
    const rate = parseFloat(String(extraAmt)) || 0;

    const copiesUsed = newReading - openReading;
    if (copiesUsed <= 0) return 0;
    const billableCopies = Math.max(0, copiesUsed - free);
    return billableCopies * rate;
};

export const sumRentalProductPreTax = (machine: any, entryConfig: any) => {
    if (!machine) return 0;

    let productTotal = parseFloat(String(machine?.basePrice)) || 0;

    if (machine.a3Config && entryConfig?.a3Config) {
        productTotal += calculateRentalCountAmount(
            machine.a3Config.bwOldCount,
            entryConfig.a3Config.bwOldCount,
            entryConfig.a3Config.bwNewCount,
            machine.a3Config.freeCopiesBw,
            machine.a3Config.extraAmountBw
        );
        productTotal += calculateRentalCountAmount(
            machine.a3Config.colorOldCount,
            entryConfig.a3Config.colorOldCount,
            entryConfig.a3Config.colorNewCount,
            machine.a3Config.freeCopiesColor,
            machine.a3Config.extraAmountColor
        );
        productTotal += calculateRentalCountAmount(
            machine.a3Config.colorScanningOldCount,
            entryConfig.a3Config.colorScanningOldCount,
            entryConfig.a3Config.colorScanningNewCount,
            machine.a3Config.freeCopiesColorScanning,
            machine.a3Config.extraAmountColorScanning
        );
    }

    if (machine.a4Config && entryConfig?.a4Config) {
        productTotal += calculateRentalCountAmount(
            machine.a4Config.bwOldCount,
            entryConfig.a4Config.bwOldCount,
            entryConfig.a4Config.bwNewCount,
            machine.a4Config.freeCopiesBw,
            machine.a4Config.extraAmountBw
        );
        productTotal += calculateRentalCountAmount(
            machine.a4Config.colorOldCount,
            entryConfig.a4Config.colorOldCount,
            entryConfig.a4Config.colorNewCount,
            machine.a4Config.freeCopiesColor,
            machine.a4Config.extraAmountColor
        );
        productTotal += calculateRentalCountAmount(
            machine.a4Config.colorScanningOldCount,
            entryConfig.a4Config.colorScanningOldCount,
            entryConfig.a4Config.colorScanningNewCount,
            machine.a4Config.freeCopiesColorScanning,
            machine.a4Config.extraAmountColorScanning
        );
    }

    if (machine.a5Config && entryConfig?.a5Config) {
        productTotal += calculateRentalCountAmount(
            machine.a5Config.bwOldCount,
            entryConfig.a5Config.bwOldCount,
            entryConfig.a5Config.bwNewCount,
            machine.a5Config.freeCopiesBw,
            machine.a5Config.extraAmountBw
        );
        productTotal += calculateRentalCountAmount(
            machine.a5Config.colorOldCount,
            entryConfig.a5Config.colorOldCount,
            entryConfig.a5Config.colorNewCount,
            machine.a5Config.freeCopiesColor,
            machine.a5Config.extraAmountColor
        );
        productTotal += calculateRentalCountAmount(
            machine.a5Config.colorScanningOldCount,
            entryConfig.a5Config.colorScanningOldCount,
            entryConfig.a5Config.colorScanningNewCount,
            machine.a5Config.freeCopiesColorScanning,
            machine.a5Config.extraAmountColorScanning
        );
    }

    return productTotal;
};

export const getRentalProductLineDisplayTotal = (machine: any, entryConfig: any) => {
    if (!machine) return 0;
    const preTax = sumRentalProductPreTax(machine, entryConfig);
    let totalGSTPercentage = 0;
    if (machine.gstType && machine.gstType.length > 0) {
        totalGSTPercentage = machine.gstType.reduce(
            (sum: number, gst: any) => sum + (parseFloat(String(gst.gstPercentage)) || 0),
            0
        );
    }
    const totalWithGST = preTax * (1 + totalGSTPercentage / 100);
    const commissionRate = parseFloat(String(machine?.commission || 0));
    return totalWithGST + (totalWithGST * commissionRate) / 100;
};

export const getTotalRentalInvoicePayment = (entry: any) => {
    if (!entry) {
        return {
            totalAmount: '0.00',
            commissionRate: 0,
            commissionAmount: '0.00',
            totalWithCommission: '0.00'
        };
    }

    let totalBillableAmount = 0;
    let totalGSTPercentage = 0;
    let commissionRate = 0;

    if (entry.products && Array.isArray(entry.products) && entry.products.length > 0) {
        entry.products.forEach((product: any) => {
            const machine = product.machineId;
            if (machine) {
                totalBillableAmount += sumRentalProductPreTax(machine, product);

                if (totalGSTPercentage === 0 && machine.gstType && machine.gstType.length > 0) {
                    totalGSTPercentage = machine.gstType.reduce(
                        (sum: number, gst: any) => sum + (parseFloat(String(gst.gstPercentage)) || 0),
                        0
                    );
                }

                if (commissionRate === 0) {
                    commissionRate = parseFloat(String(machine?.commission || entry?.assignedTo?.commission || 0));
                }
            }
        });
    } else {
        const machine = entry.machineId;
        if (machine) {
            totalBillableAmount = sumRentalProductPreTax(machine, entry);

            if (machine.gstType && machine.gstType.length > 0) {
                totalGSTPercentage = machine.gstType.reduce(
                    (sum: number, gst: any) => sum + (parseFloat(String(gst.gstPercentage)) || 0),
                    0
                );
            }

            commissionRate = parseFloat(String(machine?.commission || entry?.assignedTo?.commission || 0));
        }
    }

    const totalAmountIncludingGST = totalBillableAmount * (1 + totalGSTPercentage / 100);
    const commissionAmount = (totalAmountIncludingGST * commissionRate) / 100;

    return {
        totalAmount: totalAmountIncludingGST.toFixed(2),
        commissionRate,
        commissionAmount: commissionAmount.toFixed(2),
        totalWithCommission: (totalAmountIncludingGST + commissionAmount).toFixed(2)
    };
};

/** Rental invoice send-details: names only (compact); supports legacy string[] or { name, email, mobile }[]. */
export const formatSendDetailsToDisplay = (value: unknown): string => {
    if (value == null || value === '') return 'N/A';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'N/A';
        const first = value[0] as any;
        if (typeof first === 'object' && first !== null && 'name' in first) {
            return value
                .map((x: any) => String(x?.name || '').trim())
                .filter(Boolean)
                .join(', ');
        }
        return value
            .map((s) => {
                const t = String(s).trim();
                if (!t) return '';
                const p = t.indexOf('(');
                return p !== -1 ? t.slice(0, p).trim() : t;
            })
            .filter(Boolean)
            .join(', ');
    }
    const t = String(value).trim();
    if (!t) return 'N/A';
    const p = t.indexOf('(');
    return p !== -1 ? t.slice(0, p).trim() : t;
};

type SendDetailsRecipientLike = { name?: string; email?: string; mobile?: string };

/** Multiline block for expanded list rows: name, then email / mobile indented. */
export const formatSendDetailsToDetail = (value: unknown): string => {
    if (value == null || value === '') return 'N/A';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'N/A';
        const first = value[0] as any;
        if (typeof first === 'object' && first !== null && 'name' in first) {
            return (value as SendDetailsRecipientLike[])
                .map((x) => {
                    const n = String(x?.name || '').trim();
                    if (!n) return '';
                    const e = String(x?.email || '').trim();
                    const m = String(x?.mobile || '').trim();
                    const lines = [n];
                    if (e) lines.push(`  ${e}`);
                    if (m) lines.push(`  ${m}`);
                    return lines.join('\n');
                })
                .filter(Boolean)
                .join('\n\n');
        }
        return formatSendDetailsToDisplay(value);
    }
    return formatSendDetailsToDisplay(value);
};

/** Form picker / button summary: "Name (mobile), Name2" when mobile exists. */
export const formatSendDetailsRecipientsButtonSummary = (
    value: SendDetailsRecipientLike[] | null | undefined
): string => {
    const labels = (value || [])
        .map((r) => {
            const n = String(r?.name || '').trim();
            const m = String(r?.mobile || '').trim();
            if (!n) return '';
            return m ? `${n} (${m})` : n;
        })
        .filter(Boolean);
    if (!labels.length) return '--select Option--';
    return labels.join(', ');
};

export const isLikelyImageInvoiceLink = (url: string): boolean => {
    const path = String(url || '').split(/[?#]/)[0].toLowerCase();
    return /\.(jpe?g|png|gif|webp|bmp|heic|heif)(\/)?$/i.test(path);
};

export const SIGNED_COPY_UPLOAD_BASE_URL =
    'https://pub-48d3e9677d09450a9113bb7bddbe02c8.r2.dev';

export const normalizeSignedInvoiceLinks = (record: any): string[] => {
    const raw = record?.signedInvoiceLink;
    if (Array.isArray(raw)) {
        return raw.map((x) => String(x || '').trim()).filter(Boolean);
    }
    if (raw != null && raw !== '') {
        return [String(raw).trim()].filter(Boolean);
    }
    return [];
};

/** Signed-copy download URLs: signedInvoiceLink (web) plus legacy/mobile uploads in invoiceLink. */
export const collectSignedCopyDownloadCandidates = (record: any): string[] => {
    const id = record?._id ? String(record._id) : '';
    const ordered: string[] = [];
    const push = (url: string) => {
        const trimmed = String(url || '').trim();
        if (!trimmed || ordered.includes(trimmed)) return;
        ordered.push(trimmed);
    };

    for (const link of normalizeSignedInvoiceLinks(record)) {
        push(link);
    }

    const invoiceLinks = Array.isArray(record?.invoiceLink)
        ? record.invoiceLink.map((x: unknown) => String(x || '').trim()).filter(Boolean)
        : [];

    for (const link of invoiceLinks) {
        const onUploadBucket = link.includes(SIGNED_COPY_UPLOAD_BASE_URL);
        const mobileSignedName = id && link.includes(`invoice_${id}_`);
        if (onUploadBucket || isLikelyImageInvoiceLink(link) || mobileSignedName) {
            push(link);
        }
    }

    return ordered;
};

export const openSignedCopyDownload = async (
    record: any,
    onError?: (message: string) => void
): Promise<boolean> => {
    const candidates = collectSignedCopyDownloadCandidates(record);
    if (candidates.length === 0) {
        onError?.('Signed copy not uploaded');
        return false;
    }

    let urlToOpen: string | null = null;
    for (const url of candidates) {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            if (res.ok) {
                urlToOpen = url;
                break;
            }
        } catch {
            // try next
        }
    }
    if (!urlToOpen) {
        urlToOpen = candidates[candidates.length - 1];
    }

    await Linking.openURL(urlToOpen);
    return true;
};
