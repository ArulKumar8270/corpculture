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

export const getTotalRentalInvoicePayment = (entry) => {
    if (!entry) {
        return {
            totalAmount: '0.00',
            commissionRate: 0,
            commissionAmount: '0.00',
            totalWithCommission: '0.00'
        };
    }

    // Helper to calculate amount
    const calculateCountAmount = (machineOld, entryNew, freeC, extraAmt) => {
        machineOld = parseFloat(machineOld) || 0;
        entryNew = parseFloat(entryNew) || 0;
        freeC = parseFloat(freeC) || 0;
        extraAmt = parseFloat(extraAmt) || 0;

        const copiesUsed = entryNew - machineOld;
        if (copiesUsed <= 0) return 0;
        const billableCopies = Math.max(0, copiesUsed - freeC);
        return billableCopies * extraAmt;
    };

    // Helper to calculate total for a single product
    const calculateProductTotal = (machine, entryConfig) => {
        if (!machine) return 0;
        
        let productTotal = parseFloat(machine?.basePrice) || 0;

        // A3
        if (machine.a3Config && entryConfig?.a3Config) {
            productTotal += calculateCountAmount(machine.a3Config.bwOldCount, entryConfig.a3Config.bwNewCount, machine.a3Config.freeCopiesBw, machine.a3Config.extraAmountBw);
            productTotal += calculateCountAmount(machine.a3Config.colorOldCount, entryConfig.a3Config.colorNewCount, machine.a3Config.freeCopiesColor, machine.a3Config.extraAmountColor);
            productTotal += calculateCountAmount(machine.a3Config.colorScanningOldCount, entryConfig.a3Config.colorScanningNewCount, machine.a3Config.freeCopiesColorScanning, machine.a3Config.extraAmountColorScanning);
        }

        // A4
        if (machine.a4Config && entryConfig?.a4Config) {
            productTotal += calculateCountAmount(machine.a4Config.bwOldCount, entryConfig.a4Config.bwNewCount, machine.a4Config.freeCopiesBw, machine.a4Config.extraAmountBw);
            productTotal += calculateCountAmount(machine.a4Config.colorOldCount, entryConfig.a4Config.colorNewCount, machine.a4Config.freeCopiesColor, machine.a4Config.extraAmountColor);
            productTotal += calculateCountAmount(machine.a4Config.colorScanningOldCount, entryConfig.a4Config.colorScanningNewCount, machine.a4Config.freeCopiesColorScanning, machine.a4Config.extraAmountColorScanning);
        }

        // A5
        if (machine.a5Config && entryConfig?.a5Config) {
            productTotal += calculateCountAmount(machine.a5Config.bwOldCount, entryConfig.a5Config.bwNewCount, machine.a5Config.freeCopiesBw, machine.a5Config.extraAmountBw);
            productTotal += calculateCountAmount(machine.a5Config.colorOldCount, entryConfig.a5Config.colorNewCount, machine.a5Config.freeCopiesColor, machine.a5Config.extraAmountColor);
            productTotal += calculateCountAmount(machine.a5Config.colorScanningOldCount, entryConfig.a5Config.colorScanningNewCount, machine.a5Config.freeCopiesColorScanning, machine.a5Config.extraAmountColorScanning);
        }

        return productTotal;
    };

    let totalBillableAmount = 0;
    let totalGSTPercentage = 0;
    let commissionRate = 0;

    // Check if entry has multiple products (new format)
    if (entry.products && Array.isArray(entry.products) && entry.products.length > 0) {
        // Multiple products format
        entry.products.forEach((product) => {
            const machine = product.machineId;
            if (machine) {
                const productTotal = calculateProductTotal(machine, product);
                totalBillableAmount += productTotal;

                // Get GST from first product (assuming all products have same GST)
                if (totalGSTPercentage === 0 && machine.gstType && machine.gstType.length > 0) {
                    totalGSTPercentage = machine.gstType.reduce(
                        (sum, gst) => sum + (parseFloat(gst.gstPercentage) || 0),
                        0
                    );
                }

                // Get commission from first product (assuming all products have same commission)
                if (commissionRate === 0) {
                    commissionRate = parseFloat(machine?.commission || entry?.assignedTo?.commission || 0);
                }
            }
        });
    } else {
        // Single product format (old format)
        const machine = entry.machineId;
        if (machine) {
            totalBillableAmount = calculateProductTotal(machine, entry);

            // GST
            if (machine.gstType && machine.gstType.length > 0) {
                totalGSTPercentage = machine.gstType.reduce(
                    (sum, gst) => sum + (parseFloat(gst.gstPercentage) || 0),
                    0
                );
            }

            // Commission
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

const legacyRecipientFromLabel = (line) => {
    const s = String(line).trim();
    if (!s) return null;
    const m = s.match(EMAIL_IN_LABEL);
    const email = m ? m[1].trim() : '';
    if (!email) {
        return { name: s, email: '' };
    }
    const paren = s.indexOf('(');
    let name =
        paren !== -1
            ? s.slice(0, paren).trim()
            : s
                  .replace(EMAIL_IN_LABEL, '')
                  .replace(/Mobile:\s*[^,)]*,?\s*/i, '')
                  .replace(/,\s*$/, '')
                  .trim();
    if (!name) name = s.replace(EMAIL_IN_LABEL, '').trim();
    return { name, email };
};

/** Form state for rental send-details: { name, email }[] */
export const parseSendDetailsToForForm = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        if (
            value.length > 0 &&
            typeof value[0] === 'object' &&
            value[0] !== null &&
            ('name' in value[0] || 'email' in value[0])
        ) {
            return value
                .map((x) => ({
                    name: String(x.name ?? '').trim(),
                    email: String(x.email ?? '').trim(),
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
