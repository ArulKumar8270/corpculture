import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography,
    Select, MenuItem, FormControl, InputLabel, TextField // Added TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { useAuth } from '../../../context/auth';

const RentalProductList = () => {
    const navigate = useNavigate();
    const [rentalProducts, setRentalProducts] = useState([]);
    const [employees, setEmployees] = useState([]); // New state for storing employee list
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term
    const { auth, userPermissions } = useAuth();

    useEffect(() => {
        fetchRentalProducts();
        fetchEmployees(); // Fetch employees when component mounts
    }, []);


    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const fetchRentalProducts = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products`);
            if (data?.success && data.rentalProducts.length > 0) {
                setRentalProducts(data.rentalProducts);
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
                const { data } = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products/${productId}`);
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
        const paymentDate = product.paymentDate ? dayjs(product.paymentDate).format('DD/MM/YYYY').toLowerCase() : '';
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return (
            companyName.includes(lowerCaseSearchTerm) ||
            modelName.includes(lowerCaseSearchTerm) ||
            serialNo.includes(lowerCaseSearchTerm) ||
            paymentDate.includes(lowerCaseSearchTerm)
        );
    });

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Rental Product List</h1>
                {hasPermission("rentalAllProducts") ? <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('../addRentalProduct')}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Add New Rental Product
                </Button> : null}
            </div>

            {/* Search Input */}
            <TextField
                fullWidth
                label="Search by Company, Model, Serial No, or Payment Date"
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
                                <TableCell className="font-semibold">Model Name</TableCell>
                                <TableCell className="font-semibold">Serial No</TableCell>
                                <TableCell className="font-semibold">HSN</TableCell>
                                <TableCell className="font-semibold">Base Price</TableCell>
                                <TableCell className="font-semibold">GST Type</TableCell>
                                <TableCell className="font-semibold">Payment Date</TableCell>
                                <TableCell className="font-semibold">Commission</TableCell> {/* New Table Header */}
                                <TableCell className="font-semibold">Assigned Employee</TableCell>
                                {hasPermission("rentalAllProducts") ? <TableCell className="font-semibold">Action</TableCell> : null}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProducts.length > 0 ? ( // Use filteredProducts here
                                filteredProducts.map((product, index) => (
                                    <TableRow key={product._id}>
                                        <TableCell>{index + 1}</TableCell>
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
                                        {hasPermission("rentalAllProducts") ? <TableCell>
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
                                    <TableCell colSpan={11} className="text-center text-gray-500 py-4"> {/* Adjusted colspan to 11 */}
                                        No rental products found.
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

export default RentalProductList;