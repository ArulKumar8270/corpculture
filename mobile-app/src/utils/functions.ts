export const getTotalRentalInvoicePayment = (entry: any) => {
    if (!entry) {
        return {
            totalAmount: '0.00',
            commissionRate: 0,
            commissionAmount: '0.00',
            totalWithCommission: '0.00'
        };
    }

    // Helper to calculate amount
    const calculateCountAmount = (machineOld: number, entryNew: number, freeC: number, extraAmt: number) => {
        machineOld = parseFloat(String(machineOld)) || 0;
        entryNew = parseFloat(String(entryNew)) || 0;
        freeC = parseFloat(String(freeC)) || 0;
        extraAmt = parseFloat(String(extraAmt)) || 0;

        const copiesUsed = entryNew - machineOld;
        if (copiesUsed <= 0) return 0;
        const billableCopies = Math.max(0, copiesUsed - freeC);
        return billableCopies * extraAmt;
    };

    // Helper to calculate total for a single product
    const calculateProductTotal = (machine: any, entryConfig: any) => {
        if (!machine) return 0;
        
        let productTotal = parseFloat(String(machine?.basePrice)) || 0;

        // A3
        if (machine.a3Config && entryConfig?.a3Config) {
            productTotal += calculateCountAmount(
                machine.a3Config.bwOldCount, 
                entryConfig.a3Config.bwNewCount, 
                machine.a3Config.freeCopiesBw, 
                machine.a3Config.extraAmountBw
            );
            productTotal += calculateCountAmount(
                machine.a3Config.colorOldCount, 
                entryConfig.a3Config.colorNewCount, 
                machine.a3Config.freeCopiesColor, 
                machine.a3Config.extraAmountColor
            );
            productTotal += calculateCountAmount(
                machine.a3Config.colorScanningOldCount, 
                entryConfig.a3Config.colorScanningNewCount, 
                machine.a3Config.freeCopiesColorScanning, 
                machine.a3Config.extraAmountColorScanning
            );
        }

        // A4
        if (machine.a4Config && entryConfig?.a4Config) {
            productTotal += calculateCountAmount(
                machine.a4Config.bwOldCount, 
                entryConfig.a4Config.bwNewCount, 
                machine.a4Config.freeCopiesBw, 
                machine.a4Config.extraAmountBw
            );
            productTotal += calculateCountAmount(
                machine.a4Config.colorOldCount, 
                entryConfig.a4Config.colorNewCount, 
                machine.a4Config.freeCopiesColor, 
                machine.a4Config.extraAmountColor
            );
            productTotal += calculateCountAmount(
                machine.a4Config.colorScanningOldCount, 
                entryConfig.a4Config.colorScanningNewCount, 
                machine.a4Config.freeCopiesColorScanning, 
                machine.a4Config.extraAmountColorScanning
            );
        }

        // A5
        if (machine.a5Config && entryConfig?.a5Config) {
            productTotal += calculateCountAmount(
                machine.a5Config.bwOldCount, 
                entryConfig.a5Config.bwNewCount, 
                machine.a5Config.freeCopiesBw, 
                machine.a5Config.extraAmountBw
            );
            productTotal += calculateCountAmount(
                machine.a5Config.colorOldCount, 
                entryConfig.a5Config.colorNewCount, 
                machine.a5Config.freeCopiesColor, 
                machine.a5Config.extraAmountColor
            );
            productTotal += calculateCountAmount(
                machine.a5Config.colorScanningOldCount, 
                entryConfig.a5Config.colorScanningNewCount, 
                machine.a5Config.freeCopiesColorScanning, 
                machine.a5Config.extraAmountColorScanning
            );
        }

        return productTotal;
    };

    let totalBillableAmount = 0;
    let totalGSTPercentage = 0;
    let commissionRate = 0;

    // Check if entry has multiple products (new format)
    if (entry.products && Array.isArray(entry.products) && entry.products.length > 0) {
        // Multiple products format
        entry.products.forEach((product: any) => {
            const machine = product.machineId;
            if (machine) {
                const productTotal = calculateProductTotal(machine, product);
                totalBillableAmount += productTotal;

                // Get GST from first product (assuming all products have same GST)
                if (totalGSTPercentage === 0 && machine.gstType && machine.gstType.length > 0) {
                    totalGSTPercentage = machine.gstType.reduce(
                        (sum: number, gst: any) => sum + (parseFloat(String(gst.gstPercentage)) || 0),
                        0
                    );
                }

                // Get commission from first product (assuming all products have same commission)
                if (commissionRate === 0) {
                    commissionRate = parseFloat(String(machine?.commission || entry?.assignedTo?.commission || 0));
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
                    (sum: number, gst: any) => sum + (parseFloat(String(gst.gstPercentage)) || 0),
                    0
                );
            }

            // Commission
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
