/** Normalize sendTo from API (email strings or contact objects) to email strings for form selects. */
export const parseSendToEmails = (sendTo) => {
    const raw = Array.isArray(sendTo) ? sendTo : sendTo != null && sendTo !== '' ? [sendTo] : [];
    const emails = [];
    const seen = new Set();
    for (const item of raw) {
        const email =
            typeof item === 'object' && item !== null && !Array.isArray(item)
                ? String(item.email || '').trim()
                : String(item ?? '').trim();
        if (!email || seen.has(email.toLowerCase())) continue;
        seen.add(email.toLowerCase());
        emails.push(email);
    }
    return emails;
};

/** Use with GET /company/all — API defaults to limit=10, which breaks company pickers. */
export const companyAllPickerQuery = 'page=1&limit=10000';

export const compareInvoiceNumbers = (a, b) => {
    const numA = a != null ? String(a) : '';
    const numB = b != null ? String(b) : '';
    if (!numA && !numB) return 0;
    if (!numA) return 1;
    if (!numB) return -1;
    return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
};

/** Signed uploads are usually images; generated rental invoices are PDF or R2-hosted files. */
export const isLikelyImageInvoiceLink = (url) => {
    const path = String(url || '').split(/[?#]/)[0].toLowerCase();
    return /\.(jpe?g|png|gif|webp|bmp|heic|heif)(\/)?$/i.test(path);
};

/** Cloudflare R2 public base for manual signed-copy uploads (auth upload-file). */
export const SIGNED_COPY_UPLOAD_BASE_URL =
    'https://pub-48d3e9677d09450a9113bb7bddbe02c8.r2.dev';

/** Normalize signedInvoiceLink from API (array or legacy single string). */
export const normalizeSignedInvoiceLinks = (record) => {
    const raw = record?.signedInvoiceLink;
    if (Array.isArray(raw)) {
        return raw.map((x) => String(x || '').trim()).filter(Boolean);
    }
    if (raw != null && raw !== '') {
        return [String(raw).trim()].filter(Boolean);
    }
    return [];
};

/**
 * Signed-copy download URLs: signedInvoiceLink (web) plus legacy/mobile uploads in invoiceLink.
 * Rental mobile app stores signed scans in invoiceLink, not signedInvoiceLink.
 */
export const collectSignedCopyDownloadCandidates = (record) => {
    const id = record?._id ? String(record._id) : '';
    const ordered = [];
    const push = (url) => {
        const trimmed = String(url || '').trim();
        if (!trimmed || ordered.includes(trimmed)) return;
        ordered.push(trimmed);
    };

    for (const link of normalizeSignedInvoiceLinks(record)) {
        push(link);
    }

    const invoiceLinks = Array.isArray(record?.invoiceLink)
        ? record.invoiceLink.map((x) => String(x || '').trim()).filter(Boolean)
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

/** Cloudflare R2 public base for generated service/rental reports: `/{reportId}`. */
export const REPORT_DOWNLOAD_BASE_URL =
    'https://pub-109709bff58d46faa2a7782c9bf60324.r2.dev';

/** Official service/rental report PDF download URLs (R2 by report id, then stored links). */
export const collectReportDownloadCandidates = (report, downloadBaseUrl = REPORT_DOWNLOAD_BASE_URL) => {
    const id = report?._id;
    const ordered = [];
    const push = (url) => {
        const trimmed = String(url || '').trim();
        if (!trimmed || ordered.includes(trimmed)) return;
        ordered.push(trimmed);
    };

    if (id) {
        push(`${downloadBaseUrl}/${id}`);
        push(`${downloadBaseUrl}/${id}.pdf`);
    }

    const links = Array.isArray(report?.reportLink)
        ? report.reportLink.map((x) => String(x || '').trim()).filter(Boolean)
        : [];

    const docLinks = links.filter((link) => !isLikelyImageInvoiceLink(link));
    for (const link of docLinks) {
        if (/\.pdf(\?|#|$)/i.test(link)) push(link);
    }
    for (const link of docLinks) {
        push(link);
    }

    return ordered;
};

/** Official rental invoice/quotation download URLs only (never signed-copy uploads). */
export const collectRentalOfficialInvoiceDownloadCandidates = (entry, downloadBaseUrl) => {
    const id = entry?._id;
    const r2 = id ? `${downloadBaseUrl}/${id}` : '';
    const links = Array.isArray(entry?.invoiceLink)
        ? entry.invoiceLink.map((x) => String(x || '').trim()).filter(Boolean)
        : [];

    const ordered = [];
    const push = (url) => {
        const trimmed = String(url || '').trim();
        if (!trimmed || ordered.includes(trimmed)) return;
        ordered.push(trimmed);
    };

    push(r2);

    const docLinks = links.filter((link) => !isLikelyImageInvoiceLink(link));
    for (const link of docLinks) {
        if (/\.pdf(\?|#|$)/i.test(link)) push(link);
    }
    for (const link of docLinks) {
        push(link);
    }

    return ordered;
};

export const getDiscount = (price, discountPrice) => {
    return (((price - discountPrice) / price) * 100).toFixed();
};

export const getDeliveryDate = () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(new Date().getDate() + 7);
    return deliveryDate.toUTCString().substring(0, 11);
};

export const formatDate = (dt) => {
    return new Date(dt).toUTCString().substring(0, 16);
};

export const getRandomProducts = (prodsArray, n) => {
    return prodsArray.sort(() => 0.5 - Math.random()).slice(0, n);
};

const hasInvoiceReadingPair = (entryOld, entryNew) => {
    if (entryNew === undefined || entryNew === null || entryNew === '') return false;
    if (entryOld === undefined || entryOld === null || entryOld === '') return false;
    return true;
};

const calculateRentalCountAmount = (machineOld, entryOld, entryNew, freeC, extraAmt) => {
    const openReading = hasInvoiceReadingPair(entryOld, entryNew)
        ? (parseFloat(entryOld) || 0)
        : (parseFloat(machineOld) || 0);
    const newReading = parseFloat(entryNew) || 0;
    const free = parseFloat(freeC) || 0;
    const rate = parseFloat(extraAmt) || 0;

    const copiesUsed = newReading - openReading;
    if (copiesUsed <= 0) return 0;
    const billableCopies = Math.max(0, copiesUsed - free);
    return billableCopies * rate;
};

/** Pre-tax total for one line item (base + meter charges); matches backend after snapshot fix. */
export const sumRentalProductPreTax = (machine, entryConfig) => {
    if (!machine) return 0;

    let productTotal = parseFloat(machine?.basePrice) || 0;

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

/** Partner commission for one rental invoice line (pre-tax + GST, then commission %). */
export const getRentalLineCommission = (machine, entryConfig) => {
    if (!machine) {
        return { commissionAmount: 0, commissionRate: 0 };
    }

    const preTax = sumRentalProductPreTax(machine, entryConfig);
    let totalGSTPercentage = 0;
    if (machine.gstType && machine.gstType.length > 0) {
        totalGSTPercentage = machine.gstType.reduce(
            (sum, gst) => sum + (parseFloat(gst.gstPercentage) || 0),
            0
        );
    }

    const totalWithGST = preTax * (1 + totalGSTPercentage / 100);
    const commissionRate = parseFloat(machine?.commission || 0);
    const commissionAmount = (totalWithGST * commissionRate) / 100;

    return { commissionAmount, commissionRate };
};

/** One product line: pre-tax + GST + commission (same formula as backend calculateProductTotal aggregate). */
export const getRentalProductLineDisplayTotal = (machine, entryConfig) => {
    if (!machine) return 0;
    const preTax = sumRentalProductPreTax(machine, entryConfig);
    let totalGSTPercentage = 0;
    if (machine.gstType && machine.gstType.length > 0) {
        totalGSTPercentage = machine.gstType.reduce(
            (sum, gst) => sum + (parseFloat(gst.gstPercentage) || 0),
            0
        );
    }
    const totalWithGST = preTax * (1 + totalGSTPercentage / 100);
    const commissionRate = parseFloat(machine?.commission || 0);
    return totalWithGST + (totalWithGST * commissionRate) / 100;
};

export const getTotalRentalInvoicePayment = (entry) => {
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
        entry.products.forEach((product) => {
            const machine = product.machineId;
            if (machine) {
                totalBillableAmount += sumRentalProductPreTax(machine, product);

                if (totalGSTPercentage === 0 && machine.gstType && machine.gstType.length > 0) {
                    totalGSTPercentage = machine.gstType.reduce(
                        (sum, gst) => sum + (parseFloat(gst.gstPercentage) || 0),
                        0
                    );
                }

                if (commissionRate === 0) {
                    commissionRate = parseFloat(machine?.commission || entry?.assignedTo?.commission || 0);
                }
            }
        });
    } else {
        const machine = entry.machineId;
        if (machine) {
            totalBillableAmount = sumRentalProductPreTax(machine, entry);

            if (machine.gstType && machine.gstType.length > 0) {
                totalGSTPercentage = machine.gstType.reduce(
                    (sum, gst) => sum + (parseFloat(gst.gstPercentage) || 0),
                    0
                );
            }

            commissionRate = parseFloat(machine?.commission || entry?.assignedTo?.commission || 0);
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

/** Display names only for rental invoice "Send details to" (legacy strings or {name,email}[]). */
export const formatSendDetailsToDisplay = (value) => {
    if (value == null || value === '') return 'N/A';
    if (Array.isArray(value)) {
        if (value.length === 0) return 'N/A';
        if (typeof value[0] === 'object' && value[0] !== null && 'name' in value[0]) {
            return value.map((x) => x.name).filter(Boolean).join(', ');
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

const EMAIL_IN_LABEL = /Email:\s*([^\s,)]+)/i;
const MOBILE_IN_LABEL = /Mobile:\s*([^\s,)]+)/i;

const legacyRecipientFromLabel = (line) => {
    const s = String(line).trim();
    if (!s) return null;
    const mEmail = s.match(EMAIL_IN_LABEL);
    const email = mEmail ? mEmail[1].trim() : '';
    const mMob = s.match(MOBILE_IN_LABEL);
    const mobile = mMob ? mMob[1].trim() : '';
    if (!email) {
        return { name: s, email: '', mobile };
    }
    const paren = s.indexOf('(');
    let name =
        paren !== -1
            ? s.slice(0, paren).trim()
            : s
                  .replace(EMAIL_IN_LABEL, '')
                  .replace(MOBILE_IN_LABEL, '')
                  .replace(/,\s*$/, '')
                  .trim();
    if (!name) name = s.replace(EMAIL_IN_LABEL, '').replace(MOBILE_IN_LABEL, '').trim();
    return { name, email, mobile };
};

const scalarFormField = (v) =>
    typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '';

/** Form state for rental send-details: { name, email, mobile }[] */
export const parseSendDetailsToForForm = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        if (
            value.length > 0 &&
            typeof value[0] === 'object' &&
            value[0] !== null &&
            ('name' in value[0] || 'email' in value[0] || 'mobile' in value[0])
        ) {
            return value
                .map((x) => ({
                    name: scalarFormField(x.name),
                    email: scalarFormField(x.email),
                    mobile: scalarFormField(x.mobile),
                }))
                .filter((x) => x.name && x.name !== '[object Object]');
        }
        return value
            .map((s) => legacyRecipientFromLabel(String(s)))
            .filter((x) => x && x.name && x.name !== '[object Object]');
    }
    const raw = String(value).trim();
    if (!raw) return [];
    const lines = raw.includes('\n')
        ? raw.split('\n').map((t) => t.trim()).filter(Boolean)
        : [raw];
    return lines
        .map((line) => legacyRecipientFromLabel(line))
        .filter((x) => x && x.name && x.name !== '[object Object]');
};

/** Unit product price from cart/catalog item (price range or discount). */
export const getCartItemBaseUnit = (item) => {
    const quantity = Number(item?.quantity) || 0;
    const priceRange = item?.priceRange?.find(
        (range) =>
            quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
    );
    return priceRange
        ? parseFloat(priceRange.price)
        : Number(item?.discountPrice) || 0;
};

/** Line total for a cart item: (base × qty) + delivery + installation. */
export const getCartItemLineTotal = (item) => {
    const qty = Number(item?.quantity) || 0;
    const base = getCartItemBaseUnit(item);
    const delivery = Number(item?.deliveryCharge) || 0;
    const install = item?.isInstalation ? Number(item?.installationCost) || 0 : 0;
    return base * qty + delivery + install;
};

/** Order total from cart items. */
export const computeOrderAmountFromItems = (orderItems) => {
    if (!Array.isArray(orderItems)) return 0;
    return Number(
        orderItems.reduce((sum, item) => sum + getCartItemLineTotal(item), 0)
    );
};

/**
 * Base unit on persisted order lines (excludes flat delivery/installation).
 * Legacy orders stored price as base + delivery + installation.
 */
export const getStoredOrderProductBaseUnit = (product) => {
    const price = Number(product?.price) || 0;
    const discount = Number(product?.discountPrice) || 0;
    const delivery = Number(product?.deliveryCharge) || 0;
    const install = product?.isInstalation ? Number(product?.installationCost) || 0 : 0;
    const flatFees = delivery + install;

    if (flatFees <= 0) {
        return price || discount;
    }

    if (discount > 0 && Math.abs(price - discount - flatFees) < 0.01) {
        return discount;
    }

    return price || discount;
};

/** Line total from a persisted order product line. */
export const getStoredOrderProductLineTotal = (product) => {
    const qty = Number(product?.quantity) || 1;
    const base = getStoredOrderProductBaseUnit(product);
    const delivery = Number(product?.deliveryCharge) || 0;
    const install = product?.isInstalation ? Number(product?.installationCost) || 0 : 0;
    return base * qty + delivery + install;
};

/** Sum of line totals for persisted order products. */
export const computeOrderAmountFromStoredProducts = (products) => {
    if (!Array.isArray(products)) return 0;
    return Number(
        products.reduce((sum, p) => sum + getStoredOrderProductLineTotal(p), 0)
    );
};

const RENTAL_PAYMENT_TZ = 'Asia/Kolkata';

/** Rental payment date in IST — matches /payment/today API calendar day. */
export const formatRentalPaymentDateIst = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: RENTAL_PAYMENT_TZ,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date));
};

/** Current calendar year in IST (for DD/MM search without year). */
export const getIstCurrentYear = () =>
    new Intl.DateTimeFormat('en-CA', {
        timeZone: RENTAL_PAYMENT_TZ,
        year: 'numeric',
    }).format(new Date());

/** Match payment-date search; DD/MM alone uses current IST year (same as payment/today). */
export const rentalPaymentDateMatchesSearch = (paymentDate, searchTerm) => {
    const formatted = formatRentalPaymentDateIst(paymentDate).toLowerCase();
    const term = String(searchTerm || '').trim().toLowerCase();
    if (!term) return true;
    const partial = term.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (partial) {
        const dd = partial[1].padStart(2, '0');
        const mm = partial[2].padStart(2, '0');
        return formatted === `${dd}/${mm}/${getIstCurrentYear()}`;
    }
    return formatted.includes(term);
};
