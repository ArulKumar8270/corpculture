import commissionModel from "../models/commissionModel.js";
import ServiceProduct from "../models/serviceProductModel.js";

const resolvePartnerProfit = async (productRef) => {
    if (productRef && typeof productRef === "object" && productRef.commission != null) {
        return Number(productRef.commission) || 0;
    }
    const productId = productRef?._id || productRef;
    if (!productId) return 0;
    const product = await ServiceProduct.findById(productId).select("commission").lean();
    return Number(product?.commission ?? 0);
};

/**
 * Create or update one commission record per invoice line item using
 * Partner Profit (service product `commission`) × line quantity.
 */
export const syncServiceInvoiceCommissions = async ({ invoice, userId }) => {
    if (!invoice?._id || invoice.invoiceType === "quotation" || !userId) {
        return;
    }

    const invoiceId = invoice._id;
    const companyId = invoice.companyId?._id || invoice.companyId;
    const lines = invoice.products || [];
    const activeProductIds = [];

    await commissionModel.deleteMany({
        serviceInvoiceId: invoiceId,
        $or: [{ productId: { $exists: false } }, { productId: null }],
    });

    for (const line of lines) {
        const productRef = line.productId;
        const productId = productRef?._id || productRef;
        if (!productId) continue;

        const partnerProfit = await resolvePartnerProfit(productRef);
        const quantity = Number(line.quantity ?? 0);
        const commissionAmount = quantity * partnerProfit;

        activeProductIds.push(productId);

        await commissionModel.findOneAndUpdate(
            { serviceInvoiceId: invoiceId, productId },
            {
                commissionFrom: "Service",
                userId,
                companyId,
                serviceInvoiceId: invoiceId,
                productId,
                commissionAmount,
                percentageRate: partnerProfit,
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
    }

    if (activeProductIds.length > 0) {
        await commissionModel.deleteMany({
            serviceInvoiceId: invoiceId,
            productId: { $exists: true, $nin: activeProductIds },
        });
    }
};
