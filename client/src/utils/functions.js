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
    console.log(entry, "entry3452345234")
    let totalBillableAmount = 0;
    const machine = entry.machineId;
    const basePrice = parseFloat(machine?.basePrice) || 0;
    totalBillableAmount += basePrice;

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

    // A3
    if (machine.a3Config && entry.a3Config) {
        totalBillableAmount += calculateCountAmount(machine.a3Config.bwOldCount, entry.a3Config.bwNewCount, machine.a3Config.freeCopiesBw, machine.a3Config.extraAmountBw);
        totalBillableAmount += calculateCountAmount(machine.a3Config.colorOldCount, entry.a3Config.colorNewCount, machine.a3Config.freeCopiesColor, machine.a3Config.extraAmountColor);
        totalBillableAmount += calculateCountAmount(machine.a3Config.colorScanningOldCount, entry.a3Config.colorScanningNewCount, machine.a3Config.freeCopiesColorScanning, machine.a3Config.extraAmountColorScanning);
    }

    // A4
    if (machine.a4Config && entry.a4Config) {
        totalBillableAmount += calculateCountAmount(machine.a4Config.bwOldCount, entry.a4Config.bwNewCount, machine.a4Config.freeCopiesBw, machine.a4Config.extraAmountBw);
        totalBillableAmount += calculateCountAmount(machine.a4Config.colorOldCount, entry.a4Config.colorNewCount, machine.a4Config.freeCopiesColor, machine.a4Config.extraAmountColor);
        totalBillableAmount += calculateCountAmount(machine.a4Config.colorScanningOldCount, entry.a4Config.colorScanningNewCount, machine.a4Config.freeCopiesColorScanning, machine.a4Config.extraAmountColorScanning);
    }

    // A5
    if (machine.a5Config && entry.a5Config) {
        totalBillableAmount += calculateCountAmount(machine.a5Config.bwOldCount, entry.a5Config.bwNewCount, machine.a5Config.freeCopiesBw, machine.a5Config.extraAmountBw);
        totalBillableAmount += calculateCountAmount(machine.a5Config.colorOldCount, entry.a5Config.colorNewCount, machine.a5Config.freeCopiesColor, machine.a5Config.extraAmountColor);
        totalBillableAmount += calculateCountAmount(machine.a5Config.colorScanningOldCount, entry.a5Config.colorScanningNewCount, machine.a5Config.freeCopiesColorScanning, machine.a5Config.extraAmountColorScanning);
    }

    // GST
    let totalGSTPercentage = 0;
    if (machine.gstType && machine.gstType.length > 0) {
        totalGSTPercentage = machine.gstType.reduce(
            (sum, gst) => sum + (parseFloat(gst.gstPercentage) || 0),
            0
        );
    }

    const totalAmountIncludingGST = totalBillableAmount * (1 + totalGSTPercentage / 100);

    // ✅ Apply commission (from machine or assigned employee)
    const commissionRate = parseFloat(machine?.commission || entry?.assignedTo?.commission || 0);
    const commissionAmount = (totalAmountIncludingGST * commissionRate) / 100;

    return {
        totalAmount: totalAmountIncludingGST.toFixed(2),
        commissionRate,
        commissionAmount: commissionAmount.toFixed(2),
        totalWithCommission: (totalAmountIncludingGST + commissionAmount).toFixed(2)
    };
};
