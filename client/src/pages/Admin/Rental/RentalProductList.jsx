import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography,
    Select, MenuItem, FormControl, InputLabel // Added Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { useAuth } from '../../../context/auth';

const RentalProductList = () => {
    const navigate = useNavigate();
    const [rentalProducts, setRentalProducts] = useState([]);
    const [employees, setEmployees] = useState([]); // New state for storing employee list
    const { auth } = useAuth();

    useEffect(() => {
        fetchRentalProducts();
        fetchEmployees(); // Fetch employees when component mounts
    }, []);

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

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Rental Product List</h1>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('../addRentalProduct')}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Add New Rental Product
                </Button>
            </div>

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
                                <TableCell className="font-semibold">Assigned Employee</TableCell> {/* New Table Header */}
                                <TableCell className="font-semibold">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rentalProducts.length > 0 ? (
                                rentalProducts.map((product, index) => (
                                    <TableRow key={product._id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{product.company?.companyName || 'N/A'}</TableCell>
                                        <TableCell>{product.modelName}</TableCell>
                                        <TableCell>{product.serialNo}</TableCell>
                                        <TableCell>{product.hsn}</TableCell>
                                        <TableCell>{product.basePrice}</TableCell>
                                        <TableCell>{product.gstType?.gstType || 'N/A'} ({product.gstType?.gstPercentage || 0}%)</TableCell>
                                        <TableCell>{product.paymentDate ? dayjs(product.paymentDate).format('DD/MM/YYYY') : 'N/A'}</TableCell>
                                        <TableCell>
                                            <FormControl variant="outlined" size="small" fullWidth>
                                                <InputLabel>Employee</InputLabel>
                                                <Select
                                                    value={product.employeeId || ''} // Set selected value based on product's assigned employee ID
                                                    onChange={(e) => handleAssignEmployee(product._id, e.target.value, product)}
                                                    label="Employee"
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
                                    <TableCell colSpan={10} className="text-center text-gray-500 py-4"> {/* Adjusted colspan to 10 */}
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