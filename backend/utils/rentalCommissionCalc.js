const hasInvoiceReadingPair = (entryOld, entryNew) => {
    if (entryNew === undefined || entryNew === null || entryNew === "") return false;
    if (entryOld === undefined || entryOld === null || entryOld === "") return false;
    return true;
};

const calculateCountAmount = (machineOld, entryOld, entryNew, freeC, extraAmt) => {
    const openReading = hasInvoiceReadingPair(entryOld, entryNew)
        ? parseFloat(entryOld) || 0
        : parseFloat(machineOld) || 0;
    entryNew = parseFloat(entryNew) || 0;
    freeC = parseFloat(freeC) || 0;
    extraAmt = parseFloat(extraAmt) || 0;

    const copiesUsed = entryNew - openReading;
    if (copiesUsed <= 0) return 0;
    const billableCopies = Math.max(0, copiesUsed - freeC);
    return billableCopies * extraAmt;
};

export const calculateRentalPreTaxAmount = (machine, a3Config, a4Config, a5Config) => {
    let totalBillableAmount = parseFloat(machine?.basePrice) || 0;

    if (machine?.a3Config && a3Config) {
        totalBillableAmount += calculateCountAmount(
            machine.a3Config.bwOldCount,
            a3Config.bwOldCount,
            a3Config.bwNewCount,
            machine.a3Config.freeCopiesBw,
            machine.a3Config.extraAmountBw
        );
        totalBillableAmount += calculateCountAmount(
            machine.a3Config.colorOldCount,
            a3Config.colorOldCount,
            a3Config.colorNewCount,
            machine.a3Config.freeCopiesColor,
            machine.a3Config.extraAmountColor
        );
        totalBillableAmount += calculateCountAmount(
            machine.a3Config.colorScanningOldCount,
            a3Config.colorScanningOldCount,
            a3Config.colorScanningNewCount,
            machine.a3Config.freeCopiesColorScanning,
            machine.a3Config.extraAmountColorScanning
        );
    }

    if (machine?.a4Config && a4Config) {
        totalBillableAmount += calculateCountAmount(
            machine.a4Config.bwOldCount,
            a4Config.bwOldCount,
            a4Config.bwNewCount,
            machine.a4Config.freeCopiesBw,
            machine.a4Config.extraAmountBw
        );
        totalBillableAmount += calculateCountAmount(
            machine.a4Config.colorOldCount,
            a4Config.colorOldCount,
            a4Config.colorNewCount,
            machine.a4Config.freeCopiesColor,
            machine.a4Config.extraAmountColor
        );
        totalBillableAmount += calculateCountAmount(
            machine.a4Config.colorScanningOldCount,
            a4Config.colorScanningOldCount,
            a4Config.colorScanningNewCount,
            machine.a4Config.freeCopiesColorScanning,
            machine.a4Config.extraAmountColorScanning
        );
    }

    if (machine?.a5Config && a5Config) {
        totalBillableAmount += calculateCountAmount(
            machine.a5Config.bwOldCount,
            a5Config.bwOldCount,
            a5Config.bwNewCount,
            machine.a5Config.freeCopiesBw,
            machine.a5Config.extraAmountBw
        );
        totalBillableAmount += calculateCountAmount(
            machine.a5Config.colorOldCount,
            a5Config.colorOldCount,
            a5Config.colorNewCount,
            machine.a5Config.freeCopiesColor,
            machine.a5Config.extraAmountColor
        );
        totalBillableAmount += calculateCountAmount(
            machine.a5Config.colorScanningOldCount,
            a5Config.colorScanningOldCount,
            a5Config.colorScanningNewCount,
            machine.a5Config.freeCopiesColorScanning,
            machine.a5Config.extraAmountColorScanning
        );
    }

    return totalBillableAmount;
};

export const calculateRentalLineCommission = (machine, a3Config, a4Config, a5Config) => {
    const totalBillableAmount = calculateRentalPreTaxAmount(machine, a3Config, a4Config, a5Config);

    let totalGSTPercentage = 0;
    if (machine?.gstType?.length) {
        totalGSTPercentage = machine.gstType.reduce(
            (sum, gst) => sum + (parseFloat(gst.gstPercentage) || 0),
            0
        );
    }

    const totalWithGST = totalBillableAmount * (1 + totalGSTPercentage / 100);
    const commissionRate = parseFloat(machine?.commission || 0);
    const commissionAmount = (totalWithGST * commissionRate) / 100;

    return { commissionAmount, commissionRate, totalWithGST };
};
