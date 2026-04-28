import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    TablePagination,
    TextField,
    Button,
    Autocomplete,
} from '@mui/material';
import dayjs from 'dayjs';
import { useAuth } from '../../../context/auth';

const EmployeeBenefitsReport = () => {
    const { auth } = useAuth();
    const [loading, setLoading] = useState(true);
    const [benefits, setBenefits] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [employees, setEmployees] = useState([]);
    const [employeeFilter, setEmployeeFilter] = useState(null);
    const employeeId = employeeFilter?._id || '';

    const fetchEmployees = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`,
                { headers: { Authorization: auth?.token } }
            );
            if (data?.success) setEmployees(data.employees || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchBenefits = async (p = page, rpp = rowsPerPage, empId = employeeId) => {
        if (!auth?.token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(p + 1),
                limit: String(rpp),
                _ts: String(Date.now()),
            });
            if (empId) params.append('employeeId', empId);
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-benefits?${params.toString()}`,
                { headers: { Authorization: auth?.token, 'Cache-Control': 'no-cache', Pragma: 'no-cache' } }
            );
            if (data?.success) {
                setBenefits(data.benefits || []);
                setTotalCount(data.totalCount || 0);
            } else {
                toast.error(data?.message || 'Failed to fetch benefits');
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to fetch benefits');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth?.token) {
            fetchEmployees();
            fetchBenefits(0, rowsPerPage, '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.token]);

    useEffect(() => {
        if (auth?.token) fetchBenefits(page, rowsPerPage, employeeId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage]);

    const rows = useMemo(() => benefits || [], [benefits]);

    const calcAmount = (b) => {
        const qty = Number(b?.quantity || 0);
        const rate = Number(
            b?.productId?.employeeCommission ?? b?.productId?.commission ?? 0
        );
        if (!Number.isFinite(qty) || !Number.isFinite(rate)) return 0;
        return qty * rate;
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" sx={{ mb: 2, color: '#019ee3', fontWeight: 'bold' }}>
                Employee Benefits Report
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Autocomplete
                        sx={{ minWidth: 320 }}
                        options={employees}
                        value={employeeFilter}
                        onChange={(_, v) => setEmployeeFilter(v)}
                        getOptionLabel={(o) => o?.name || ''}
                        isOptionEqualToValue={(o, v) => o?._id === v?._id}
                        renderInput={(params) => <TextField {...params} size="small" label="Employee" />}
                    />
                    <Button
                        variant="contained"
                        onClick={() => {
                            setPage(0);
                            fetchBenefits(0, rowsPerPage, employeeId);
                        }}
                    >
                        Filter
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setEmployeeFilter(null);
                            setPage(0);
                            fetchBenefits(0, rowsPerPage, '');
                        }}
                    >
                        Clear
                    </Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Re-Install</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Other Products</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">
                                                No benefits found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rows.map((b) => (
                                            <TableRow key={b._id} hover>
                                                <TableCell>
                                                    {b.createdAt ? dayjs(b.createdAt).format('DD/MM/YYYY') : '—'}
                                                </TableCell>
                                                <TableCell>{b.employeeId?.name || '—'}</TableCell>
                                                <TableCell>{b.invoiceId?.invoiceNumber || b.invoiceId?._id || '—'}</TableCell>
                                                <TableCell>
                                                    {b.productId?.productName?.name ||
                                                        b.productId?.productName ||
                                                        b.productId?.sku ||
                                                        '—'}
                                                </TableCell>
                                                <TableCell>{b.quantity ?? '—'}</TableCell>
                                                <TableCell>{`₹${calcAmount(b).toFixed(2)}`}</TableCell>
                                                <TableCell>{b.reInstall ? 'Yes' : 'No'}</TableCell>
                                                <TableCell>{b.otherProducts || '—'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            component="div"
                            count={totalCount}
                            page={page}
                            onPageChange={(_, p) => setPage(p)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                        />
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default EmployeeBenefitsReport;

