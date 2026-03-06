import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/auth";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../../../components/Spinner";
import SeoData from "../../../SEO/SeoData";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const PayslipList = () => {
    const { auth } = useAuth();
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPayslips = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/payslip/all`,
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) setPayslips(data.payslips || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load payslips.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth?.token) fetchPayslips();
    }, [auth?.token]);

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
    const formatMoney = (n) => (n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0");

    return (
        <>
            <SeoData title="Payslips | Admin" />
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Payslips</h1>
                    <Link to="../addPayslip">
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] hover:opacity-90"
                        >
                            Add Payslip
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <Spinner />
                ) : payslips.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
                        No payslips yet. Add one for an employee.
                    </div>
                ) : (
                    <TableContainer component={Paper} className="shadow rounded-xl">
                        <Table>
                            <TableHead>
                                <TableRow className="bg-[#e6fbff]">
                                    <TableCell><strong>Employee</strong></TableCell>
                                    <TableCell><strong>Pay Period</strong></TableCell>
                                    <TableCell><strong>Pay Date</strong></TableCell>
                                    <TableCell align="right"><strong>Net Pay</strong></TableCell>
                                    <TableCell align="center"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {payslips.map((p) => (
                                    <TableRow key={p._id}>
                                        <TableCell>{p.employeeName || p.employeeId?.name}</TableCell>
                                        <TableCell>{p.payPeriod}</TableCell>
                                        <TableCell>{formatDate(p.payDate)}</TableCell>
                                        <TableCell align="right">{formatMoney(p.netPay)}</TableCell>
                                        <TableCell align="center">
                                            <Link to={`../payslip/view/${p._id}`} className="text-[#019ee3] font-medium">
                                                View
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </div>
        </>
    );
};

export default PayslipList;
