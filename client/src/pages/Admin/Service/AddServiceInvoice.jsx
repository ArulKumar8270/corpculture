import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    TextField, Button, Select, MenuItem, FormControl, InputLabel, Paper, Typography,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const AddServiceInvoice = () => {
    const navigate = useNavigate();

    // Form states
    const [company, setCompany] = useState('');
    const [productName, setProductName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [modeOfPayment, setModeOfPayment] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState(null); // For the signed invoice file

    // Dropdown options (mock data for now, replace with actual API calls)
    const [companies, setCompanies] = useState([]);
    const [products, setProducts] = useState([]);
    const [paymentModes, setPaymentModes] = useState([]);
    const [deliveryAddresses, setDeliveryAddresses] = useState([]);

    // Table data (mock for now)
    const [invoiceItems, setInvoiceItems] = useState([
        { sNo: 1, productName: 'Product A', sku: 'SKU001', hsn: 'HSN123', quantity: 2, rate: 100, totalAmount: 200 },
        { sNo: 2, productName: 'Product B', sku: 'SKU002', hsn: 'HSN456', quantity: 1, rate: 250, totalAmount: 250 },
    ]);

    useEffect(() => {
        // Fetch data for dropdowns
        // In a real application, you would make API calls here
        setCompanies([
            { _id: 'comp1', name: 'Company Alpha' },
            { _id: 'comp2', name: 'Company Beta' },
        ]);
        setProducts([
            { _id: 'prod1', name: 'Service Product 1' },
            { _id: 'prod2', name: 'Service Product 2' },
        ]);
        setPaymentModes([
            { _id: 'cash', name: 'Cash' },
            { _id: 'card', name: 'Card' },
            { _id: 'bank_transfer', name: 'Bank Transfer' },
        ]);
        setDeliveryAddresses([
            { _id: 'addr1', name: '123 Main St, City A' },
            { _id: 'addr2', name: '456 Oak Ave, City B' },
        ]);
    }, []);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUploadSignedInvoice = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('signedInvoice', selectedFile);
        // You might also want to append invoice ID or other relevant data
        // formData.append('invoiceId', 'someInvoiceId');

        try {
            // Replace with your actual API endpoint for file upload
            const { data } = await axios.post('/api/v1/upload-signed-invoice', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (data?.success) {
                toast.success(data.message || 'Signed invoice uploaded successfully!');
                setSelectedFile(null); // Clear selected file after upload
            } else {
                toast.error(data?.message || 'Failed to upload signed invoice.');
            }
        } catch (error) {
            console.error('Error uploading signed invoice:', error);
            toast.error('Something went wrong while uploading signed invoice.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!company || !productName || !quantity || !modeOfPayment || !deliveryAddress || !description) {
            toast.error('Please fill in all required fields.');
            return;
        }

        const invoiceData = {
            company,
            productName,
            quantity: parseFloat(quantity),
            modeOfPayment,
            deliveryAddress,
            reference,
            description,
            invoiceItems, // Include items from the table if they are part of the submission
            // You might also include a reference to the uploaded file if it's uploaded separately
        };

        try {
            // Replace with your actual API endpoint for adding service invoice
            const { data } = await axios.post('/api/v1/service-invoices', invoiceData);
            if (data?.success) {
                toast.success(data.message || 'Service invoice added successfully!');
                // Clear form fields after successful submission
                setCompany('');
                setProductName('');
                setQuantity('');
                setModeOfPayment('');
                setDeliveryAddress('');
                setReference('');
                setDescription('');
                setSelectedFile(null);
                // navigate('/admin/service-invoices'); // Navigate to a list page if exists
            } else {
                toast.error(data?.message || 'Failed to add service invoice.');
            }
        } catch (error) {
            console.error('Error adding service invoice:', error);
            toast.error('Something went wrong while adding service invoice.');
        }
    };

    const handleCancel = () => {
        navigate('/admin/dashboard'); // Or navigate back to a service list page
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <Paper className="p-6 shadow-md mb-6">
                <Typography variant="h5" className="font-semibold mb-6 text-blue-600">
                    Add Service Invoice
                </Typography>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormControl fullWidth variant="outlined" size="small">
                            <InputLabel>Company</InputLabel>
                            <Select
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                label="Company"
                            >
                                <MenuItem value="">
                                    <em>Select a Company</em>
                                </MenuItem>
                                {companies.map((comp) => (
                                    <MenuItem key={comp._id} value={comp._id}>{comp.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth variant="outlined" size="small">
                            <InputLabel>Product Name</InputLabel>
                            <Select
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                label="Product Name"
                            >
                                <MenuItem value="">
                                    <em>Select a Product</em>
                                </MenuItem>
                                {products.map((prod) => (
                                    <MenuItem key={prod._id} value={prod._id}>{prod.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            inputProps={{ min: 0 }}
                        />
                        <FormControl fullWidth variant="outlined" size="small">
                            <InputLabel>Mode Of Payment</InputLabel>
                            <Select
                                value={modeOfPayment}
                                onChange={(e) => setModeOfPayment(e.target.value)}
                                label="Mode Of Payment"
                            >
                                <MenuItem value="">
                                    <em>Select a Mode Of Payment</em>
                                </MenuItem>
                                {paymentModes.map((mode) => (
                                    <MenuItem key={mode._id} value={mode._id}>{mode.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth variant="outlined" size="small">
                            <InputLabel>Service / Delivery Address</InputLabel>
                            <Select
                                value={deliveryAddress}
                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                label="Service / Delivery Address"
                            >
                                <MenuItem value="">
                                    <em>Select Delivery Address</em>
                                </MenuItem>
                                {deliveryAddresses.map((addr) => (
                                    <MenuItem key={addr._id} value={addr._id}>{addr.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Reference"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                    </div>
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                    />

                    <div className="flex justify-start items-center gap-4 mt-6">
                        <Button
                            type="submit"
                            variant="contained"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                        >
                            Submit
                        </Button>
                        <Button
                            type="button"
                            variant="outlined"
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                        <input
                            accept="application/pdf,image/*" // Accept PDF and image files
                            style={{ display: 'none' }}
                            id="upload-signed-invoice"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="upload-signed-invoice">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<UploadFileIcon />}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md"
                                onClick={handleUploadSignedInvoice}
                                disabled={!selectedFile} // Disable if no file is selected
                            >
                                Upload Signed Invoice
                            </Button>
                        </label>
                        {selectedFile && (
                            <Typography variant="body2" className="ml-2">
                                {selectedFile.name}
                            </Typography>
                        )}
                    </div>
                </form>
            </Paper>

            {/* Invoice Items Table */}
            <Paper className="p-6 shadow-md mt-6">
                <Typography variant="h6" className="font-semibold mb-4">Invoice Items</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow className="bg-gray-200">
                                <TableCell className="font-semibold">S.No</TableCell>
                                <TableCell className="font-semibold">Product Name</TableCell>
                                <TableCell className="font-semibold">Sku</TableCell>
                                <TableCell className="font-semibold">HSN</TableCell>
                                <TableCell className="font-semibold">Quantity</TableCell>
                                <TableCell className="font-semibold">Rate</TableCell>
                                <TableCell className="font-semibold">Total Amount</TableCell>
                                <TableCell className="font-semibold">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoiceItems.map((item) => (
                                <TableRow key={item.sNo}>
                                    <TableCell>{item.sNo}</TableCell>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell>{item.sku}</TableCell>
                                    <TableCell>{item.hsn}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.rate}</TableCell>
                                    <TableCell>{item.totalAmount}</TableCell>
                                    <TableCell>
                                        {/* Add action buttons like Edit/Delete here */}
                                        <Button size="small" color="primary">Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </div>
    );
};

export default AddServiceInvoice;