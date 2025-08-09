import React, { useState, useEffect } from 'react';
import {
    Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    TextField, InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../../context/auth';

const PurchaseList = () => {
    const navigate = useNavigate();
    const { auth, userPermissions } = useAuth();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');


    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/purchases`);
            if (data?.success) {
                setPurchases(data.purchases);
            } else {
                setError(data?.message || 'Failed to fetch purchases.');
                toast.error(data?.message || 'Failed to fetch purchases.');
            }
        } catch (err) {
            console.error('Error fetching purchases:', err);
            setError('Something went wrong while fetching purchases.');
            toast.error('Something went wrong while fetching purchases.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, []);

    const handleAddPurchase = () => {
        navigate('../purchaseRegister');
    };

    const handleEdit = (id) => {
        navigate(`../purchaseRegister/${id}`);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this purchase record?')) {
            try {
                const { data } = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/purchases/${id}`);
                if (data?.success) {
                    toast.success(data?.message || 'Purchase deleted successfully.');
                    fetchPurchases(); // Refresh the list
                } else {
                    toast.error(data?.message || 'Failed to delete purchase.');
                }
            } catch (error) {
                console.error('Error deleting purchase:', error);
                toast.error('Something went wrong while deleting purchase.');
            }
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredPurchases = purchases.filter(purchase =>
        purchase.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.purchaseInvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.vendorCompanyName?.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-6 bg-gray-100 min-h-screen flex justify-center items-center">
                <Typography variant="h6">Loading Purchases...</Typography>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-gray-100 min-h-screen flex justify-center items-center">
                <Typography variant="h6" color="error">{error}</Typography>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6 w-[95%]">
                <Typography variant="h5" className="font-semibold text-blue-600">
                    Purchase List
                </Typography>
                {hasPermission("vendorPurchaseList") ? <Button
                    variant="contained"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    onClick={handleAddPurchase}
                >
                    Add New Purchase
                </Button> : null}
            </div>

            <Paper className="p-6 shadow-md w-[95%]" elevation={3}> {/* Increased elevation for a modern look */}
                <div className="mb-4">
                    <TextField
                        label="Search Purchases"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </div>

                {filteredPurchases.length === 0 ? (
                    <Typography variant="body1" className="text-gray-700 text-center py-4">
                        No purchase records found.
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table> {/* Added minWidth to ensure horizontal scrolling */}
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>S.No</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Invoice No.</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Vendor Company</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Product Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Purchase Date</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Quantity</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Rate</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Price</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Gross Total</TableCell>
                                    {hasPermission("vendorPurchaseList") ? <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Actions</TableCell> : null}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPurchases
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((purchase, index) => (
                                        <TableRow key={purchase._id}>
                                            <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>{purchase.purchaseInvoiceNumber}</TableCell>
                                            <TableCell>{purchase.vendorCompanyName?.companyName}</TableCell>
                                            <TableCell>{purchase.productName}</TableCell>
                                            <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                                            <TableCell align="right">{purchase.quantity}</TableCell>
                                            <TableCell align="right">{purchase.rate.toFixed(2)}</TableCell>
                                            <TableCell align="right">{purchase.price.toFixed(2)}</TableCell>
                                            <TableCell align="right">{purchase.grossTotal.toFixed(2)}</TableCell>
                                           {hasPermission("vendorPurchaseList") ? <TableCell align="center">
                                                <div className="flex justify-center space-x-2">
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<EditIcon />}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs"
                                                        onClick={() => handleEdit(purchase._id)}
                                                    >
                                                        EDIT
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<DeleteIcon />}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
                                                        onClick={() => handleDelete(purchase._id)}
                                                    >
                                                        DELETE
                                                    </Button>
                                                </div>
                                            </TableCell> : null}
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredPurchases.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </TableContainer>
                )}
            </Paper>
        </div>
    );
};

export default PurchaseList;