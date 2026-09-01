import EmployeeBenefits from "../../models/employeeBenefitsModel.js";
import Employee from "../../models/employeeModel.js";
import { softDeleteById, TRASH_SUCCESS_MESSAGE } from "../../utils/softDelete.js";

const benefitPopulate = [
    { path: "employeeId", select: "name email employeeId userId" },
    { path: "invoiceId", select: "invoiceNumber invoiceType companyId" },
    {
        path: "productId",
        select: "sku commission employeeCommission productName",
        populate: { path: "productName", select: "name unit" },
    },
];

const fetchBenefitsWithPositiveAmount = async (query, skip, limit) => {
    const [aggResult] = await EmployeeBenefits.aggregate([
        { $match: query },
        {
            $lookup: {
                from: "serviceproducts",
                localField: "productId",
                foreignField: "_id",
                as: "productDoc",
            },
        },
        { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                benefitAmount: {
                    $multiply: [
                        { $ifNull: ["$quantity", 0] },
                        {
                            $ifNull: [
                                "$productDoc.employeeCommission",
                                { $ifNull: ["$productDoc.commission", 0] },
                            ],
                        },
                    ],
                },
            },
        },
        { $match: { benefitAmount: { $gt: 0 } } },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: skip }, { $limit: limit }],
            },
        },
    ]);

    const pageRows = aggResult?.data || [];
    const totalCount = aggResult?.metadata?.[0]?.total || 0;
    const ids = pageRows.map((row) => row._id);

    if (!ids.length) {
        return { benefits: [], totalCount };
    }

    const benefits = await EmployeeBenefits.find({ _id: { $in: ids } })
        .populate(benefitPopulate)
        .lean();

    const byId = new Map(benefits.map((b) => [String(b._id), b]));
    const orderedBenefits = ids.map((id) => byId.get(String(id))).filter(Boolean);

    return { benefits: orderedBenefits, totalCount };
};

// Create Employee Benefit
export const createEmployeeBenefit = async (req, res) => {
    try {
        const { employeeId, invoiceId, productId, quantity, reInstall, otherProducts } = req.body;
        if (!employeeId || !invoiceId || !productId) {
            return res.status(400).send({ success: false, message: "Missing required fields" });
        }

        // Backward-compat: older clients send employeeId as a User _id (assignedTo).
        // If so, map userId -> Employee._id.
        let finalEmployeeId = employeeId;
        const employeeByUser = await Employee.findOne({ userId: employeeId }).select("_id");
        if (employeeByUser?._id) {
            finalEmployeeId = employeeByUser._id;
        }

        const benefit = new EmployeeBenefits({
            employeeId: finalEmployeeId,
            invoiceId,
            productId,
            quantity,
            reInstall,
            otherProducts,
        });
        await benefit.save();
        res.status(201).send({ success: true, message: "Employee benefit created", benefit });
    } catch (error) {
        res.status(500).send({ success: false, message: "Error creating employee benefit", error });
    }
};

// Get All Employee Benefits
export const getAllEmployeeBenefits = async (req, res) => {
    try {
        const { employeeId, page = 1, limit = 20 } = req.query;
        const query = {};
        if (employeeId) query.employeeId = employeeId;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Backfill (page-scope): older records may store employeeId as User._id.
        // Convert to Employee._id so populate works and employee name shows.
        const rawPage = await EmployeeBenefits.find(query)
            .select("_id employeeId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const ids = rawPage
            .map((b) => (b?.employeeId ? String(b.employeeId) : ""))
            .filter(Boolean);

        if (ids.length > 0) {
            const employeesById = await Employee.find({ _id: { $in: ids } })
                .select("_id")
                .lean();
            const employeeIdSet = new Set(employeesById.map((e) => String(e._id)));
            const missing = ids.filter((id) => !employeeIdSet.has(String(id)));

            if (missing.length > 0) {
                const employeesByUser = await Employee.find({ userId: { $in: missing } })
                    .select("_id userId")
                    .lean();
                const map = new Map(
                    employeesByUser.map((e) => [String(e.userId), String(e._id)])
                );
                const ops = [];
                for (const row of rawPage) {
                    const cur = row?.employeeId ? String(row.employeeId) : "";
                    const next = map.get(cur);
                    if (next) {
                        ops.push({
                            updateOne: {
                                filter: { _id: row._id },
                                update: { $set: { employeeId: next } },
                            },
                        });
                    }
                }
                if (ops.length) {
                    await EmployeeBenefits.bulkWrite(ops, { ordered: false });
                }
            }
        }

        const { benefits, totalCount } = await fetchBenefitsWithPositiveAmount(
            query,
            skip,
            parseInt(limit)
        );

        res.status(200).send({ success: true, benefits, totalCount });
    } catch (error) {
        res.status(500).send({ success: false, message: "Error fetching employee benefits", error });
    }
};

// Get Employee Benefits for logged-in employee (My Benefits)
export const getMyEmployeeBenefits = async (req, res) => {
    try {
        const userId = req.user?._id;
        const employee = await Employee.findOne({ userId });
        if (!employee) {
            return res.status(404).send({ success: false, message: "Employee not found for this user" });
        }

        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Backfill: ensure benefits link to Employee._id
        await EmployeeBenefits.updateMany(
            { employeeId: userId },
            { $set: { employeeId: employee._id } }
        );

        const { benefits, totalCount } = await fetchBenefitsWithPositiveAmount(
            { employeeId: employee._id },
            skip,
            parseInt(limit)
        );

        return res.status(200).send({ success: true, benefits, totalCount });
    } catch (error) {
        return res.status(500).send({ success: false, message: "Error fetching my benefits", error });
    }
};

// Get Employee Benefit by ID
export const getEmployeeBenefitById = async (req, res) => {
    try {
        const { id } = req.params;
        const benefit = await EmployeeBenefits.findById(id)
            .populate("employeeId")
            .populate("invoiceId")
            .populate("productId");
        if (!benefit) {
            return res.status(404).send({ success: false, message: "Employee benefit not found" });
        }
        res.status(200).send({ success: true, benefit });
    } catch (error) {
        res.status(500).send({ success: false, message: "Error fetching employee benefit", error });
    }
};

// Update Employee Benefit
export const updateEmployeeBenefit = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await EmployeeBenefits.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            return res.status(404).send({ success: false, message: "Employee benefit not found" });
        }
        res.status(200).send({ success: true, message: "Employee benefit updated", benefit: updated });
    } catch (error) {
        res.status(500).send({ success: false, message: "Error updating employee benefit", error });
    }
};

// Delete Employee Benefit
export const deleteEmployeeBenefit = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await softDeleteById(EmployeeBenefits, id, req.user?._id);
        if (!deleted) {
            return res.status(404).send({ success: false, message: "Employee benefit not found" });
        }
        res.status(200).send({ success: true, message: TRASH_SUCCESS_MESSAGE });
    } catch (error) {
        res.status(500).send({ success: false, message: "Error deleting employee benefit", error });
    }
};