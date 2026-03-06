import Payslip from "../../models/payslipModel.js";
import Employee from "../../models/employeeModel.js";

export const createPayslipController = async (req, res) => {
    try {
        const body = req.body || {};
        const employeeId = body.employeeId;
        if (!employeeId) {
            return res.status(400).send({ success: false, message: "employeeId is required" });
        }
        const employee = await Employee.findById(employeeId).select("name designation hireDate").lean();
        if (!employee) {
            return res.status(404).send({ success: false, message: "Employee not found" });
        }

        const earnings = body.earnings && typeof body.earnings === "object" ? body.earnings : {};
        const deductions = body.deductions && typeof body.deductions === "object" ? body.deductions : {};
        const ratings = body.ratings && typeof body.ratings === "object" ? body.ratings : {};

        const payload = {
            employeeId,
            employeeName: body.employeeName || employee.name,
            employeeIdNo: body.employeeIdNo != null ? String(body.employeeIdNo) : "",
            designation: body.designation != null ? String(body.designation) : (Array.isArray(employee.designation) ? employee.designation[0] : employee.designation) || "",
            dateOfJoining: body.dateOfJoining ? new Date(body.dateOfJoining) : (employee.hireDate ? new Date(employee.hireDate) : undefined),
            payPeriod: body.payPeriod || "",
            payDate: body.payDate ? new Date(body.payDate) : new Date(),
            paidDays: Number(body.paidDays) || 0,
            lopDays: Number(body.lopDays) || 0,
            earnings: {
                basic: Number(earnings.basic) || 0,
                petrolAllowance: Number(earnings.petrolAllowance) || 0,
                bikeAllowance: Number(earnings.bikeAllowance) || 0,
                byBenefit: Number(earnings.byBenefit) || 0,
                foodAllowance: Number(earnings.foodAllowance) || 0,
                incentives: Number(earnings.incentives) || 0,
            },
            deductions: {
                taxPayable: Number(deductions.taxPayable) || 0,
            },
            ratings: {
                timing: Number(ratings.timing) || 0,
                leave: Number(ratings.leave) || 0,
                workFb: Number(ratings.workFb) || 0,
                incentive: Number(ratings.incentive) || 0,
                firmFb: Number(ratings.firmFb) || 0,
            },
        };

        const payslip = await Payslip.create(payload);
        const doc = await Payslip.findById(payslip._id).lean();
        doc.grossEarnings = (doc.earnings?.basic || 0) + (doc.earnings?.petrolAllowance || 0) + (doc.earnings?.bikeAllowance || 0) + (doc.earnings?.byBenefit || 0) + (doc.earnings?.foodAllowance || 0) + (doc.earnings?.incentives || 0);
        doc.totalDeductions = doc.deductions?.taxPayable || 0;
        doc.netPay = doc.grossEarnings - doc.totalDeductions;

        res.status(201).send({ success: true, payslip: doc });
    } catch (error) {
        console.error("Create payslip error:", error);
        res.status(500).send({ success: false, message: "Error creating payslip", error });
    }
};

export const getAllPayslipsController = async (req, res) => {
    try {
        const payslips = await Payslip.find({})
            .populate("employeeId", "name email designation")
            .sort({ payDate: -1, createdAt: -1 })
            .lean();
        const withTotals = payslips.map((p) => normalizePayslip(p));
        res.status(200).send({ success: true, payslips: withTotals });
    } catch (error) {
        console.error("Get all payslips error:", error);
        res.status(500).send({ success: false, message: "Error fetching payslips", error });
    }
};

export const getMyPayslipsController = async (req, res) => {
    try {
        const userId = req.user._id;
        const employee = await Employee.findOne({ userId }).lean();
        if (!employee) {
            return res.status(200).send({ success: true, payslips: [] });
        }
        const payslips = await Payslip.find({ employeeId: employee._id })
            .sort({ payDate: -1, createdAt: -1 })
            .lean();
        const withTotals = payslips.map((p) => normalizePayslip(p));
        res.status(200).send({ success: true, payslips: withTotals });
    } catch (error) {
        console.error("Get my payslips error:", error);
        res.status(500).send({ success: false, message: "Error fetching payslips", error });
    }
};

const EARNINGS_KEYS = ["basic", "petrolAllowance", "bikeAllowance", "byBenefit", "foodAllowance", "incentives"];

function normalizePayslip(p) {
    const rawE = p.earnings || {};
    const earnings = {};
    EARNINGS_KEYS.forEach((k) => { earnings[k] = Number(rawE[k]) || 0; });
    const rawD = p.deductions || {};
    const deductions = { taxPayable: Number(rawD.taxPayable) || 0 };
    const gross = EARNINGS_KEYS.reduce((s, k) => s + (earnings[k] || 0), 0);
    const ded = deductions.taxPayable || 0;
    return {
        ...p,
        earnings,
        deductions,
        grossEarnings: gross,
        totalDeductions: ded,
        netPay: gross - ded,
    };
}

export const getOnePayslipController = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id).populate("employeeId", "name email designation").lean();
        if (!payslip) {
            return res.status(404).send({ success: false, message: "Payslip not found" });
        }
        const normalized = normalizePayslip(payslip);

        const isAdmin = req.user && req.user.role === 1;
        if (!isAdmin) {
            const emp = await Employee.findOne({ userId: req.user._id }).lean();
            const slipEmpId = (normalized.employeeId?._id || normalized.employeeId)?.toString();
            if (!emp || emp._id.toString() !== slipEmpId) {
                return res.status(403).send({ success: false, message: "Not allowed to view this payslip" });
            }
        }

        res.status(200).send({ success: true, payslip: normalized });
    } catch (error) {
        console.error("Get one payslip error:", error);
        res.status(500).send({ success: false, message: "Error fetching payslip", error });
    }
};
