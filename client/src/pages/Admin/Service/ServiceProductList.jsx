import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography, TextField, Pagination, Box, Chip } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useAuth } from '../../../context/auth';
import TrashStatusToggle from '../../../components/TrashStatusToggle';
import TrashActions from '../../../components/TrashActions';
import { buildTrashListUrl, restoreFromTrash, isTrashView } from '../../../utils/trashApi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const formatGstTypes = (gstType) => {
    if (!Array.isArray(gstType) || gstType.length === 0) return 'N/A';
    return gstType
        .map((gst) => `${gst.gstType} (${gst.gstPercentage}%)`)
        .join(', ');
};

const ServiceProductList = () => {
    const { auth, userPermissions } = useAuth();
    const navigate = useNavigate();
    const [serviceProducts, setServiceProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [viewMode, setViewMode] = useState('active');

    useEffect(() => {
        fetchServiceProducts();
    }, [viewMode]);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const isAdmin = Number(auth?.user?.role) === 1;

    const hasPermission = (key, action = 'edit') => {
        return userPermissions.some(p => p.key === key && p.actions.includes(action)) || auth?.user?.role === 1;
    };

    const canEditServiceProducts = hasPermission('serviceProductList', 'edit');
    const canDeleteServiceProducts = isAdmin || hasPermission('serviceProductList', 'delete');
    const showActions = canEditServiceProducts || canDeleteServiceProducts;

    const fetchServiceProducts = async () => {
        try {
            const url = buildTrashListUrl(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products`, viewMode);
            const { data } = await axios.get(url);
            if (data?.success) {
                setServiceProducts(data.serviceProducts || []);
            } else {
                toast.error(data?.message || 'Failed to fetch service products. Displaying sample data.');
                // Sample data if API fails or returns empty
                setServiceProducts([]);
            }
        } catch (error) {
            console.error('Error fetching service products:', error);
            toast.error('Something went wrong while fetching service products. Displaying sample data.');
            // Sample data if API call fails entirely
            setServiceProducts([]);
        }
    };

    const handleEdit = (productId) => {
        navigate(`../addServiceProduct?product_id=${productId}`);
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to move this product to trash?')) {
            try {
                const { data } = await axios.delete(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-products/${productId}`,
                    { headers: { Authorization: auth?.token } }
                );
                if (data?.success) {
                    toast.success(data.message || 'Product moved to trash successfully!');
                    fetchServiceProducts(); // Refresh the list
                } else {
                    toast.error(data?.message || 'Failed to move to trash product.');
                }
            } catch (error) {
                console.error('Error moving to trash product:', error);
                toast.error('Something went wrong while deleting the product.');
            }
        }
    };

    const handleRestore = async (productId) => {
        if (window.confirm('Restore this product from trash?')) {
            try {
                const { data } = await restoreFromTrash(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products`, productId);
                if (data?.success) {
                    toast.success(data.message || 'Product restored successfully!');
                    fetchServiceProducts();
                } else {
                    toast.error(data?.message || 'Failed to restore product.');
                }
            } catch (error) {
                console.error('Error restoring product:', error);
                toast.error(error.response?.data?.message || 'Something went wrong while restoring the product.');
            }
        }
    };

    // Filter products based on search term
    const filteredProducts = serviceProducts.filter(product => {
        const companyName = product.company?.companyName?.toLowerCase() || '';
        const productName = product.productName?.name?.toLowerCase() || '';
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return companyName.includes(lowerCaseSearchTerm) || productName.includes(lowerCaseSearchTerm);
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const handlePageChange = (event, value) => {
        setCurrentPage(value);
    };

    const handleDownloadExcel = () => {
        if (!filteredProducts.length) {
            toast.error('No service products to export.');
            return;
        }
        setExportingExcel(true);
        try {
            const rows = filteredProducts.map((product, index) => ({
                'S.No': index + 1,
                Company: product.company?.companyName || 'N/A',
                'Product Name': product.productName?.name || 'N/A',
                HSN: product.hsn ?? '',
                Quantity: product.quantity ?? '',
                Rate: product.rate ?? '',
                'GST Type': formatGstTypes(product.gstType),
                'Partner Profit': product.commission ?? '',
                'Employee Commission': product.employeeCommission ?? '',
                'Total Amount': product.totalAmount ?? '',
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Service Products');
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            const stamp = new Date().toISOString().slice(0, 10);
            saveAs(blob, `service_products_${stamp}.xlsx`);
            toast.success(`Exported ${rows.length} service product(s) to Excel.`);
        } catch (error) {
            console.error('Excel export error:', error);
            toast.error('Failed to export Excel.');
        } finally {
            setExportingExcel(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Service Product List</h1>
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
                    {canEditServiceProducts && !isTrashView(viewMode) ? <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('../addServiceProduct')}
                        className="bg-blue-500 hover:bg-blue-600"
                    >
                        Add New Product
                    </Button> : null}
                </div>
            </div>

            <TrashStatusToggle viewMode={viewMode} onChange={setViewMode} />

            {/* Search Input */}
            <TextField
                fullWidth
                label="Search by Company or Product Name"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
            />

            <Paper className="p-6 shadow-md">
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow className="bg-gray-100">
                                <TableCell className="font-semibold">S.No</TableCell>
                                <TableCell className="font-semibold">Company</TableCell>
                                <TableCell className="font-semibold">Product Name</TableCell>
                                {/* <TableCell className="font-semibold">SKU</TableCell> */}
                                <TableCell className="font-semibold">HSN</TableCell>
                                <TableCell className="font-semibold">Quantity</TableCell>
                                <TableCell className="font-semibold">Rate</TableCell>
                                <TableCell className="font-semibold">GST Type</TableCell>
                                <TableCell className="font-semibold">Partner Profit</TableCell>
                                <TableCell className="font-semibold">Employee Commission</TableCell>
                                <TableCell className="font-semibold">Total Amount</TableCell>
                                {isTrashView(viewMode) ? <TableCell className="font-semibold">Status</TableCell> : null}
                                {showActions ? <TableCell className="font-semibold">Action</TableCell> : null}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedProducts.length > 0 ? (
                                paginatedProducts.map((product, index) => (
                                    <TableRow key={product._id}>
                                        <TableCell>{startIndex + index + 1}</TableCell>
                                        <TableCell>{product.company?.companyName || 'N/A'}</TableCell>
                                        <TableCell>{product.productName?.name || 'N/A'}</TableCell>
                                        {/* <TableCell>{product.sku}</TableCell> */}
                                        <TableCell>{product.hsn}</TableCell>
                                        <TableCell>{product.quantity}</TableCell>
                                        <TableCell>{product.rate}</TableCell>
                                        <TableCell>
                                            {/* Display multiple GST types */}
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
                                        <TableCell>{product.commission ?? 'N/A'}</TableCell>
                                        <TableCell>{product.employeeCommission ?? 'N/A'}</TableCell>
                                        <TableCell>{product.totalAmount}</TableCell>
                                        {isTrashView(viewMode) ? (
                                            <TableCell>
                                                <Chip label="Trash" size="small" color="warning" />
                                            </TableCell>
                                        ) : null}
                                        {showActions ? (
                                            <TableCell>
                                                <TrashActions
                                                    viewMode={viewMode}
                                                    onEdit={() => handleEdit(product._id)}
                                                    onTrash={canDeleteServiceProducts ? () => handleDelete(product._id) : undefined}
                                                    onRestore={() => handleRestore(product._id)}
                                                    showEdit={canEditServiceProducts}
                                                />
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={showActions ? (isTrashView(viewMode) ? 10 : 9) : 8} className="text-center text-gray-500 py-4">
                                        No service products found.
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

export default ServiceProductList;