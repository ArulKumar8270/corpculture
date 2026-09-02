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
    Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TrashStatusToggle from "../../../components/TrashStatusToggle";
import TrashActions from "../../../components/TrashActions";
import { buildTrashListUrl, restoreFromTrash, isTrashView } from "../../../utils/trashApi";

const PayslipList = () => {
    const { auth, userPermissions } = useAuth();
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState("active");

    const canPayslip = (action) =>
        Number(auth?.user?.role) === 1 ||
        (userPermissions || []).some(
            (p) => p.key === "otherSettingsPayslip" && Array.isArray(p.actions) && p.actions.includes(action)
        );

    const fetchPayslips = async () => {
        try {
            setLoading(true);
            const url = buildTrashListUrl(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/payslip/all`,
                viewMode
            );
            const { data } = await axios.get(url, { headers: { Authorization: auth?.token } });
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
    }, [auth?.token, viewMode]);

    const handleTrash = async (p) => {
        if (!window.confirm(`Move payslip for ${p.employeeName || p.employeeId?.name || "this employee"} to trash?`)) return;
        try {
            const { data } = await axios.delete(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/payslip/${p._id}`,
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) {
                toast.success("Payslip moved to trash.");
                fetchPayslips();
            } else toast.error(data?.message || "Failed to move to trash.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to move to trash.");
        }
    };

    const handleRestore = async (p) => {
        if (!window.confirm(`Restore payslip for ${p.employeeName || p.employeeId?.name || "this employee"} from trash?`)) return;
        try {
            const { data } = await restoreFromTrash(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/payslip`,
                p._id
            );
            if (data?.success) {
                toast.success(data.message || "Payslip restored.");
                fetchPayslips();
            } else toast.error(data?.message || "Failed to restore.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to restore.");
        }
    };

    const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
    const formatMoney = (n) => (n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0");

    return (
        <>
            <SeoData title="Payslips | Admin" />
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Payslips</h1>
                    {(Number(auth?.user?.role) === 1 || canPayslip("add")) && !isTrashView(viewMode) && (
                        <Link to="../addPayslip">
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] hover:opacity-90"
                            >
                                Add Payslip
                            </Button>
                        </Link>
                    )}
                </div>

                <TrashStatusToggle viewMode={viewMode} onChange={setViewMode} />

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
                                    {isTrashView(viewMode) ? <TableCell><strong>Status</strong></TableCell> : null}
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
                                        {isTrashView(viewMode) ? (
                                            <TableCell>
                                                <Chip label="Trash" size="small" color="warning" />
                                            </TableCell>
                                        ) : null}
                                        <TableCell align="center">
                                            <div className="flex flex-wrap gap-2 justify-center items-center">
                                                <Link to={`../payslip/view/${p._id}`} className="text-[#019ee3] font-medium">
                                                    View
                                                </Link>
                                                {!isTrashView(viewMode) && canPayslip("edit") && (
                                                    <Link to={`../addPayslip?id=${p._id}`} className="text-[#555] font-medium">
                                                        Edit
                                                    </Link>
                                                )}
                                                {canPayslip("delete") && (
                                                    <TrashActions
                                                        viewMode={viewMode}
                                                        showEdit={false}
                                                        onTrash={() => handleTrash(p)}
                                                        onRestore={() => handleRestore(p)}
                                                        trashLabel="Trash"
                                                        size="small"
                                                    />
                                                )}
                                            </div>
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
