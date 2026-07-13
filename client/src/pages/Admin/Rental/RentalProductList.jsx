import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography,
    Select, MenuItem, FormControl, InputLabel, TextField, Pagination, Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import dayjs from 'dayjs';
import { useAuth } from '../../../context/auth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const formatGstTypes = (gstType) => {
    if (!Array.isArray(gstType) || gstType.length === 0) return 'N/A';
    return gstType
        .map((gst) => `${gst.gstType} (${gst.gstPercentage}%)`)
        .join(', ');
};

const RentalProductList = () => {
    const navigate = useNavigate();
    const [rentalProducts, setRentalProducts] = useState([]);
    const [employees, setEmployees] = useState([]); // New state for storing employee list
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term
    const [companyFilter, setCompanyFilter] = useState('');
    const [rentalTypeFilter, setRentalTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [exportingExcel, setExportingExcel] = useState(false);
    const { auth, userPermissions } = useAuth();

    useEffect(() => {
        fetchRentalProducts();
        fetchEmployees(); // Fetch employees when component mounts
    }, []);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, companyFilter, rentalTypeFilter]);


    const isAdmin = Number(auth?.user?.role) === 1;

    const hasPermission = (key, action = 'edit') => {
        return userPermissions.some(p => p.key === key && p.actions.includes(action)) || isAdmin;
    };

    const fetchRentalProducts = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products`);
            if (data?.success) {
                setRentalProducts(data.rentalProducts || []);
            } else {
                toast.error(data?.message || 'Failed to fetch rental products. Displaying sample data.');
                setRentalProducts([]);
            }
        } catch (error) {
            console.error('Error fetching rental products:', error);
            toast.error('Something went wrong while fetching rental products. Displaying sample data.');
            setRentalProducts([]);
        }
    };

    // New function to fetch employees
    const fetchEmployees = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`, {
                headers: {
                    Authorization: auth?.token,
                },
            });
            if (data?.success) {
                setEmployees(data.employees);
            } else {
                toast.error(data?.message || 'Failed to fetch employees.');
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Something went wrong while fetching employees.');
        }
    };

    const handleEdit = (productId) => {
        navigate(`../addRentalProduct?product_id=${productId}`);
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this rental product?')) {
            try {
                const { data } = await axios.delete(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products/${productId}`,
                    {
                        headers: {
                            Authorization: auth?.token,
                        },
                    }
                );
                if (data?.success) {
                    toast.success(data.message || 'Rental product deleted successfully!');
                    fetchRentalProducts(); // Refresh the list
                } else {
                    toast.error(data?.message || 'Failed to delete rental product.');
                }
            } catch (error) {
                console.error('Error deleting rental product:', error);
                toast.error('Something went wrong while deleting the rental product.');
            }
        }
    };

    // New function to handle assigning an employee to a rental product
    const handleAssignEmployee = async (productId, employeeId, product) => {
        // Optimistic UI update: Update the state immediately for a smoother user experience
        setRentalProducts(prevProducts =>
            prevProducts.map(product =>
                product._id === productId
                    ? { ...product, employeeId: employees.find(emp => emp._id === employeeId) || null }
                    : product
            )
        );

        try {
            const rentalProductData = { ...product, employeeId: employeeId }; // Send only the employee ID
            const { data } = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products/${productId}`, rentalProductData);
            if (data?.success) {
                toast.success(data.message || 'Employee assigned successfully!');
                fetchRentalProducts();
            } else {
                toast.error(data?.message || 'Failed to assign employee.');
                fetchRentalProducts(); // Revert UI on error by refetching data
            }
        } catch (error) {
            console.error('Error assigning employee:', error);
            toast.error('Something went wrong while assigning employee.');
            fetchRentalProducts(); // Revert UI on error by refetching data
        }
    };

    // Filter products based on search term
    const filteredProducts = rentalProducts.filter(product => {
        const companyName = product.company?.companyName?.toLowerCase() || '';
        const modelName = product.modelName?.toLowerCase() || '';
        const serialNo = product.serialNo?.toLowerCase() || '';
        const rentalType = String(product.rentalType || '').toLowerCase();
        const paymentDate = product.paymentDate ? dayjs(product.paymentDate).format('DD/MM/YYYY').toLowerCase() : '';
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        const matchesSearch =
            companyName.includes(lowerCaseSearchTerm) ||
            modelName.includes(lowerCaseSearchTerm) ||
            serialNo.includes(lowerCaseSearchTerm) ||
            paymentDate.includes(lowerCaseSearchTerm);

        const matchesCompany = !companyFilter || product.company?._id === companyFilter;
        const matchesType = !rentalTypeFilter || rentalType === rentalTypeFilter.toLowerCase();

        return matchesSearch && matchesCompany && matchesType;
    });

    const companyOptions = [...new Map(
        rentalProducts
            .filter((p) => p.company?._id)
            .map((p) => [p.company._id, p.company])
    ).values()];

    const rentalTypeOptions = [...new Set(
        rentalProducts.map((p) => String(p.rentalType || '').trim()).filter(Boolean)
    )].sort();

    // Calculate pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    const getAssignedEmployeeName = (product) => {
        if (product?.employeeId?.name) return product.employeeId.name;
        const employeeId =
            typeof product?.employeeId === 'object'
                ? product?.employeeId?._id
                : product?.employeeId;
        if (!employeeId) return '';
        return employees.find((emp) => emp._id === employeeId)?.name || '';
    };

    const handleDownloadExcel = () => {
        if (!filteredProducts.length) {
            toast.error('No rental products to export.');
            return;
        }
        setExportingExcel(true);
        try {
            const rows = filteredProducts.map((product, index) => ({
                'S.No': index + 1,
                Company: product.company?.companyName || 'N/A',
                'Model Name': product.modelName ?? '',
                'Serial No': product.serialNo ?? '',
                HSN: product.hsn ?? '',
                'Base Price': product.basePrice ?? '',
                'GST Type': formatGstTypes(product.gstType),
                'Payment Date': product.paymentDate
                    ? dayjs(product.paymentDate).format('DD/MM/YYYY')
                    : '',
                Commission: product.commission != null ? `${product.commission}%` : '',
                'Assigned Employee': getAssignedEmployeeName(product) || 'None',
                'Rental Type': product.rentalType ?? '',
                Branch: product.branch ?? '',
                Department: product.department ?? '',
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Rental Products');
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            const stamp = new Date().toISOString().slice(0, 10);
            saveAs(blob, `rental_products_${stamp}.xlsx`);
            toast.success(`Exported ${rows.length} rental product(s) to Excel.`);
        } catch (error) {
            console.error('Excel export error:', error);
            toast.error('Failed to export Excel.');
        } finally {
            setExportingExcel(false);
        }
    };

    const canEditRentalProducts = hasPermission("rentalAllProducts", "edit");
    const canDeleteRentalProducts = isAdmin || hasPermission("rentalAllProducts", "delete");
    const showActions = canEditRentalProducts || canDeleteRentalProducts;

    return (
        <div className="p-4" style={{ width: '91%' }}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Rental Product List</h1>
                <div className="flex gap-2">
                    <Button
                        variant="outlined"
                        color="success"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleDownloadExcel}
                        disabled={exportingExcel || filteredProducts.length === 0}
                    >
                        {exportingExcel ? 'Preparing Excel…' : 'Download Excel'}
                    </Button>
                    {canEditRentalProducts ? <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('../addRentalProduct')}
                        className="bg-blue-500 hover:bg-blue-600"
                    >
                        Add New Rental Product
                    </Button> : null}
                </div>
            </div>

            {/* Search Input */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <TextField
                    label="Search by Company, Model, Serial No, or Payment Date"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flex: 1, minWidth: 240 }}
                />
                <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel>Company</InputLabel>
                    <Select
                        value={companyFilter}
                        label="Company"
                        onChange={(e) => setCompanyFilter(e.target.value)}
                    >
                        <MenuItem value="">All Companies</MenuItem>
                        {companyOptions.map((company) => (
                            <MenuItem key={company._id} value={company._id}>
                                {company.companyName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 180 }} size="small">
                    <InputLabel>Rental Type</InputLabel>
                    <Select
                        value={rentalTypeFilter}
                        label="Rental Type"
                        onChange={(e) => setRentalTypeFilter(e.target.value)}
                    >
                        <MenuItem value="">All Types</MenuItem>
                        {rentalTypeOptions.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Paper className="p-6 shadow-md">
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow className="bg-gray-100">
                                <TableCell className="font-semibold">S.No</TableCell>
                                <TableCell className="font-semibold">Company</TableCell>
                                <TableCell className="font-semibold">Model Name</TableCell>
                                <TableCell className="font-semibold">Serial No</TableCell>
                                <TableCell className="font-semibold">HSN</TableCell>
                                <TableCell className="font-semibold">Base Price</TableCell>
                                <TableCell className="font-semibold">GST Type</TableCell>
                                <TableCell className="font-semibold">Payment Date</TableCell>
                                <TableCell className="font-semibold">Commission</TableCell> {/* New Table Header */}
                                <TableCell className="font-semibold">Assigned Employee</TableCell>
                                {showActions ? <TableCell className="font-semibold">Action</TableCell> : null}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedProducts.length > 0 ? (
                                paginatedProducts.map((product, index) => (
                                    <TableRow key={product._id}>
                                        <TableCell>{startIndex + index + 1}</TableCell>
                                        <TableCell>{product.company?.companyName || 'N/A'}</TableCell>
                                        <TableCell>{product.modelName}</TableCell>
                                        <TableCell>{product.serialNo}</TableCell>
                                        <TableCell>{product.hsn}</TableCell>
                                        <TableCell>{product.basePrice}</TableCell>
                                        <TableCell>
                                        {Array.isArray(product.gstType) && product.gstType.length > 0 ? (
                                            product.gstType.map((gst, gstIndex) => (
                                                <Typography key={gstIndex} variant="body2" component="span">
                                                    {gst.gstType} ({gst.gstPercentage}%)
                                                    {gstIndex < product.gstType.length - 1 ? ', ' : ''}
                                                </Typography>
                                            ))
                                        ) : (
                                            'N/A'
                                        )}
                                        </TableCell>
                                        <TableCell>{product.paymentDate ? dayjs(product.paymentDate).format('DD/MM/YYYY') : 'N/A'}</TableCell>
                                        <TableCell>{product.commission ? `${product.commission}%` : 'N/A'}</TableCell> {/* Display Commission */}
                                        <TableCell>
                                            <FormControl variant="outlined" size="small" fullWidth>
                                                <InputLabel>Employee</InputLabel>
                                                <Select
                                                    value={product.employeeId || ''} // Set selected value based on product's assigned employee ID
                                                    onChange={(e) => handleAssignEmployee(product._id, e.target.value, product)}
                                                    label="Employee"
                                                    disabled={auth?.user?.role === 1 ? false : true}
                                                >
                                                    <MenuItem value="">
                                                        <em>None</em>
                                                    </MenuItem>
                                                    {employees.map((employee) => (
                                                        <MenuItem key={employee._id} value={employee._id}>
                                                            {employee.name} {/* Assuming employee object has a 'fullName' property */}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        {showActions ? (
                                            <TableCell>
                                                {canEditRentalProducts ? (
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => handleEdit(product._id)}
                                                        className="mr-2 bg-blue-500 hover:bg-blue-600"
                                                    >
                                                        Edit
                                                    </Button>
                                                ) : null}

                                                {canDeleteRentalProducts ? (
                                                    <Button
                                                        variant="contained"
                                                        color="error"
                                                        size="small"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => handleDelete(product._id)}
                                                        className="bg-red-500 hover:bg-red-600"
                                                    >
                                                        Delete
                                                    </Button>
                                                ) : null}
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={showActions ? 12 : 11} className="text-center text-gray-500 py-4">
                                        No rental products found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {filteredProducts.length > 0 && (
                    <Box display="flex" justifyContent="center" alignItems="center" mt={3} mb={2}>
                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                )}
            </Paper>
        </div>
    );
};

export default RentalProductList;