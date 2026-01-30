import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TablePagination,
    Chip,
    Autocomplete,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../../../context/auth";
import dayjs from "dayjs";

const LeaveReport = () => {
    const { auth } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [employeeFilter, setEmployeeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [detailLeave, setDetailLeave] = useState(null);
    const [openDetail, setOpenDetail] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [newStatus, setNewStatus] = useState("");

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (auth?.token) {
            fetchLeaves(fromDate, toDate, employeeFilter, statusFilter, page, rowsPerPage);
        }
    }, [auth?.token, page, rowsPerPage]);

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`,
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) setEmployees(data.employees || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const fetchLeaves = async (
        from = "",
        to = "",
        employeeId = "",
        status = "",
        currentPage = page,
        currentRowsPerPage = rowsPerPage
    ) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: currentPage + 1,
                limit: currentRowsPerPage,
            });
            if (from) params.append("fromDate", from);
            if (to) params.append("toDate", to);
            if (employeeId) params.append("employeeId", employeeId);
            if (status) params.append("status", status);

            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-leave/admin/all?${params.toString()}`,
                { headers: { Authorization: auth?.token } }
            );

            if (response.data.success) {
                setLeaves(response.data.leaves || []);
                setTotalCount(response.data.totalCount || 0);
            } else {
                toast.error(response.data.message || "Failed to fetch leave applications.");
                setError(response.data.message || "Failed to fetch leave applications.");
            }
        } catch (err) {
            console.error("Error fetching leaves:", err);
            setError(err.response?.data?.message || "Error fetching leave applications.");
            toast.error("Error fetching leave applications.");
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        setPage(0);
        fetchLeaves(fromDate, toDate, employeeFilter, statusFilter, 0, rowsPerPage);
    };

    const handleClearFilters = () => {
        setFromDate("");
        setToDate("");
        setEmployeeFilter("");
        setStatusFilter("");
        setPage(0);
        fetchLeaves("", "", "", "", 0, rowsPerPage);
    };

    const handleStatusUpdate = async (leaveId, status) => {
        try {
            setUpdatingId(leaveId);
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-leave/admin/status/${leaveId}`,
                { status },
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) {
                toast.success("Status updated.");
                setLeaves((prev) =>
                    prev.map((l) => (l._id === leaveId ? data.leave : l))
                );
                setDetailLeave((prev) => (prev?._id === leaveId ? data.leave : prev));
                setOpenDetail(false);
                setNewStatus("");
            } else {
                toast.error(data?.message || "Failed to update status.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const statusColor = (status) => {
        if (status === "Approved") return "success";
        if (status === "Rejected") return "error";
        return "warning";
    };

    const getEmployeeName = (leave) => {
        const emp = leave.employeeId;
        if (emp?.name) return emp.name;
        return leave.userId?.name || "—";
    };

    return (
        <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh", overflowX: "auto", width: "91%" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, color: "#019ee3", fontWeight: "bold" }}>
                Leave Report
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-end" }}>
                    <TextField
                        label="From Date"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 200 }}
                    />
                    <TextField
                        label="To Date"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 200 }}
                    />
                    <Autocomplete
                        options={employees}
                        getOptionLabel={(option) => option.name || ""}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        value={employees.find((e) => e._id === employeeFilter) || null}
                        onChange={(event, newValue) => setEmployeeFilter(newValue ? newValue._id : "")}
                        loading={loadingEmployees}
                        sx={{ minWidth: 250 }}
                        renderInput={(params) => (
                            <TextField {...params} label="Employee" variant="outlined" />
                        )}
                    />
                    <FormControl sx={{ minWidth: 180 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            label="Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value=""><em>All</em></MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Approved">Approved</MenuItem>
                            <MenuItem value="Rejected">Rejected</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" color="primary" onClick={handleFilter} sx={{ minWidth: 100 }}>
                        Filter
                    </Button>
                    <Button variant="outlined" onClick={handleClearFilters} sx={{ minWidth: 100 }}>
                        Clear
                    </Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" sx={{ p: 3, textAlign: "center" }}>{error}</Typography>
                ) : leaves.length === 0 ? (
                    <Typography sx={{ p: 3, textAlign: "center" }}>No leave applications found.</Typography>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                        <TableCell sx={{ fontWeight: "bold" }}>S.No</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>Employee</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>Leave Type</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>From</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>To</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>Days</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>Applied On</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "bold" }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {leaves.map((row, index) => (
                                        <TableRow key={row._id}>
                                            <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>{getEmployeeName(row)}</TableCell>
                                            <TableCell>
                                                {row.leaveType === "Other" ? row.leaveTypeOther || "Other" : row.leaveType}
                                            </TableCell>
                                            <TableCell>{dayjs(row.leaveFrom).format("DD-MM-YYYY")}</TableCell>
                                            <TableCell>{dayjs(row.leaveTo).format("DD-MM-YYYY")}</TableCell>
                                            <TableCell>{row.totalDays}</TableCell>
                                            <TableCell>
                                                <Chip label={row.status} color={statusColor(row.status)} size="small" />
                                            </TableCell>
                                            <TableCell>{dayjs(row.createdAt).format("DD-MM-YYYY")}</TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => {
                                                        setDetailLeave(row);
                                                        setNewStatus(row.status);
                                                        setOpenDetail(true);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={totalCount}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                        />
                    </>
                )}
            </Paper>

            <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Leave Application Details</DialogTitle>
                <DialogContent>
                    {detailLeave && (
                        <Box sx={{ pt: 1 }}>
                            <Typography><strong>Employee:</strong> {getEmployeeName(detailLeave)}</Typography>
                            <Typography><strong>Leave Type:</strong> {detailLeave.leaveType === "Other" ? detailLeave.leaveTypeOther || "Other" : detailLeave.leaveType}</Typography>
                            <Typography><strong>From:</strong> {dayjs(detailLeave.leaveFrom).format("DD-MM-YYYY")}</Typography>
                            <Typography><strong>To:</strong> {dayjs(detailLeave.leaveTo).format("DD-MM-YYYY")}</Typography>
                            <Typography><strong>Total Days:</strong> {detailLeave.totalDays}</Typography>
                            <Typography><strong>Reason:</strong> {detailLeave.reason}</Typography>
                            {detailLeave.contactDuringLeave && (
                                <Typography><strong>Contact During Leave:</strong> {detailLeave.contactDuringLeave}</Typography>
                            )}
                            <Typography><strong>Status:</strong> <Chip label={detailLeave.status} color={statusColor(detailLeave.status)} size="small" /></Typography>
                            {detailLeave.status === "Pending" && (
                                <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                                    <InputLabel>Update Status</InputLabel>
                                    <Select
                                        value={newStatus}
                                        label="Update Status"
                                        onChange={(e) => setNewStatus(e.target.value)}
                                    >
                                        <MenuItem value="Pending">Pending</MenuItem>
                                        <MenuItem value="Approved">Approved</MenuItem>
                                        <MenuItem value="Rejected">Rejected</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetail(false)}>Close</Button>
                    {detailLeave?.status === "Pending" && newStatus !== detailLeave?.status && (
                        <Button
                            variant="contained"
                            disabled={updatingId === detailLeave?._id}
                            onClick={() => handleStatusUpdate(detailLeave._id, newStatus)}
                        >
                            {updatingId === detailLeave?._id ? "Updating..." : "Update Status"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LeaveReport;
