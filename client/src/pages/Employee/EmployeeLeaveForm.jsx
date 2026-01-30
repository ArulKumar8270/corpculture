import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/auth";
import {
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";

const LEAVE_TYPES = ["Casual Leave", "Sick Leave", "Earned Leave", "Other"];

const EmployeeLeaveForm = () => {
    const { auth } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [leaves, setLeaves] = useState([]);
    const [loadingLeaves, setLoadingLeaves] = useState(true);
    const [formData, setFormData] = useState({
        leaveType: "Casual Leave",
        leaveTypeOther: "",
        leaveFrom: "",
        leaveTo: "",
        totalDays: "",
        reason: "",
        contactDuringLeave: "",
    });
    const [editId, setEditId] = useState(null);
    const [openEdit, setOpenEdit] = useState(false);
    const [editForm, setEditForm] = useState({ ...formData });

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!auth?.user?._id || !auth?.token) return;
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/user/${auth.user._id}`,
                    { headers: { Authorization: auth.token } }
                );
                if (data?.success) {
                setEmployee(data.employee);
                // Debug: Log designation to see what's coming
                console.log("Employee designation:", data.employee?.designation);
            }
            } catch (err) {
                console.error("Error fetching employee:", err);
            }
        };
        fetchEmployee();
    }, [auth?.user?._id, auth?.token]);

    useEffect(() => {
        if (auth?.token) fetchMyLeaves();
    }, [auth?.token]);

    const fetchMyLeaves = async () => {
        try {
            setLoadingLeaves(true);
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-leave/my-leaves?limit=100`,
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) setLeaves(data.leaves || []);
        } catch (err) {
            console.error("Error fetching leaves:", err);
            toast.error("Failed to load leave applications");
        } finally {
            setLoadingLeaves(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if ((name === "leaveFrom" || name === "leaveTo") && formData.leaveFrom && formData.leaveTo) {
            // Recalc total days when both dates change in same tick we do it in effect
        }
    };

    useEffect(() => {
        if (formData.leaveFrom && formData.leaveTo) {
            const from = dayjs(formData.leaveFrom);
            const to = dayjs(formData.leaveTo);
            if (!to.isBefore(from)) {
                const days = to.diff(from, "day") + 1;
                setFormData((prev) => ({ ...prev, totalDays: String(days) }));
            }
        }
    }, [formData.leaveFrom, formData.leaveTo]);

    const getDepartmentDisplay = () => {
        if (!employee?.department) return "N/A";
        if (Array.isArray(employee.department) && employee.department.length > 0) {
            const names = employee.department
                .map((d) => (typeof d === "object" && d?.name ? d.name : typeof d === "string" ? d : null))
                .filter(Boolean);
            return names.length > 0 ? names.join(", ") : "N/A";
        }
        return typeof employee.department === "string" ? employee.department : "N/A";
    };

    const getDesignationDisplay = () => {
        if (!employee?.designation) return "N/A";
        
        // Handle array case
        if (Array.isArray(employee.designation)) {
            // Filter out null, undefined, and empty strings
            const filtered = employee.designation
                .map((d) => (d != null ? String(d).trim() : ""))
                .filter((d) => d.length > 0);
            
            if (filtered.length > 0) {
                return filtered.join(", ");
            }
            
            // If array exists but all values are empty, check if we should show something
            // For now, return N/A if all are empty
            return "N/A";
        }
        
        // Handle string case (if designation is stored as string)
        if (typeof employee.designation === "string") {
            return employee.designation.trim() || "N/A";
        }
        
        return "N/A";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.leaveFrom || !formData.leaveTo || !formData.totalDays || !formData.reason) {
            toast.error("Please fill Leave Period, Total Days and Reason.");
            return;
        }
        if (formData.leaveType === "Other" && !formData.leaveTypeOther?.trim()) {
            toast.error("Please specify leave type when selecting Other.");
            return;
        }
        try {
            setLoading(true);
            const { data } = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-leave/create`,
                {
                    ...formData,
                    totalDays: Number(formData.totalDays),
                },
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) {
                toast.success(data.message || "Leave application submitted.");
                setFormData({
                    leaveType: "Casual Leave",
                    leaveTypeOther: "",
                    leaveFrom: "",
                    leaveTo: "",
                    totalDays: "",
                    reason: "",
                    contactDuringLeave: "",
                });
                fetchMyLeaves();
            } else toast.error(data?.message || "Failed to submit.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit leave application.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (row) => {
        setEditId(row._id);
        setEditForm({
            leaveType: row.leaveType,
            leaveTypeOther: row.leaveTypeOther || "",
            leaveFrom: row.leaveFrom ? dayjs(row.leaveFrom).format("YYYY-MM-DD") : "",
            leaveTo: row.leaveTo ? dayjs(row.leaveTo).format("YYYY-MM-DD") : "",
            totalDays: String(row.totalDays || ""),
            reason: row.reason || "",
            contactDuringLeave: row.contactDuringLeave || "",
        });
        setOpenEdit(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async () => {
        if (!editForm.leaveFrom || !editForm.leaveTo || !editForm.totalDays || !editForm.reason) {
            toast.error("Please fill all required fields.");
            return;
        }
        try {
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-leave/update/${editId}`,
                { ...editForm, totalDays: Number(editForm.totalDays) },
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) {
                toast.success("Leave application updated.");
                setOpenEdit(false);
                setEditId(null);
                fetchMyLeaves();
            } else toast.error(data?.message || "Update failed.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this leave application?")) return;
        try {
            const { data } = await axios.delete(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-leave/delete/${id}`,
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) {
                toast.success("Leave application deleted.");
                fetchMyLeaves();
            } else toast.error(data?.message || "Delete failed.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Delete failed.");
        }
    };

    const statusColor = (status) => {
        if (status === "Approved") return "success";
        if (status === "Rejected") return "error";
        return "warning";
    };

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
            <Typography variant="h5" sx={{ mb: 3, color: "#019ee3", fontWeight: "bold" }}>
                Employee Leave Application Form
            </Typography>

            {/* Employee Details (auto) */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Employee Details
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Employee Name"
                            value={employee?.name ?? auth?.user?.name ?? "—"}
                            InputProps={{ readOnly: true }}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Employee ID"
                            value={employee?.idCradNo ?? "—"}
                            InputProps={{ readOnly: true }}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Department"
                            value={getDepartmentDisplay()}
                            InputProps={{ readOnly: true }}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Designation"
                            value={getDesignationDisplay()}
                            InputProps={{ readOnly: true }}
                            size="small"
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Leave Application Form */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Leave Details
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Leave Type</InputLabel>
                                <Select
                                    name="leaveType"
                                    value={formData.leaveType}
                                    label="Leave Type"
                                    onChange={handleInputChange}
                                >
                                    {LEAVE_TYPES.map((t) => (
                                        <MenuItem key={t} value={t}>
                                            {t}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {formData.leaveType === "Other" && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="leaveTypeOther"
                                    label="Specify Leave Type"
                                    value={formData.leaveTypeOther}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                size="small"
                                name="leaveFrom"
                                label="Leave Period - From"
                                type="date"
                                value={formData.leaveFrom}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                size="small"
                                name="leaveTo"
                                label="Leave Period - To"
                                type="date"
                                value={formData.leaveTo}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                size="small"
                                name="totalDays"
                                label="Total Days"
                                type="number"
                                inputProps={{ min: 1 }}
                                value={formData.totalDays}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                name="reason"
                                label="Reason for Leave"
                                multiline
                                rows={3}
                                value={formData.reason}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                name="contactDuringLeave"
                                label="Contact During Leave (Phone / Email)"
                                multiline
                                rows={2}
                                value={formData.contactDuringLeave}
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{ bgcolor: "#019ee3", "&:hover": { bgcolor: "#0180bb" } }}
                            >
                                {loading ? "Submitting..." : "Submit Leave Application"}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            {/* My Leave Applications */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    My Leave Applications
                </Typography>
                {loadingLeaves ? (
                    <Typography color="text.secondary">Loading...</Typography>
                ) : leaves.length === 0 ? (
                    <Typography color="text.secondary">No leave applications yet.</Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                    <TableCell><strong>Leave Type</strong></TableCell>
                                    <TableCell><strong>From</strong></TableCell>
                                    <TableCell><strong>To</strong></TableCell>
                                    <TableCell><strong>Days</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell align="right"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leaves.map((row) => (
                                    <TableRow key={row._id}>
                                        <TableCell>
                                            {row.leaveType === "Other" ? row.leaveTypeOther || "Other" : row.leaveType}
                                        </TableCell>
                                        <TableCell>{dayjs(row.leaveFrom).format("DD-MM-YYYY")}</TableCell>
                                        <TableCell>{dayjs(row.leaveTo).format("DD-MM-YYYY")}</TableCell>
                                        <TableCell>{row.totalDays}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.status}
                                                color={statusColor(row.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.status === "Pending" && (
                                                <>
                                                    <IconButton size="small" onClick={() => handleEditClick(row)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(row._id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Edit Dialog */}
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Leave Application</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Leave Type</InputLabel>
                                <Select
                                    name="leaveType"
                                    value={editForm.leaveType}
                                    label="Leave Type"
                                    onChange={handleEditChange}
                                >
                                    {LEAVE_TYPES.map((t) => (
                                        <MenuItem key={t} value={t}>{t}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {editForm.leaveType === "Other" && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="leaveTypeOther"
                                    label="Specify"
                                    value={editForm.leaveTypeOther}
                                    onChange={handleEditChange}
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                size="small"
                                name="leaveFrom"
                                label="From"
                                type="date"
                                value={editForm.leaveFrom}
                                onChange={handleEditChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                size="small"
                                name="leaveTo"
                                label="To"
                                type="date"
                                value={editForm.leaveTo}
                                onChange={handleEditChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                name="totalDays"
                                label="Total Days"
                                type="number"
                                inputProps={{ min: 1 }}
                                value={editForm.totalDays}
                                onChange={handleEditChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                name="reason"
                                label="Reason"
                                multiline
                                rows={2}
                                value={editForm.reason}
                                onChange={handleEditChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                size="small"
                                name="contactDuringLeave"
                                label="Contact During Leave"
                                value={editForm.contactDuringLeave}
                                onChange={handleEditChange}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleEditSubmit}>
                        Update
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeLeaveForm;
