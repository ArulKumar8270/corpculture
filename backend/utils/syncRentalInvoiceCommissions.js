import commissionModel from "../models/commissionModel.js";
import rentalProductModel from "../models/rentalProductModel.js";
import { calculateRentalLineCommission } from "./rentalCommissionCalc.js";

const resolveMachineDoc = async (machineRef) => {
    if (machineRef && typeof machineRef === "object" && machineRef.basePrice != null) {
        return machineRef;
    }
    const machineId = machineRef?._id || machineRef;
    if (!machineId) return null;
    return rentalProductModel.findById(machineId).populate("gstType").lean();
};

const collectRentalLines = (entry) => {
    if (entry?.products?.length) {
        return entry.products.map((line) => ({
            machineRef: line.machineId,
            a3Config: line.a3Config,
            a4Config: line.a4Config,
            a5Config: line.a5Config,
        }));
    }

    if (entry?.machineId) {
        return [
            {
                machineRef: entry.machineId,
                a3Config: entry.a3Config,
                a4Config: entry.a4Config,
                a5Config: entry.a5Config,
            },
        ];
    }

    return [];
};

/**
 * Create or update one commission record per rental invoice line using
 * product commission % on the line total (pre-tax + GST).
 */
export const syncRentalInvoiceCommissions = async ({ entry, userId }) => {
    if (!entry?._id || entry.invoiceType === "quotation" || !userId) {
        return;
    }

    const rentalInvoiceId = entry._id;
    const companyId = entry.companyId?._id || entry.companyId;
    const lines = collectRentalLines(entry);
    const activeRentalProductIds = [];

    await commissionModel.deleteMany({
        rentalInvoiceId,
        $or: [{ rentalProductId: { $exists: false } }, { rentalProductId: null }],
    });

    for (const line of lines) {
        const machineDoc = await resolveMachineDoc(line.machineRef);
        const rentalProductId = machineDoc?._id || line.machineRef?._id || line.machineRef;
        if (!machineDoc || !rentalProductId) continue;

        const { commissionAmount, commissionRate } = calculateRentalLineCommission(
            machineDoc,
            line.a3Config,
            line.a4Config,
            line.a5Config
        );

        activeRentalProductIds.push(rentalProductId);

        await commissionModel.findOneAndUpdate(
            { rentalInvoiceId, rentalProductId },
            {
                commissionFrom: "Rental",
                userId,
                companyId,
                rentalInvoiceId,
                rentalProductId,
                commissionAmount,
                percentageRate: commissionRate,
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
    }

    if (activeRentalProductIds.length > 0) {
        await commissionModel.deleteMany({
            rentalInvoiceId,
            rentalProductId: { $exists: true, $nin: activeRentalProductIds },
        });
    }
};
