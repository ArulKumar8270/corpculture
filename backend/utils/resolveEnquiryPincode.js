import Company from "../models/companyModel.js";
import { normalizePincode } from "./orderEmployeeMatcher.js";

const extractPincodeFromText = (text) => {
    if (text == null || text === "") return "";
    const match = String(text).match(/\b\d{6}\b/);
    return match ? match[0] : "";
};

/** Resolve pincode from enquiry fields and linked company. */
export const resolveEnquiryPincode = async (enquiry) => {
    if (!enquiry) return "";

    const direct = normalizePincode(enquiry.pincode);
    if (direct) return direct;

    if (enquiry.companyId) {
        const company = await Company.findById(enquiry.companyId)
            .select("pincode serviceDeliveryAddresses")
            .lean();
        if (company) {
            const fromDelivery = company.serviceDeliveryAddresses?.[0]?.pincode;
            const fromCompany = normalizePincode(fromDelivery || company.pincode);
            if (fromCompany) return fromCompany;
        }
    }

    return (
        extractPincodeFromText(enquiry.addressDetail) ||
        extractPincodeFromText(enquiry.address) ||
        extractPincodeFromText(enquiry.location) ||
        ""
    );
};

/** Attach resolved pincode to enquiry list responses (batch company lookup). */
export const attachEnquiryPincodes = async (enquiries) => {
    if (!Array.isArray(enquiries) || enquiries.length === 0) return enquiries;

    const companyIds = [
        ...new Set(
            enquiries
                .map((e) => e?.companyId)
                .filter(Boolean)
                .map((id) => String(id))
        ),
    ];

    const companyMap = new Map();
    if (companyIds.length > 0) {
        const companies = await Company.find({ _id: { $in: companyIds } })
            .select("pincode serviceDeliveryAddresses")
            .lean();
        for (const company of companies) {
            companyMap.set(String(company._id), company);
        }
    }

    return Promise.all(
        enquiries.map(async (enquiry) => {
            const plain =
                typeof enquiry.toObject === "function"
                    ? enquiry.toObject()
                    : { ...enquiry };

            if (normalizePincode(plain.pincode)) {
                plain.pincode = normalizePincode(plain.pincode);
                return plain;
            }

            const company = plain.companyId
                ? companyMap.get(String(plain.companyId))
                : null;
            if (company) {
                const fromDelivery = company.serviceDeliveryAddresses?.[0]?.pincode;
                const fromCompany = normalizePincode(
                    fromDelivery || company.pincode
                );
                if (fromCompany) {
                    plain.pincode = fromCompany;
                    return plain;
                }
            }

            plain.pincode =
                extractPincodeFromText(plain.addressDetail) ||
                extractPincodeFromText(plain.address) ||
                extractPincodeFromText(plain.location) ||
                "";
            return plain;
        })
    );
};
