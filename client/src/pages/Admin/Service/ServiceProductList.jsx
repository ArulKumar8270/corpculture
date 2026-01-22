import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography, TextField, Pagination, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../../context/auth';

const ServiceProductList = () => {
    const { auth, userPermissions } = useAuth();
    const navigate = useNavigate();
    const [serviceProducts, setServiceProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchServiceProducts();
    }, []);

    // Reset to page 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const fetchServiceProducts = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products`); // Assuming this is your API endpoint
            if (data?.success && data.serviceProducts.length > 0) {
                setServiceProducts(data.serviceProducts);
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
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const { data } = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products/${productId}`);
                if (data?.success) {
                    toast.success(data.message || 'Product deleted successfully!');
                    fetchServiceProducts(); // Refresh the list
                } else {
                    toast.error(data?.message || 'Failed to delete product.');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                toast.error('Something went wrong while deleting the product.');
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

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Service Product List</h1>
                {hasPermission("serviceProductList") ? <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('../addServiceProduct')}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Add New Product
                </Button> : null}
            </div>

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
                                <TableCell className="font-semibold">Total Amount</TableCell>
                                {hasPermission("serviceProductList") ? <TableCell className="font-semibold">Action</TableCell> : null}
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
                                        <TableCell>{product.totalAmount}</TableCell>
                                        {hasPermission("serviceProductList") ? <TableCell>
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
                                            {/* <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDelete(product._id)}
                                                className="bg-red-500 hover:bg-red-600"
                                            >
                                                Delete
                                            </Button> */}
                                        </TableCell> : null}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center text-gray-500 py-4">
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