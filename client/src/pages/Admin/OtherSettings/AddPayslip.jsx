import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../../context/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import SeoData from "../../../SEO/SeoData";
import Spinner from "../../../components/Spinner";
import {
    Paper,
    TextField,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
    Typography,
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
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("id") || "";
    const prevEmpRef = useRef("");
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(!!editId);
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
    const [totalKm, setTotalKm] = useState(0);
    const [kmLoading, setKmLoading] = useState(false);

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
        if (!employeeId) {
            prevEmpRef.current = "";
            return;
        }
        const emp = employees.find((e) => e._id === employeeId);
        if (!emp) {
            prevEmpRef.current = employeeId;
            return;
        }
        const fromUser = prevEmpRef.current !== "" && prevEmpRef.current !== employeeId;
        if (editId && !fromUser) {
            prevEmpRef.current = employeeId;
            return;
        }
        setEmployeeName(emp.name || "");
        setEmployeeIdNo(emp.idCradNo || emp.employeeIdNo || "");
        setDesignation(Array.isArray(emp.designation) ? emp.designation[0] : emp.designation || "");
        setDateOfJoining(emp.hireDate ? dayjs(emp.hireDate).format("YYYY-MM-DD") : "");
        setEarnings((prev) => ({
            ...prev,
            basic: Number(emp.salary) || 0,
            bikeAllowance: Number(emp.bikeAllowance) || 0,
        }));
        prevEmpRef.current = employeeId;
    }, [employeeId, employees, editId]);

    useEffect(() => {
        if (!editId) {
            setInitLoading(false);
            return;
        }
        if (!auth?.token) return;
        let cancelled = false;
        (async () => {
            try {
                setInitLoading(true);
                const { data } = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/payslip/${editId}`,
                    { headers: { Authorization: auth.token } }
                );
                if (cancelled) return;
                if (!data?.success || !data.payslip) {
                    toast.error(data?.message || "Payslip not found");
                    navigate("../payslip");
                    return;
                }
                const p = data.payslip;
                prevEmpRef.current = "";
                const empRef = p.employeeId;
                const eid =
                    typeof empRef === "object" && empRef?._id != null ? String(empRef._id) : String(empRef || "");
                setEmployeeId(eid);
                setEmployeeName(p.employeeName || "");
                setEmployeeIdNo(p.employeeIdNo != null ? String(p.employeeIdNo) : "");
                setDesignation(p.designation != null ? String(p.designation) : "");
                setDateOfJoining(p.dateOfJoining ? dayjs(p.dateOfJoining).format("YYYY-MM-DD") : "");
                const m = String(p.payPeriod || "").trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
                if (m) {
                    const d = dayjs(`${m[1]} 1, ${m[2]}`);
                    if (d.isValid()) setPayPeriodDate(d.format("YYYY-MM-DD"));
                }
                setPayDate(p.payDate ? dayjs(p.payDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"));
                setPaidDays(Number(p.paidDays) || 0);
                setLopDays(Number(p.lopDays) || 0);
                setEarnings({ ...defaultEarnings, ...(p.earnings || {}) });
                setDeductions({ ...defaultDeductions, ...(p.deductions || {}) });
                setRatings({ ...defaultRatings, ...(p.ratings || {}) });
            } catch (e) {
                if (!cancelled) {
                    toast.error(e.response?.data?.message || "Failed to load payslip");
                    navigate("../payslip");
                }
            } finally {
                if (!cancelled) setInitLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [editId, auth?.token, navigate]);

    useEffect(() => {
        let cancelled = false;

        const fetchTotalKm = async () => {
            if (!auth?.token) return;
            if (!employeeId || !payPeriodDate || !payDate) {
                setTotalKm(0);
                return;
            }

            try {
                setKmLoading(true);
                const params = new URLSearchParams({
                    page: "1",
                    limit: "1000",
                    employeeId,
                    fromDate: payPeriodDate,
                    toDate: payDate,
                });

                const { data } = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/admin/all?${params.toString()}`,
                    { headers: { Authorization: auth?.token } }
                );

                if (cancelled) return;

                const logs = Array.isArray(data?.activityLogs) ? data.activityLogs : [];
                const sum = logs.reduce((s, l) => s + (Number(l?.km) || 0), 0);
                setTotalKm(sum);
            } catch (e) {
                if (cancelled) return;
                setTotalKm(0);
            } finally {
                if (!cancelled) setKmLoading(false);
            }
        };

        fetchTotalKm();
        return () => {
            cancelled = true;
        };
    }, [auth?.token, employeeId, payPeriodDate, payDate]);

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
            if (editId) {
                const { data } = await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/payslip/${editId}`,
                    payload,
                    { headers: { Authorization: auth?.token } }
                );
                if (data?.success) {
                    toast.success("Payslip updated successfully.");
                    navigate("../payslip");
                } else toast.error(data?.message || "Failed to update payslip.");
            } else {
                const { data } = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/payslip/create`,
                    payload,
                    { headers: { Authorization: auth?.token } }
                );
                if (data?.success) {
                    toast.success("Payslip created successfully.");
                    navigate("../payslip");
                } else toast.error(data?.message || "Failed to create payslip.");
            }
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                    (editId ? "Failed to update payslip." : "Failed to create payslip.")
            );
        } finally {
            setLoading(false);
        }
    };

    if (initLoading) {
        return (
            <>
                <SeoData title={editId ? "Edit Payslip | Admin" : "Add Payslip | Admin"} />
                <div className="p-8 flex justify-center">
                    <Spinner />
                </div>
            </>
        );
    }

    return (
        <>
            <SeoData title={editId ? "Edit Payslip | Admin" : "Add Payslip | Admin"} />
            <div className="p-4 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">{editId ? "Edit Payslip" : "Add Payslip"}</h1>
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
                            <Grid item xs={12}>
                                <Paper className="p-3 rounded-xl bg-[#f7fafd] border border-[#e6fbff]">
                                    <Typography variant="subtitle2" sx={{ color: "#019ee3", fontWeight: "bold" }}>
                                        Total KM (Activity Logs)
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#444" }}>
                                        {kmLoading
                                            ? "Loading…"
                                            : `${Number(totalKm || 0).toLocaleString("en-IN")} km (from ${dayjs(payPeriodDate).format("DD/MM/YYYY")} to ${dayjs(payDate).format("DD/MM/YYYY")})`}
                                    </Typography>
                                </Paper>
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
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label={key.replace(/([A-Z])/g, " $1").trim()}
                                        value={earnings[key]}
                                        onChange={(e) => handleEarningChange(key, e.target.value)}
                                        inputProps={{ min: 0, step: 0.01 }}
                                        helperText={
                                            key === "petrolAllowance"
                                                ? `Total KM in period: ${Number(totalKm || 0).toLocaleString("en-IN")} km`
                                                : undefined
                                        }
                                    />
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
                                    {loading ? "Saving..." : editId ? "Save changes" : "Submit Payslip"}
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
