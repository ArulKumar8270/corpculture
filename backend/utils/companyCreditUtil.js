import mongoose from "mongoose";
import Credit from "../models/creditModel.js";
import Company from "../models/companyModel.js";

export const computeCompanyCreditSummary = async (companyId) => {
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
        return { totalGiven: 0, totalUsed: 0, totalAdjusted: 0, availableCredit: 0 };
    }

    const totalCreditResult = await Credit.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        {
            $group: {
                _id: "$creditType",
                total: { $sum: "$amount" },
            },
        },
    ]);

    let totalGiven = 0;
    let totalUsed = 0;
    let totalAdjusted = 0;

    totalCreditResult.forEach((item) => {
        if (item._id === "Given") totalGiven = item.total;
        else if (item._id === "Used") totalUsed = item.total;
        else if (item._id === "Adjusted") totalAdjusted = item.total;
    });

    const availableCredit = Math.max(0, totalGiven - totalUsed + totalAdjusted);

    return { totalGiven, totalUsed, totalAdjusted, availableCredit };
};

export const userCanAccessCompany = async (user, companyId) => {
    if (!user || !companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
        return false;
    }

    const company = await Company.findById(companyId).lean();
    if (!company) return false;

    const userId = String(user._id || "");
    if (company.userId && String(company.userId) === userId) {
        return true;
    }

    const phone = String(user.phone || "").trim();
    if (!phone) return false;

    const last8 = phone.slice(-8);
    return (company.contactPersons || []).some((cp) => {
        const mobile = String(cp?.mobile || "").trim();
        if (!mobile) return false;
        return mobile === phone || mobile.slice(-8) === last8;
    });
};

export const recordCreditUsed = async ({
    companyId,
    amount,
    createdBy,
    description,
}) => {
    const credit = new Credit({
        companyId,
        amount: parseFloat(amount),
        creditType: "Used",
        description: description || "",
        createdBy,
    });
    await credit.save();
    return credit;
};
