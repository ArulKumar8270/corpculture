import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Autocomplete,
} from "@mui/material";
import qrCode from "../assets/images/qrCode.png";

const UserProfile = () => {
    const { auth, setAuth } = useAuth();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState(auth?.user?.email);
    const [name, setName] = useState(auth?.user?.name);
    const [phone, setPhone] = useState(auth?.user?.phone);
    const [profile, setProfile] = useState(false);
    const [emailSection, setEmailSection] = useState(false);
    const [phoneSection, setPhoneSection] = useState(false);
    const [nameInputFocused, setNameInputFocused] = useState(false);
    const [emailInputFocused, setEmailInputFocused] = useState(false);
    const [phoneInputFocused, setPhoneInputFocused] = useState(false);

    // Payment details state
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [companyPendingInvoice, setCompanyPendingInvoice] = useState([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [balanceAmount, setBalanceAmount] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [paymentForm, setPaymentForm] = useState({
        modeOfPayment: "",
        bankName: "",
        transactionDetails: "",
        chequeDate: "",
        transferDate: "",
        companyNamePayment: "",
        otherPaymentMode: "",
        paymentAmount: 0,
        paymentAmountType: "",
        grandTotal: 0,
    });

    // Fetch employee data
    useEffect(() => {
        const fetchEmployeeData = async () => {
            if (!auth?.user?._id) {
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/user/${auth.user._id}`,
                    {
                        headers: {
                            Authorization: auth?.token,
                        },
                    }
                );
                if (response.data.success) {
                    setEmployee(response.data.employee);
                }
            } catch (error) {
                console.error("Error fetching employee data:", error);
                // Employee might not exist, which is okay
            } finally {
                setLoading(false);
            }
        };
        fetchEmployeeData();
    }, [auth?.user?._id, auth?.token]);

    // Fetch companies
    useEffect(() => {
        const fetchCompanies = async () => {
            if (!auth?.token) return;
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/company/all?limit=1000`,
                    {
                        headers: { Authorization: auth.token },
                    }
                );
                if (data?.success) {
                    setCompanies(data.companies || []);
                }
            } catch (err) {
                console.error("Error fetching companies:", err);
            }
        };
        fetchCompanies();
    }, [auth?.token]);

    // Fetch invoices when company is selected
    useEffect(() => {
        const fetchInvoices = async () => {
            if (!selectedCompany || !auth?.token) {
                setInvoices([]);
                return;
            }
            try {
                setLoadingInvoices(true);
                const response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                    {
                        companyId: selectedCompany,
                        invoiceType: "invoice",
                        status: { $ne: "Paid" },
                    },
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
                if (response.data?.success) {
                    setInvoices(response.data.serviceInvoices || []);
                }
            } catch (error) {
                console.error("Error fetching invoices:", error);
                toast.error("Failed to fetch invoices");
            } finally {
                setLoadingInvoices(false);
            }
        };
        fetchInvoices();
    }, [selectedCompany, auth?.token]);

    const handleProfile = () => {
        setProfile(!profile);
        setEmailSection(false);
        setPhoneSection(false);
    };

    const handleEmail = () => {
        setEmailSection(!emailSection);
        setProfile(false);
        setPhoneSection(false);
    };

    const handlePhone = () => {
        setPhoneSection(!phoneSection);
        setProfile(false);
        setEmailSection(false);
    };

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        try {
            setProfile(false);
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/update-details`,
                {
                    newName: name,
                    email: auth?.user?.email,
                }
            );
            setAuth({
                ...auth,
                user: {
                    ...auth.user,
                    name: response.data.user.name,
                },
            });
            localStorage.setItem("auth", JSON.stringify(response.data));
            toast.success(response.data.message);
        } catch (error) {
            console.error("Error:", error);
            error.response?.status === 401 &&
                error.response.data?.errorType === "invalidUser" &&
                toast.error("User not Found!");
            error.response?.status === 500 &&
                toast.error("Something went wrong! Please try after sometime.");
            !error.response && toast.error("Network error or server unreachable.");
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        try {
            setEmailSection(false);
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/update-details`,
                {
                    newEmail: email,
                    email: auth?.user?.email,
                }
            );
            setAuth({
                ...auth,
                user: {
                    ...auth.user,
                    email: response.data.user.email,
                },
            });
            localStorage.setItem("auth", JSON.stringify(response.data));
            toast.success(response.data.message);
        } catch (error) {
            console.error("Error:", error);
            error.response?.status === 401 &&
                error.response.data?.errorType === "invalidUser" &&
                toast.error("User not Found!");
            error.response?.status === 500 &&
                toast.error("Something went wrong! Please try after sometime.");
            !error.response && toast.error("Network error or server unreachable.");
        }
    };

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setPhoneSection(false);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/update-details`,
                {
                    newPhone: phone,
                    email: auth?.user?.email,
                }
            );
            setAuth({
                ...auth,
                user: {
                    ...auth.user,
                    phone: response.data.user.phone,
                },
            });
            localStorage.setItem("auth", JSON.stringify(response.data));
            toast.success(response.data.message);
        } catch (error) {
            console.error("Error:", error);
            error.response?.status === 401 &&
                error.response.data?.errorType === "invalidUser" &&
                toast.error("User not Found!");
            error.response?.status === 500 &&
                toast.error("Something went wrong! Please try after sometime.");
            !error.response && toast.error("Network error or server unreachable.");
        }
    };

    // Get department name (handle both string and populated object)
    const getDepartmentName = () => {
        if (!employee?.department) return "N/A";
        if (typeof employee.department === "string") return employee.department;
        return employee.department.name || employee.department._id || "N/A";
    };

    // Payment details handlers
    const handleOpenPaymentModal = (invoice) => {
        setSelectedInvoice(invoice);
        setPaymentForm({
            modeOfPayment: invoice.modeOfPayment || "",
            bankName: invoice.bankName || "",
            transactionDetails: invoice.transactionDetails || "",
            chequeDate: invoice.chequeDate
                ? new Date(invoice.chequeDate).toISOString().split("T")[0]
                : "",
            transferDate: invoice.transferDate
                ? new Date(invoice.transferDate).toISOString().split("T")[0]
                : "",
            companyNamePayment: invoice.companyNamePayment || "",
            otherPaymentMode: invoice.otherPaymentMode || "",
            paymentAmount: invoice.paymentAmount || 0,
            paymentAmountType: invoice.paymentAmountType || "",
            grandTotal: Number(invoice.grandTotal).toFixed(2) || 0,
        });
        setOpenPaymentModal(true);
    };

    const handleClosePaymentModal = () => {
        setOpenPaymentModal(false);
        setSelectedInvoice(null);
        setBalanceAmount(0);
        setPendingAmount(0);
        setSelectedInvoiceId(null);
        setCompanyPendingInvoice([]);
    };

    const handlePaymentFormChange = async (e) => {
        const { name, value } = e.target;
        setPaymentForm((prev) => ({ ...prev, [name]: value }));

        if (name === "paymentAmount" && selectedInvoice) {
            if (value < selectedInvoice?.grandTotal) {
                let balance = selectedInvoice?.grandTotal - value;
                setPendingAmount(balance);
                setBalanceAmount(0);
            } else {
                let balance = Number(value) - Number(selectedInvoice?.grandTotal);
                setBalanceAmount(balance);
                setPendingAmount(0);
                try {
                    let response = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                        {
                            companyId: selectedInvoice?.companyId,
                            tdsAmount: { $eq: null },
                            status: { $ne: "Paid" },
                        },
                        {
                            headers: {
                                Authorization: auth.token,
                            },
                        }
                    );
                    setCompanyPendingInvoice(response.data?.serviceInvoices || []);
                } catch (err) {
                    console.log(err, "Api error");
                }
            }
        }
    };

    const handleSavePaymentDetails = async () => {
        if (!selectedInvoice) return;

        let status = "Paid";
        if (balanceAmount && selectedInvoiceId) {
            status = "Unpaid";
        } else if (
            Number(paymentForm?.paymentAmount) >= Number(paymentForm?.grandTotal) ||
            paymentForm.paymentAmountType === "TDS"
        ) {
            status = "Paid";
        } else {
            status = "Unpaid";
        }

        try {
            const payload = {
                modeOfPayment: paymentForm.modeOfPayment,
                bankName: paymentForm.bankName,
                transactionDetails: paymentForm.transactionDetails,
                chequeDate: paymentForm.chequeDate,
                transferDate: paymentForm.transferDate,
                companyNamePayment: paymentForm.companyNamePayment,
                otherPaymentMode: paymentForm.otherPaymentMode,
                paymentAmountType: paymentForm.paymentAmountType,
                paymentAmount:
                    balanceAmount && selectedInvoiceId
                        ? Number(balanceAmount)
                        : paymentForm?.paymentAmount >= paymentForm?.grandTotal
                            ? Number(paymentForm?.grandTotal)
                            : Number(paymentForm?.paymentAmount),
                tdsAmount: 0,
                pendingAmount: 0,
                status: status,
            };

            if (paymentForm.paymentAmountType === "TDS") {
                payload.tdsAmount = pendingAmount || 0;
            } else if (paymentForm.paymentAmountType === "Pending") {
                payload.pendingAmount = pendingAmount || 0;
            }

            const invoiceId = balanceAmount && selectedInvoiceId ? selectedInvoiceId : selectedInvoice._id;
            const res = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/update/${invoiceId}`,
                payload,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );

            if (res.data?.success) {
                toast.success(res.data.message || "Payment details updated successfully!");
                handleClosePaymentModal();
                // Refresh invoices
                const response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                    {
                        companyId: selectedCompany,
                        invoiceType: "invoice",
                    },
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
                if (response.data?.success) {
                    setInvoices(response.data.serviceInvoices || []);
                }
            }

            if (balanceAmount && selectedInvoiceId) {
                setTimeout(() => {
                    handleSavePaymentDetails();
                }, 2000);
            }
        } catch (error) {
            console.error("Error updating payment details:", error);
            toast.error("Failed to update payment details");
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    // If employee data exists, show ID card
    if (employee) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
                {/* Employee ID Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                    {/* Card Header */}
                    <div className="text-center py-6 px-6 border-b border-blue-200">
                        <h1 className="text-4xl font-bold text-blue-600 mb-2">CORPCULTURE</h1>
                        <p className="text-sm text-gray-500 uppercase tracking-wider">
                            Employee Identification Card
                        </p>
                    </div>

                    {/* Card Body */}
                    <div className="px-6 py-6">
                        {/* Profile Section */}
                        <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-200">
                            {/* Profile Picture */}
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 rounded-lg border-4 border-blue-500 overflow-hidden bg-gray-100">
                                    {employee.image ? (
                                        <img
                                            src={employee.image}
                                            alt={employee.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-100">
                                            <span className="text-3xl font-bold text-blue-600">
                                                {employee.name?.charAt(0)?.toUpperCase() || "E"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Name and ID */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {employee.name}
                                </h2>
                                <p className="text-sm text-gray-600 mb-1">Designation</p>
                                {employee.designation && (
                                    <p className="text-base font-semibold text-gray-800 mb-3">
                                        {employee.designation}
                                    </p>
                                )}
                                {employee.idCradNo && (
                                    <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                                        <span className="text-sm font-bold text-blue-700">
                                            ID: {employee.idCradNo}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Department:</span>
                                <span className="font-bold text-gray-900">
                                    {getDepartmentName()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Type:</span>
                                <span className="font-bold text-gray-900">
                                    {employee.employeeType || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-bold text-gray-900">
                                    {employee.phone || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-bold text-gray-900 truncate max-w-xs text-right">
                                    {employee.email || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Pincode:</span>
                                <span className="font-bold text-gray-900">
                                    {employee.pincode || "N/A"}
                                </span>
                            </div>
                        </div>

                        {/* Footer Banner */}
                        <div
                            className="rounded-lg px-6 py-4 text-center text-white font-bold"
                            style={{
                                background:
                                    "linear-gradient(to right, #0ea5e9, #22c55e)",
                            }}
                        >
                            <p className="text-base mb-1">
                                This card is the property of Corpculture
                            </p>
                            <p className="text-xs font-normal opacity-90">
                                Valid until further notice
                            </p>
                        </div>
                    </div>
                </div>

                {/* Additional Details Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <span className="text-gray-600">Address:</span>
                            <span className="font-bold text-gray-900 text-right max-w-md">
                                {employee.address || "N/A"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Pincode:</span>
                            <span className="font-bold text-gray-900">
                                {employee.pincode || "N/A"}
                            </span>
                        </div>
                        {employee.salary && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Salary:</span>
                                <span className="font-bold text-blue-600 text-lg">
                                    ₹{employee.salary.toLocaleString("en-IN")}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Profile Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Edit Profile</h3>

                    {/* Name Edit */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="font-semibold text-lg text-gray-700">Name</div>
                            <button
                                className="text-sm text-blue-600 hover:underline font-medium"
                                onClick={handleProfile}
                            >
                                {!profile ? "Edit" : "Cancel"}
                            </button>
                        </div>
                        {profile ? (
                            <form
                                onSubmit={handleNameSubmit}
                                className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                            >
                                <div
                                    className={`border p-3 flex flex-col w-full sm:w-[220px] rounded-md transition-colors duration-200 ${nameInputFocused
                                            ? "border-blue-500"
                                            : "border-gray-300"
                                        }`}
                                >
                                    <label
                                        htmlFor="name"
                                        className="text-xs text-gray-500 font-medium mb-1"
                                    >
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onFocus={() => setNameInputFocused(true)}
                                        onBlur={() => setNameInputFocused(false)}
                                        className="text-sm text-gray-800 outline-none bg-transparent"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-auto px-6 py-2 rounded-md transition-colors duration-200"
                                >
                                    Save
                                </button>
                            </form>
                        ) : (
                            <div className="border p-3 w-full sm:w-[220px] min-h-[50px] text-gray-700 flex items-center rounded-md bg-gray-100">
                                {auth?.user?.name}
                            </div>
                        )}
                    </div>

                    {/* Email Edit */}
                    {/* <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="font-semibold text-lg text-gray-700">
                                Email Address
                            </div>
                            <button
                                className="text-sm text-blue-600 hover:underline font-medium"
                                onClick={handleEmail}
                            >
                                {!emailSection ? "Edit" : "Cancel"}
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            {emailSection ? (
                                <div
                                    className={`border p-3 flex flex-col w-full sm:w-[220px] rounded-md transition-colors duration-200 ${
                                        emailInputFocused
                                            ? "border-blue-500"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <label
                                        htmlFor="email"
                                        className="text-xs text-gray-500 font-medium mb-1"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setEmailInputFocused(true)}
                                        onBlur={() => setEmailInputFocused(false)}
                                        className="text-sm text-gray-800 outline-none bg-transparent"
                                        pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                                    />
                                </div>
                            ) : (
                                <div className="border p-3 w-full sm:w-[220px] text-gray-700 rounded-md bg-gray-100">
                                    {auth?.user?.email}
                                </div>
                            )}
                            {emailSection && (
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-auto px-6 py-2 rounded-md transition-colors duration-200"
                                    onClick={handleEmailSubmit}
                                >
                                    Save
                                </button>
                            )}
                        </div>
                    </div> */}

                    {/* Phone Edit */}
                    {/* <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="font-semibold text-lg text-gray-700">
                                Mobile Number
                            </div>
                            <button
                                className="text-sm text-blue-600 hover:underline font-medium"
                                onClick={handlePhone}
                            >
                                {!phoneSection ? "Edit" : "Cancel"}
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            {phoneSection ? (
                                <div
                                    className={`border p-3 flex flex-col w-full sm:w-[220px] rounded-md transition-colors duration-200 ${
                                        phoneInputFocused
                                            ? "border-blue-500"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <label
                                        htmlFor="phone"
                                        className="text-xs text-gray-500 font-medium mb-1"
                                    >
                                        Mobile Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        onFocus={() => setPhoneInputFocused(true)}
                                        onBlur={() => setPhoneInputFocused(false)}
                                        className="text-sm text-gray-800 outline-none bg-transparent"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        minLength="10"
                                        maxLength="10"
                                    />
                                </div>
                            ) : (
                                <div className="border p-3 w-full sm:w-[220px] text-gray-700 rounded-md bg-gray-100">
                                    {auth?.user?.phone}
                                </div>
                            )}
                            {phoneSection && (
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-auto px-6 py-2 rounded-md transition-colors duration-200"
                                    onClick={handlePhoneSubmit}
                                >
                                    Save
                                </button>
                            )}
                        </div>
                    </div> */}
                </div>

                {/* Payment Details Update Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">
                        Update Payment Details
                    </h3>

                    {/* Company Selector */}
                    <div className="mb-6">
                        <label
                            htmlFor="company-select"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Select Company
                        </label>
                        <Autocomplete
                            options={companies}
                            getOptionLabel={(option) => option.companyName || ''}
                            isOptionEqualToValue={(option, value) => option._id === value._id}
                            value={companies.find(c => c._id === selectedCompany) || null}
                            onChange={(event, newValue) => {
                                setSelectedCompany(newValue ? newValue._id : '');
                            }}
                            filterOptions={(options, { inputValue }) => {
                                if (!inputValue || inputValue.trim() === '') {
                                    return [];
                                }
                                return options.filter((option) =>
                                    option.companyName?.toLowerCase().includes(inputValue.toLowerCase())
                                );
                            }}
                            noOptionsText="No companies found"
                            openOnFocus={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Search Company"
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </div>

                    {/* Invoices Table */}
                    {selectedCompany && (
                        <div className="mt-6">
                            {loadingInvoices ? (
                                <div className="text-center py-8 text-gray-600">
                                    Loading invoices...
                                </div>
                            ) : invoices.length === 0 ? (
                                <div className="text-center py-8 text-gray-600">
                                    No invoices found for this company.
                                </div>
                            ) : (
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Invoice Number</TableCell>
                                                <TableCell>Company</TableCell>
                                                <TableCell>Payment Mode</TableCell>
                                                <TableCell align="right">Grand Total</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Invoice Date</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {invoices.map((invoice) => (
                                                <TableRow key={invoice._id}>
                                                    <TableCell>
                                                        {invoice.invoiceNumber || "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {invoice.companyId?.companyName || "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {invoice.modeOfPayment || "N/A"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        ₹{Number(invoice.grandTotal).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={invoice.status}
                                                            size="small"
                                                            color={
                                                                invoice.status === "Paid"
                                                                    ? "success"
                                                                    : invoice.status === "Unpaid"
                                                                        ? "error"
                                                                        : "warning"
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(
                                                            invoice.invoiceDate
                                                        ).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {!invoice?.tdsAmount && (
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() =>
                                                                    handleOpenPaymentModal(invoice)
                                                                }
                                                            >
                                                                Update Payment
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </div>
                    )}

                    {/* Payment Details Modal */}
                    <Dialog
                        open={openPaymentModal}
                        onClose={handleClosePaymentModal}
                        maxWidth="md"
                        fullWidth
                    >
                        <DialogTitle>
                            Payment Details (₹{selectedInvoice?.grandTotal || 0})
                        </DialogTitle>
                        <DialogContent>
                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="mode-of-payment-label">
                                    Mode Of Payment
                                </InputLabel>
                                <Select
                                    labelId="mode-of-payment-label"
                                    id="modeOfPayment"
                                    name="modeOfPayment"
                                    value={paymentForm.modeOfPayment}
                                    onChange={handlePaymentFormChange}
                                    label="Mode Of Payment"
                                >
                                    <MenuItem value="">--select Payment Mode--</MenuItem>
                                    <MenuItem value="CHEQUE">CHEQUE</MenuItem>
                                    <MenuItem value="BANK TRANSFER">BANK TRANSFER</MenuItem>
                                    <MenuItem value="CASH">CASH</MenuItem>
                                    <MenuItem value="OTHERS">OTHERS</MenuItem>
                                    <MenuItem value="UPI">UPI</MenuItem>
                                </Select>
                            </FormControl>

                            {paymentForm.modeOfPayment === "CHEQUE" && (
                                <>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Cheque Number"
                                        name="transactionDetails"
                                        value={paymentForm.transactionDetails}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Cheque Date"
                                        name="chequeDate"
                                        type="date"
                                        value={paymentForm.chequeDate}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Bank Name"
                                        name="bankName"
                                        value={paymentForm.bankName}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Company Name"
                                        name="companyNamePayment"
                                        value={paymentForm.companyNamePayment}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                </>
                            )}

                            {paymentForm.modeOfPayment === "BANK TRANSFER" && (
                                <>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Transaction ID"
                                        name="transactionDetails"
                                        value={paymentForm.transactionDetails}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Transfer Date"
                                        name="transferDate"
                                        type="date"
                                        value={paymentForm.transferDate}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Bank Name"
                                        name="bankName"
                                        value={paymentForm.bankName}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Company Name"
                                        name="companyNamePayment"
                                        value={paymentForm.companyNamePayment}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                </>
                            )}

                            {paymentForm.modeOfPayment === "UPI" && (
                                <>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="UPI ID"
                                        name="transactionDetails"
                                        value={paymentForm.transactionDetails}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Company Name"
                                        name="companyNamePayment"
                                        value={paymentForm.companyNamePayment}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Transfer Date"
                                        name="transferDate"
                                        type="date"
                                        value={paymentForm.transferDate}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </>
                            )}

                            {paymentForm.modeOfPayment === "OTHERS" && (
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Other Payment Mode"
                                    name="otherPaymentMode"
                                    value={paymentForm.otherPaymentMode}
                                    onChange={handlePaymentFormChange}
                                    size="small"
                                />
                            )}

                            <TextField
                                fullWidth
                                margin="normal"
                                label="Amount"
                                name="paymentAmount"
                                type="number"
                                value={paymentForm.paymentAmount}
                                onChange={handlePaymentFormChange}
                                size="small"
                            />

                            {companyPendingInvoice?.length > 0 && balanceAmount > 0 && (
                                <>
                                    <p className="mt-4 text-sm text-gray-600">
                                        Previous Invoice Balance - ₹{balanceAmount.toFixed(2)}
                                    </p>
                                    <FormControl fullWidth margin="normal" size="small">
                                        <InputLabel id="pending-invoice-label">
                                            Select Pending Invoice
                                        </InputLabel>
                                        <Select
                                            labelId="pending-invoice-label"
                                            id="selectedInvoiceId"
                                            name="selectedInvoiceId"
                                            value={selectedInvoiceId}
                                            onChange={(e) =>
                                                setSelectedInvoiceId(e.target.value)
                                            }
                                            label="Select Pending Invoice"
                                        >
                                            <MenuItem value="">--select Invoice--</MenuItem>
                                            {companyPendingInvoice
                                                ?.filter(
                                                    (pendingInv) =>
                                                        pendingInv._id !== selectedInvoice?._id
                                                )
                                                .map((pendingInv) => (
                                                    <MenuItem
                                                        key={pendingInv._id}
                                                        value={pendingInv._id}
                                                    >
                                                        {new Date(
                                                            pendingInv.invoiceDate
                                                        ).toLocaleDateString() +
                                                            " - ₹" +
                                                            pendingInv?.grandTotal}
                                                    </MenuItem>
                                                ))}
                                        </Select>
                                    </FormControl>
                                </>
                            )}

                            {pendingAmount > 0 && (
                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel id="payment-amount-type-label">
                                        Amount Type
                                    </InputLabel>
                                    <Select
                                        labelId="payment-amount-type-label"
                                        id="paymentAmountType"
                                        name="paymentAmountType"
                                        value={paymentForm.paymentAmountType}
                                        onChange={handlePaymentFormChange}
                                        label="Amount Type"
                                    >
                                        <MenuItem value="">--select Amount Type--</MenuItem>
                                        <MenuItem value="TDS">TDS Amount</MenuItem>
                                        <MenuItem value="Pending">Pending Amount</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClosePaymentModal} color="primary">
                                Close
                            </Button>
                            <Button
                                onClick={handleSavePaymentDetails}
                                color="primary"
                                variant="contained"
                            >
                                Save changes
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>

                {/* Account Information Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">
                        Account Information
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600 font-medium">Bank Name:</span>
                            <span className="font-bold text-gray-900">HDFC BANK</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600 font-medium">A/C NO:</span>
                            <span className="font-bold text-gray-900">50200041713896</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600 font-medium">A/C Name:</span>
                            <span className="font-bold text-gray-900">CORPCULTURE</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600 font-medium">IFSC Code:</span>
                            <span className="font-bold text-gray-900">HDFC0000492</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Branch:</span>
                            <span className="font-bold text-gray-900">Kilpauk</span>
                        </div>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8 flex justify-center">
                    <img src={qrCode} alt="QR Code" className="w-52 h-52 object-fit" />
                </div>
            </div>
        );
    }

    // Fallback: Show regular profile if no employee data
    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">My Profile</h2>
            <div className="w-full flex flex-col items-start gap-8">
                <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="font-semibold text-lg text-gray-700">
                            Personal Information
                        </div>
                        <button
                            className="text-sm text-blue-600 hover:underline font-medium"
                            onClick={handleProfile}
                        >
                            {!profile ? "Edit" : "Cancel"}
                        </button>
                    </div>
                    <div className="min-h-[50px]">
                        {profile ? (
                            <form
                                onSubmit={handleNameSubmit}
                                className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center"
                            >
                                <div
                                    className={`border p-3 flex flex-col w-full sm:w-[220px] rounded-md transition-colors duration-200 ${nameInputFocused
                                            ? "border-blue-500"
                                            : "border-gray-300"
                                        }`}
                                >
                                    <label
                                        htmlFor="name"
                                        className="text-xs text-gray-500 font-medium mb-1"
                                    >
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onFocus={() => setNameInputFocused(true)}
                                        onBlur={() => setNameInputFocused(false)}
                                        className="text-sm text-gray-800 outline-none bg-transparent"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-auto px-6 py-2 rounded-md transition-colors duration-200"
                                >
                                    Save
                                </button>
                            </form>
                        ) : (
                            <div className="border p-3 w-full sm:w-[220px] min-h-[50px] text-gray-700 flex items-center rounded-md bg-gray-100">
                                {auth?.user?.name}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="font-semibold text-lg text-gray-700">Email Address</div>
                        <button
                            className="text-sm text-blue-600 hover:underline font-medium"
                            onClick={handleEmail}
                        >
                            {!emailSection ? "Edit" : "Cancel"}
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                        {emailSection ? (
                            <div
                                className={`border p-3 flex flex-col w-full sm:w-[220px] rounded-md transition-colors duration-200 ${emailInputFocused ? "border-blue-500" : "border-gray-300"
                                    }`}
                            >
                                <label
                                    htmlFor="email"
                                    className="text-xs text-gray-500 font-medium mb-1"
                                >
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onFocus={() => setEmailInputFocused(true)}
                                    onBlur={() => setEmailInputFocused(false)}
                                    className="text-sm text-gray-800 outline-none bg-transparent"
                                    pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                                />
                            </div>
                        ) : (
                            <div className="border p-3 w-full sm:w-[220px] text-gray-700 rounded-md bg-gray-100">
                                {auth?.user?.email}
                            </div>
                        )}

                        {emailSection && (
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-auto px-6 py-2 rounded-md transition-colors duration-200"
                                onClick={handleEmailSubmit}
                            >
                                Save
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="font-semibold text-lg text-gray-700">Mobile Number</div>
                        <button
                            className="text-sm text-blue-600 hover:underline font-medium"
                            onClick={handlePhone}
                        >
                            {!phoneSection ? "Edit" : "Cancel"}
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                        {phoneSection ? (
                            <div
                                className={`border p-3 flex flex-col w-full sm:w-[220px] rounded-md transition-colors duration-200 ${phoneInputFocused ? "border-blue-500" : "border-gray-300"
                                    }`}
                            >
                                <label
                                    htmlFor="phone"
                                    className="text-xs text-gray-500 font-medium mb-1"
                                >
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    onFocus={() => setPhoneInputFocused(true)}
                                    onBlur={() => setPhoneInputFocused(false)}
                                    className="text-sm text-gray-800 outline-none bg-transparent"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    minLength="10"
                                    maxLength="10"
                                />
                            </div>
                        ) : (
                            <div className="border p-3 w-full sm:w-[220px] text-gray-700 rounded-md bg-gray-100">
                                {auth?.user?.phone}
                            </div>
                        )}

                        {phoneSection && (
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-auto px-6 py-2 rounded-md transition-colors duration-200"
                                onClick={handlePhoneSubmit}
                            >
                                Save
                            </button>
                        )}
                    </div>
                </div>

                {/* Payment Details Update Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8 w-full">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">
                        Update Payment Details
                    </h3>

                    {/* Company Selector */}
                    <div className="mb-6">
                        <label
                            htmlFor="company-select-fallback"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Select Company
                        </label>
                        <Autocomplete
                            options={companies}
                            getOptionLabel={(option) => option.companyName || ''}
                            isOptionEqualToValue={(option, value) => option._id === value._id}
                            value={companies.find(c => c._id === selectedCompany) || null}
                            onChange={(event, newValue) => {
                                setSelectedCompany(newValue ? newValue._id : '');
                            }}
                            filterOptions={(options, { inputValue }) => {
                                return options.filter((option) =>
                                    option.companyName?.toLowerCase().includes(inputValue.toLowerCase())
                                );
                            }}
                            noOptionsText="No companies found"
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Search Company"
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </div>

                    {/* Invoices Table */}
                    {selectedCompany && (
                        <div className="mt-6">
                            {loadingInvoices ? (
                                <div className="text-center py-8 text-gray-600">
                                    Loading invoices...
                                </div>
                            ) : invoices.length === 0 ? (
                                <div className="text-center py-8 text-gray-600">
                                    No invoices found for this company.
                                </div>
                            ) : (
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Invoice Number</TableCell>
                                                <TableCell>Company</TableCell>
                                                <TableCell>Payment Mode</TableCell>
                                                <TableCell align="right">Grand Total</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Invoice Date</TableCell>
                                                <TableCell>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {invoices.map((invoice) => (
                                                <TableRow key={invoice._id}>
                                                    <TableCell>
                                                        {invoice.invoiceNumber || "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {invoice.companyId?.companyName || "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {invoice.modeOfPayment || "N/A"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        ₹{Number(invoice.grandTotal).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={invoice.status}
                                                            size="small"
                                                            color={
                                                                invoice.status === "Paid"
                                                                    ? "success"
                                                                    : invoice.status === "Unpaid"
                                                                        ? "error"
                                                                        : "warning"
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(
                                                            invoice.invoiceDate
                                                        ).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {!invoice?.tdsAmount && (
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() =>
                                                                    handleOpenPaymentModal(invoice)
                                                                }
                                                            >
                                                                Update Payment
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </div>
                    )}

                    {/* Payment Details Modal */}
                    <Dialog
                        open={openPaymentModal}
                        onClose={handleClosePaymentModal}
                        maxWidth="md"
                        fullWidth
                    >
                        <DialogTitle>
                            Payment Details (₹{selectedInvoice?.grandTotal || 0})
                        </DialogTitle>
                        <DialogContent>
                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="mode-of-payment-label">
                                    Mode Of Payment
                                </InputLabel>
                                <Select
                                    labelId="mode-of-payment-label"
                                    id="modeOfPayment"
                                    name="modeOfPayment"
                                    value={paymentForm.modeOfPayment}
                                    onChange={handlePaymentFormChange}
                                    label="Mode Of Payment"
                                >
                                    <MenuItem value="">--select Payment Mode--</MenuItem>
                                    <MenuItem value="CHEQUE">CHEQUE</MenuItem>
                                    <MenuItem value="BANK TRANSFER">BANK TRANSFER</MenuItem>
                                    <MenuItem value="CASH">CASH</MenuItem>
                                    <MenuItem value="OTHERS">OTHERS</MenuItem>
                                    <MenuItem value="UPI">UPI</MenuItem>
                                </Select>
                            </FormControl>

                            {paymentForm.modeOfPayment === "CHEQUE" && (
                                <>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Cheque Number"
                                        name="transactionDetails"
                                        value={paymentForm.transactionDetails}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Cheque Date"
                                        name="chequeDate"
                                        type="date"
                                        value={paymentForm.chequeDate}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Bank Name"
                                        name="bankName"
                                        value={paymentForm.bankName}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Company Name"
                                        name="companyNamePayment"
                                        value={paymentForm.companyNamePayment}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                </>
                            )}

                            {paymentForm.modeOfPayment === "BANK TRANSFER" && (
                                <>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Transaction ID"
                                        name="transactionDetails"
                                        value={paymentForm.transactionDetails}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Transfer Date"
                                        name="transferDate"
                                        type="date"
                                        value={paymentForm.transferDate}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Bank Name"
                                        name="bankName"
                                        value={paymentForm.bankName}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Company Name"
                                        name="companyNamePayment"
                                        value={paymentForm.companyNamePayment}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                </>
                            )}

                            {paymentForm.modeOfPayment === "UPI" && (
                                <>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="UPI ID"
                                        name="transactionDetails"
                                        value={paymentForm.transactionDetails}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Company Name"
                                        name="companyNamePayment"
                                        value={paymentForm.companyNamePayment}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Transfer Date"
                                        name="transferDate"
                                        type="date"
                                        value={paymentForm.transferDate}
                                        onChange={handlePaymentFormChange}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </>
                            )}

                            {paymentForm.modeOfPayment === "OTHERS" && (
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Other Payment Mode"
                                    name="otherPaymentMode"
                                    value={paymentForm.otherPaymentMode}
                                    onChange={handlePaymentFormChange}
                                    size="small"
                                />
                            )}

                            <TextField
                                fullWidth
                                margin="normal"
                                label="Amount"
                                name="paymentAmount"
                                type="number"
                                value={paymentForm.paymentAmount}
                                onChange={handlePaymentFormChange}
                                size="small"
                            />

                            {companyPendingInvoice?.length > 0 && balanceAmount > 0 && (
                                <>
                                    <p className="mt-4 text-sm text-gray-600">
                                        Previous Invoice Balance - ₹{balanceAmount.toFixed(2)}
                                    </p>
                                    <FormControl fullWidth margin="normal" size="small">
                                        <InputLabel id="pending-invoice-label">
                                            Select Pending Invoice
                                        </InputLabel>
                                        <Select
                                            labelId="pending-invoice-label"
                                            id="selectedInvoiceId"
                                            name="selectedInvoiceId"
                                            value={selectedInvoiceId}
                                            onChange={(e) =>
                                                setSelectedInvoiceId(e.target.value)
                                            }
                                            label="Select Pending Invoice"
                                        >
                                            <MenuItem value="">--select Invoice--</MenuItem>
                                            {companyPendingInvoice
                                                ?.filter(
                                                    (pendingInv) =>
                                                        pendingInv._id !== selectedInvoice?._id
                                                )
                                                .map((pendingInv) => (
                                                    <MenuItem
                                                        key={pendingInv._id}
                                                        value={pendingInv._id}
                                                    >
                                                        {new Date(
                                                            pendingInv.invoiceDate
                                                        ).toLocaleDateString() +
                                                            " - ₹" +
                                                            pendingInv?.grandTotal}
                                                    </MenuItem>
                                                ))}
                                        </Select>
                                    </FormControl>
                                </>
                            )}

                            {pendingAmount > 0 && (
                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel id="payment-amount-type-label">
                                        Amount Type
                                    </InputLabel>
                                    <Select
                                        labelId="payment-amount-type-label"
                                        id="paymentAmountType"
                                        name="paymentAmountType"
                                        value={paymentForm.paymentAmountType}
                                        onChange={handlePaymentFormChange}
                                        label="Amount Type"
                                    >
                                        <MenuItem value="">--select Amount Type--</MenuItem>
                                        <MenuItem value="TDS">TDS Amount</MenuItem>
                                        <MenuItem value="Pending">Pending Amount</MenuItem>
                                    </Select>
                                </FormControl>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClosePaymentModal} color="primary">
                                Close
                            </Button>
                            <Button
                                onClick={handleSavePaymentDetails}
                                color="primary"
                                variant="contained"
                            >
                                Save changes
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
                
                {/* Account Information Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8 w-full">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">
                        Account Information
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600 font-medium">Bank Name:</span>
                            <span className="font-bold text-gray-900">HDFC BANK</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600 font-medium">A/C NO:</span>
                            <span className="font-bold text-gray-900">50200041713896</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600 font-medium">A/C Name:</span>
                            <span className="font-bold text-gray-900">CORPCULTURE</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-gray-600 font-medium">IFSC Code:</span>
                            <span className="font-bold text-gray-900">HDFC0000492</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Branch:</span>
                            <span className="font-bold text-gray-900">Kilpauk</span>
                        </div>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-8 w-full flex justify-center">
                    <img src={qrCode} alt="QR Code" className="w-52 h-52 object-fit" />
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
