import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Spinner from "../../components/Spinner";
import SeoData from "../../SEO/SeoData";
import { Paper, Button } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { downloadPayslipPdf } from "../../utils/payslipPdf";
import logo from "../../assets/images/logo.png";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
const formatMoney = (n) => (n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0");

export default function Payslips() {
    const { auth } = useAuth();
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth?.token) return;
        axios
            .get(`${import.meta.env.VITE_SERVER_URL}/api/v1/payslip/my`, { headers: { Authorization: auth.token } })
            .then(({ data }) => {
                if (data?.success) setPayslips(data.payslips || []);
            })
            .catch(() => toast.error("Failed to load payslips."))
            .finally(() => setLoading(false));
    }, [auth?.token]);

    const handleDownload = async (p) => {
        await downloadPayslipPdf(p, `payslip-${p.payPeriod || p._id}.pdf`, logo);
    };

    return (
        <>
            <SeoData title="My Payslips | Corp Culture" />
            <div className="p-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">My Payslips</h1>
                {loading ? (
                    <Spinner />
                ) : payslips.length === 0 ? (
                    <Paper className="p-8 text-center text-gray-500 rounded-xl shadow">
                        No payslips available yet.
                    </Paper>
                ) : (
                    <div className="space-y-4">
                        {payslips.map((p) => (
                            <Paper key={p._id} className="p-4 flex flex-wrap items-center justify-between gap-4 rounded-xl shadow">
                                <div>
                                    <p className="font-semibold text-gray-800">{p.payPeriod}</p>
                                    <p className="text-sm text-gray-500">Pay Date: {formatDate(p.payDate)}</p>
                                    <p className="text-lg font-bold text-[#019ee3] mt-1">Net Pay: {formatMoney(p.netPay)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Link to={`payslips/${p._id}`}>
                                        <Button variant="outlined" size="small" startIcon={<VisibilityIcon />}>View</Button>
                                    </Link>
                                    <Button variant="contained" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => handleDownload(p)} className="bg-[#019ee3]">
                                        Download PDF
                                    </Button>
                                </div>
                            </Paper>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
