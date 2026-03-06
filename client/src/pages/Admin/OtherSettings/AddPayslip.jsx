import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../context/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import SeoData from "../../../SEO/SeoData";
import {
    Paper,
    TextField,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
} from "@mui/material";
import dayjs from "dayjs";

const defaultEarnings = {
    basic: 0,
    petrolAllowance: 0,
    bikeAllowance: 0,
    byBenefit: 0,
    foodAllowance: 0,
    incentives: 0,
};
const defaultDeductions = { taxPayable: 0 };
const defaultRatings = { timing: 0, leave: 0, workFb: 0, incentive: 0, firmFb: 0 };

const AddPayslip = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [employeeId, setEmployeeId] = useState("");
    const [employeeName, setEmployeeName] = useState("");
    const [employeeIdNo, setEmployeeIdNo] = useState("");
    const [designation, setDesignation] = useState("");
    const [dateOfJoining, setDateOfJoining] = useState("");
    const [payPeriodDate, setPayPeriodDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
    const [payDate, setPayDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [paidDays, setPaidDays] = useState(31);
    const [lopDays, setLopDays] = useState(0);
    const [earnings, setEarnings] = useState(defaultEarnings);
    const [deductions, setDeductions] = useState(defaultDeductions);
    const [ratings, setRatings] = useState(defaultRatings);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`,
                    { headers: { Authorization: auth?.token } }
                );
                if (data?.success) setEmployees(data.employees || []);
            } catch (e) {
                toast.error("Failed to load employees.");
            }
        };
        if (auth?.token) fetchEmployees();
    }, [auth?.token]);

    useEffect(() => {
        if (!employeeId) return;
        const emp = employees.find((e) => e._id === employeeId);
        if (emp) {
            setEmployeeName(emp.name || "");
            setEmployeeIdNo(emp.idCradNo || emp.employeeIdNo || "");
            setDesignation(Array.isArray(emp.designation) ? emp.designation[0] : emp.designation || "");
            setDateOfJoining(emp.hireDate ? dayjs(emp.hireDate).format("YYYY-MM-DD") : "");
        }
    }, [employeeId, employees]);

    const handleEarningChange = (field, value) => setEarnings((p) => ({ ...p, [field]: Number(value) || 0 }));
    const handleDeductionChange = (field, value) => setDeductions((p) => ({ ...p, [field]: Number(value) || 0 }));
    const handleRatingChange = (field, value) => setRatings((p) => ({ ...p, [field]: Number(value) || 0 }));

    const grossEarnings = Object.values(earnings).reduce((a, b) => a + b, 0);
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
    const netPay = grossEarnings - totalDeductions;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!employeeId || !payPeriodDate || !payDate) {
            toast.error("Please select employee, pay period and pay date.");
            return;
        }
        const payPeriod = dayjs(payPeriodDate).format("MMM YYYY");
        setLoading(true);
        try {
            const payload = {
                employeeId,
                employeeName,
                employeeIdNo,
                designation,
                dateOfJoining: dateOfJoining || undefined,
                payPeriod,
                payDate,
                paidDays: Number(paidDays) || 0,
                lopDays: Number(lopDays) || 0,
                earnings,
                deductions,
                ratings,
            };
            const { data } = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/payslip/create`,
                payload,
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) {
                toast.success("Payslip created successfully.");
                navigate("../payslip");
            } else toast.error(data?.message || "Failed to create payslip.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create payslip.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SeoData title="Add Payslip | Admin" />
            <div className="p-4 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Add Payslip</h1>
                <Paper className="p-6 shadow-lg rounded-2xl">
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormControl fullWidth size="small" required>
                                    <InputLabel>Employee</InputLabel>
                                    <Select
                                        value={employeeId}
                                        label="Employee"
                                        onChange={(e) => setEmployeeId(e.target.value)}
                                    >
                                        {employees.map((emp) => (
                                            <MenuItem key={emp._id} value={emp._id}>{emp.name} ({emp.email})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Employee Name" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Employee ID No" value={employeeIdNo} onChange={(e) => setEmployeeIdNo(e.target.value)} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" type="date" label="Date of Joining" value={dateOfJoining} onChange={(e) => setDateOfJoining(e.target.value)} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" type="date" label="Pay Period" value={payPeriodDate} onChange={(e) => setPayPeriodDate(e.target.value)} InputLabelProps={{ shrink: true }} required />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" type="date" label="Pay Date" value={payDate} onChange={(e) => setPayDate(e.target.value)} InputLabelProps={{ shrink: true }} required />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" type="number" label="Paid Days" value={paidDays} onChange={(e) => setPaidDays(e.target.value)} inputProps={{ min: 0 }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" type="number" label="LOP Days" value={lopDays} onChange={(e) => setLopDays(e.target.value)} inputProps={{ min: 0 }} />
                            </Grid>

                            <Grid item xs={12}><h3 className="font-semibold text-gray-700">Earnings</h3></Grid>
                            {Object.keys(earnings).map((key) => (
                                <Grid item xs={12} sm={6} key={key}>
                                    <TextField fullWidth size="small" type="number" label={key.replace(/([A-Z])/g, " $1").trim()} value={earnings[key]} onChange={(e) => handleEarningChange(key, e.target.value)} inputProps={{ min: 0, step: 0.01 }} />
                                </Grid>
                            ))}

                            <Grid item xs={12}><h3 className="font-semibold text-gray-700">Deductions</h3></Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" type="number" label="Tax Payable" value={deductions.taxPayable} onChange={(e) => handleDeductionChange("taxPayable", e.target.value)} inputProps={{ min: 0, step: 0.01 }} />
                            </Grid>

                            <Grid item xs={12}><h3 className="font-semibold text-gray-700">Ratings (0-5)</h3></Grid>
                            {Object.keys(ratings).map((key) => (
                                <Grid item xs={12} sm={4} key={key}>
                                    <TextField fullWidth size="small" type="number" label={key} value={ratings[key]} onChange={(e) => handleRatingChange(key, e.target.value)} inputProps={{ min: 0, max: 5, step: 0.5 }} />
                                </Grid>
                            ))}

                            <Grid item xs={12} className="pt-4 border-t">
                                <p className="text-lg font-semibold">Gross: ₹{grossEarnings.toLocaleString("en-IN")} | Deductions: ₹{totalDeductions.toLocaleString("en-IN")} | <span className="text-[#019ee3]">Net Pay: ₹{netPay.toLocaleString("en-IN")}</span></p>
                            </Grid>
                            <Grid item xs={12} className="flex gap-3">
                                <Button type="submit" variant="contained" disabled={loading} className="bg-gradient-to-r from-[#019ee3] to-[#afcb09]">
                                    {loading ? "Saving..." : "Submit Payslip"}
                                </Button>
                                <Button type="button" variant="outlined" onClick={() => navigate("../payslip")}>Cancel</Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </div>
        </>
    );
};

export default AddPayslip;
