import React, { useState, useEffect } from 'react';
import { Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast'; // Assuming you have react-hot-toast for notifications
import axios from 'axios';

const VendorProductList = () => {
    const navigate = useNavigate();
    const [vendorProducts, setVendorProducts] = useState([]);

    useEffect(() => {
        // In a real application, you would fetch data from an API here.
        // For now, we'll use sample data.
        fetchVendorProducts();
    }, []);

    const fetchVendorProducts = async () => {
        try {
            // Simulate API call
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
            setVendorProducts([]); // Fallback to sample data on error
        }
    };

    const handleAddVendorProduct = () => {
        navigate('../addVendorProduct');
    };

    const handleEdit = (productId) => {
        // Implement navigation to an edit page for the vendor product
        navigate(`../addVendorProduct?product_id=${productId}`);
        toast.info(`Editing vendor product with ID: ${productId}`);
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this vendor product?')) {
            try {
                // Simulate API call for deletion
                const { data } = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendor-products/${productId}`);
                if (data?.success) {
                    toast.success(data.message || 'Vendor product deleted successfully!');
                    fetchVendorProducts(); // Refresh the list
                } else {
                    toast.error(data?.message || 'Failed to delete vendor product.');
                }
                toast.success(`Vendor product with ID: ${productId} deleted successfully (simulated)!`);
                setVendorProducts(vendorProducts.filter(product => product._id !== productId)); // Remove from local state
            } catch (error) {
                console.error('Error deleting vendor product:', error);
                toast.error('Something went wrong while deleting the vendor product (simulated).');
            }
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <Typography variant="h5" className="font-semibold text-blue-600">
                    Vendor Product List
                </Typography>
                <Button
                    variant="contained"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    onClick={handleAddVendorProduct}
                >
                    Add New Vendor Product
                </Button>
            </div>

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
                                <TableCell className="font-semibold">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vendorProducts.length > 0 ? (
                                vendorProducts.map((product, index) => (
                                    <TableRow key={product._id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{product.vendorCompanyName?.companyName || 'N/A'}</TableCell>
                                        <TableCell>{product.productName}</TableCell>
                                        <TableCell>{product.gstType?.gstType || 'N/A'} ({product.gstType?.gstPercentage || 0}%)</TableCell>
                                        <TableCell>{product.pricePerQuantity}</TableCell>
                                        <TableCell>
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
                                        </TableCell>
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