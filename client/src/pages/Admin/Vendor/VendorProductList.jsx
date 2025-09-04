import React, { useState, useEffect } from 'react';
import { Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'; // Import TextField
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';

const VendorProductList = () => {
    const navigate = useNavigate();
    const [vendorProducts, setVendorProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term
    const { auth, userPermissions } = useAuth();
    useEffect(() => {
        fetchVendorProducts();
    }, []);

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const fetchVendorProducts = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendor-products`);
            if (data?.success && data.vendorProducts.length > 0) {
                setVendorProducts(data.vendorProducts);
            } else {
                toast.error(data?.message || 'Failed to fetch vendor products. Displaying sample data.');
                setVendorProducts([]);
            }
        } catch (error) {
            console.error('Error fetching vendor products:', error);
            toast.error('Something went wrong while fetching vendor products. Displaying sample data.');
            setVendorProducts([]);
        }
    };

    const handleAddVendorProduct = () => {
        navigate('../addVendorProduct');
    };

    const handleEdit = (productId) => {
        navigate(`../addVendorProduct?product_id=${productId}`);
        toast.info(`Editing vendor product with ID: ${productId}`);
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this vendor product?')) {
            try {
                const { data } = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendor-products/${productId}`);
                if (data?.success) {
                    toast.success(data.message || 'Vendor product deleted successfully!');
                    fetchVendorProducts(); // Refresh the list
                } else {
                    toast.error(data?.message || 'Failed to delete vendor product.');
                }
                // The line below is redundant if fetchVendorProducts() is called, as it will refresh the state from the server.
                // toast.success(`Vendor product with ID: ${productId} deleted successfully (simulated)!`);
                // setVendorProducts(vendorProducts.filter(product => product._id !== productId)); // Remove from local state
            } catch (error) {
                console.error('Error deleting vendor product:', error);
                toast.error('Something went wrong while deleting the vendor product (simulated).');
            }
        }
    };

    // Filter products based on search term
    const filteredProducts = vendorProducts.filter(product => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const vendorCompanyName = product.vendorCompanyName?.companyName?.toLowerCase() || '';
        const productName = product.productName?.toLowerCase() || '';

        return (
            vendorCompanyName.includes(lowerCaseSearchTerm) ||
            productName.includes(lowerCaseSearchTerm)
        );
    });

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <Typography variant="h5" className="font-semibold text-blue-600">
                    Vendor Product List
                </Typography>
                {hasPermission("vendorProducts") ? <Button
                    variant="contained"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    onClick={handleAddVendorProduct}
                >
                    Add New Vendor Product
                </Button> : null}
            </div>

            {/* Search Input */}
            <TextField
                fullWidth
                label="Search by Vendor Company Name or Product Name"
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
                                <TableCell className="font-semibold">Vendor Company Name</TableCell>
                                <TableCell className="font-semibold">Product Name</TableCell>
                                <TableCell className="font-semibold">GST Type</TableCell>
                                <TableCell className="font-semibold">Price Per Quantity</TableCell>
                                {hasPermission("vendorProducts") ? <TableCell className="font-semibold">Action</TableCell> : null}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProducts.length > 0 ? ( // Use filteredProducts here
                                filteredProducts.map((product, index) => ( // Use filteredProducts here
                                    <TableRow key={product._id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{product.vendorCompanyName?.companyName || 'N/A'}</TableCell>
                                        <TableCell>{product.productName}</TableCell>
                                        <TableCell>{product.gstType?.gstType || 'N/A'} ({product.gstType?.gstPercentage || 0}%)</TableCell>
                                        <TableCell>{product.pricePerQuantity}</TableCell>
                                        {hasPermission("vendorProducts") ? <TableCell>
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
                                        </TableCell> : null}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                                        No vendor products found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </div>
    );
};

export default VendorProductList;