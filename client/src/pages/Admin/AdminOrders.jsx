import { useEffect, useMemo, useState } from "react";
// import OrderItem from "./OrderItem"; // We will refactor to use a table directly
import SearchIcon from "@mui/icons-material/Search";
import Spinner from "../../components/Spinner";
import axios from "axios";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";
import { Link } from "react-router-dom"; // Import Link for navigation
import { TablePagination } from "@mui/material";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const INVOICE_WEBHOOK_URL =
    "https://n8n.nicknameinfo.net/webhook/cbb63555-0bcc-4a74-bdde-36a995ac303a";

/** Public R2 URL for order PDF: {base}/{orderId}.pdf — set VITE_ORDER_INVOICE_R2_BASE in .env */
const getOrderInvoicePdfUrl = (orderId) => {
    const base = (
        import.meta.env.VITE_ORDER_INVOICE_R2_BASE ||
        "https://pub-d7041e72c8d44c0b8c69743a057d0b36.r2.dev"
    ).replace(/\/$/, "");
    const id = String(orderId || "").trim();
    return `${base}/${encodeURIComponent(id)}.pdf`;
};

/** HEAD: PDF already on R2 (some buckets may not support HEAD — returns false → webhook runs) */
const invoicePdfExistsOnR2 = async (pdfUrl) => {
    try {
        const r = await axios.head(pdfUrl, {
            timeout: 20000,
            validateStatus: (s) => s === 200,
        });
        return r.status === 200;
    } catch {
        return false;
    }
};

/**
 * Download PDF via GET blob. If CORS blocks the admin site, opens the URL in a new tab instead.
 * @returns {Promise<boolean>} true if file was saved via blob download
 */
const downloadPdfFromPublicUrl = async (pdfUrl, filename) => {
    try {
        const response = await axios.get(pdfUrl, {
            responseType: "blob",
            timeout: 120000,
        });
        const blob = new Blob([response.data], {
            type: response.headers["content-type"] || "application/pdf",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "invoice.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return true;
    } catch {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
        return false;
    }
};

/** After webhook uploads, wait until R2 serves the PDF then download */
const waitForR2InvoiceAndDownload = async (orderId, maxAttempts = 12, delayMs = 1500) => {
    const pdfUrl = getOrderInvoicePdfUrl(orderId);
    const filename = `invoice-${orderId}.pdf`;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
            await new Promise((r) => setTimeout(r, delayMs));
        }
        const exists = await invoicePdfExistsOnR2(pdfUrl);
        if (exists) {
            await downloadPdfFromPublicUrl(pdfUrl, filename);
            return true;
        }
    }
    return false;
};

const AdminOrders = () => {
    const { auth, userPermissions } = useAuth();
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    // State to track selected order IDs for assignment
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [employees, setEmployees] = useState([]); // State to store employees
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(""); // State for selected employee
    const [refetchOrders, setRefetchOrders] = useState(false);
    // Pagination and filter states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [buyerNameFilter, setBuyerNameFilter] = useState("");
    const [employeeIdFilter, setEmployeeIdFilter] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("");
    /** `${orderId}-send` | `${orderId}-download` while webhook is in progress */
    const [invoiceLoadingKey, setInvoiceLoadingKey] = useState(null);
    const [exportingProductsExcel, setExportingProductsExcel] = useState(false);

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    /** Backend stores employeeType as string[] e.g. ['Sales']; strict === 'Sales' never matches */
    const hasEmployeeType = (employee, type) => {
        if (!employee?.employeeType) return false;
        const et = employee.employeeType;
        return Array.isArray(et) ? et.includes(type) : et === type;
    };

    const salesEmployees = (employees || []).filter((e) => hasEmployeeType(e, "Sales"));

    const isEmployee = Number(auth?.user?.role) === 3;
    const myEmployeeId = useMemo(() => {
        if (!isEmployee) return "";
        const myUserId = String(auth?.user?._id || "");
        const match = (employees || []).find((e) => {
            const eid = e?.userId?._id || e?.userId;
            return String(eid || "") === myUserId;
        });
        return match?._id || "";
    }, [isEmployee, auth?.user?._id, employees]);

    useEffect(() => {
        // Force filter to logged-in employee for role 3
        if (isEmployee && myEmployeeId && employeeIdFilter !== myEmployeeId) {
            setEmployeeIdFilter(myEmployeeId);
            setPage(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEmployee, myEmployeeId]);

    useEffect(() => {
        if (auth?.token) {
            fetchOrders();
        } else {
            setOrders([]); // Clear orders if no token
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.token, refetchOrders, page, rowsPerPage, employees?.length]); // ensure employee mapping is available

    // Fetch employees
    useEffect(() => {
        if (auth?.token) {
            fetchEmployees();
        } else {
            setEmployees([]); // Clear employees if no token
        }
    }, [auth?.token]); // Re-run effect if auth token changes


    // fetch orders from server
    const fetchOrders = async (overrideFilters = {}) => {
        try {
            setLoading(true);
            const currentSearch = overrideFilters.search !== undefined ? overrideFilters.search : search;
            const currentFromDate = overrideFilters.fromDate !== undefined ? overrideFilters.fromDate : fromDate;
            const currentToDate = overrideFilters.toDate !== undefined ? overrideFilters.toDate : toDate;
            const currentBuyerName = overrideFilters.buyerNameFilter !== undefined ? overrideFilters.buyerNameFilter : buyerNameFilter;
            const currentEmployeeId = overrideFilters.employeeIdFilter !== undefined ? overrideFilters.employeeIdFilter : employeeIdFilter;
            const currentOrderStatus = overrideFilters.orderStatusFilter !== undefined ? overrideFilters.orderStatusFilter : orderStatusFilter;
            const currentPage = overrideFilters.page !== undefined ? overrideFilters.page : page;
            const currentRowsPerPage = overrideFilters.rowsPerPage !== undefined ? overrideFilters.rowsPerPage : rowsPerPage;

            const queryParams = new URLSearchParams({
                search: currentSearch || "",
                fromDate: currentFromDate || "",
                toDate: currentToDate || "",
                buyerName: currentBuyerName || "",
                // Employees should only see orders assigned to them
                employeeId: isEmployee ? myEmployeeId : (currentEmployeeId || ""),
                orderStatus: currentOrderStatus || "",
                page: currentPage + 1, // Backend expects 1-indexed page
                limit: currentRowsPerPage,
            }).toString();

            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/user/admin-orders?${queryParams}`,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            if (response?.data?.orders) {
                setOrders(response.data.orders);
                setTotalCount(response.data.totalCount || 0);
                setLoading(false);
            } else {
                setOrders([]); // Ensure orders is an array even if response is empty
                setTotalCount(0);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            setLoading(false);
            // Handle error display if needed
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            const list = response.data?.employees ?? response.data?.data ?? [];
            setEmployees(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error("Error fetching employees:", error);
            setEmployees([]);
        }
    };

    // Handle order selection
    const handleOrderSelect = (orderId) => {
        setSelectedOrderIds(prevSelected =>
            prevSelected.includes(orderId)
                ? prevSelected.filter(id => id !== orderId) // Deselect
                : [...prevSelected, orderId] // Select
        );
    };

    // Handle assignment button click (Placeholder)
    const buildInvoiceWebhookPayload = (order, action) => ({
        action,
        orderId: order._id,
        /** Where n8n should upload the generated PDF (same pattern as UI download) */
        invoicePdfUrl: getOrderInvoicePdfUrl(order._id),
        order: {
            _id: order._id,
            orderStatus: order.orderStatus,
            amount: order.amount,
            createdAt: order.createdAt,
            products: order.products,
            employeeId: order.employeeId?._id,
            employeeName: order.employeeId?.name,
            buyer: order.buyer || order.userId || null,
        },
    });

    const handleSendInvoice = async (order) => {
        const key = `${order._id}-send`;
        setInvoiceLoadingKey(key);
        try {
            await axios.post(
                INVOICE_WEBHOOK_URL,
                buildInvoiceWebhookPayload(order, "send_invoice"),
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 120000,
                }
            );
            toast.success("Invoice send requested successfully.");
        } catch (error) {
            console.error("Send invoice webhook error:", error);
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Failed to send invoice."
            );
        } finally {
            setInvoiceLoadingKey(null);
        }
    };

    /**
     * 1) If PDF already on R2 → download directly.
     * 2) Else → POST webhook to generate + upload to R2, then poll R2 and download when ready.
     */
    const handleDownloadInvoice = async (order) => {
        const key = `${order._id}-download`;
        const pdfUrl = getOrderInvoicePdfUrl(order._id);
        const filename = `invoice-${order._id}.pdf`;

        setInvoiceLoadingKey(key);
        try {
            const alreadyThere = await invoicePdfExistsOnR2(pdfUrl);
            if (alreadyThere) {
                const saved = await downloadPdfFromPublicUrl(pdfUrl, filename);
                toast.success(
                    saved ? "Invoice downloaded from cloud." : "Opened invoice in a new tab (CORS)."
                );
                return;
            }

            toast.loading("Generating invoice and uploading to cloud…", { id: "inv-dl" });
            await axios.post(
                INVOICE_WEBHOOK_URL,
                buildInvoiceWebhookPayload(order, "download_invoice"),
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 120000,
                }
            );
            toast.dismiss("inv-dl");
            toast.loading("Waiting for file on cloud…", { id: "inv-wait" });

            const ok = await waitForR2InvoiceAndDownload(order._id);
            toast.dismiss("inv-wait");

            if (ok) {
                toast.success("Invoice downloaded.");
                return;
            }

            toast.error(
                "Invoice not detected on cloud yet. Open the link to check, or try again shortly."
            );
            window.open(pdfUrl, "_blank", "noopener,noreferrer");
        } catch (error) {
            toast.dismiss("inv-dl");
            toast.dismiss("inv-wait");
            console.error("Download invoice error:", error);
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Failed to download invoice."
            );
        } finally {
            setInvoiceLoadingKey(null);
        }
    };

    const handleAssignOrders = async () => {
        if (selectedOrderIds.length === 0) {
            alert("Please select at least one order to assign.");
            return;
        }
        if (!selectedEmployeeId) {
            alert("Please select an employee.");
            return;
        }

        // *** Implement backend API call to assign orders to the employee ***
        // Example:
        try {
            const response = await axios.patch(
                `${import.meta.env.VITE_SERVER_URL
                }/api/v1/user/update/aassign-orders`,
                {
                    orderId: selectedOrderIds,
                    employeeId: selectedEmployeeId,
                },
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            console.log("Assignment successful:", response.data);
            alert("Orders assigned successfully!");
            // Optionally, clear selected orders and refetch orders/employees
            setSelectedOrderIds([]);
            setRefetchOrders(prev => !prev); // Toggle to trigger refetch
        } catch (error) {
            console.error("Error assigning orders:", error);
            alert("Failed to assign orders.");
        }
    };


    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when changing rows per page
    };

    const handleApplyFilters = () => {
        setPage(0); // Reset to first page when applying new filters
        fetchOrders(); // Fetch with current filter values
    };

    const handleClearFilters = () => {
        setSearch("");
        setFromDate("");
        setToDate("");
        setBuyerNameFilter("");
        setEmployeeIdFilter("");
        setOrderStatusFilter("");
        setPage(0);
        // Fetch immediately with cleared filters
        fetchOrders({
            search: "",
            fromDate: "",
            toDate: "",
            buyerNameFilter: "",
            employeeIdFilter: "",
            orderStatusFilter: "",
            page: 0,
            rowsPerPage: rowsPerPage
        });
    };

    /** Query string for admin-orders (1-based page) — same filters as the table */
    const buildAdminOrdersQueryString = (pageNum, limitNum) =>
        new URLSearchParams({
            search: search || "",
            fromDate: fromDate || "",
            toDate: toDate || "",
            buyerName: buyerNameFilter || "",
            employeeId: employeeIdFilter || "",
            orderStatus: orderStatusFilter || "",
            page: String(pageNum),
            limit: String(limitNum),
        }).toString();

    /** Fetch all orders matching current filters (batched), flatten products → Excel rows */
    const handleDownloadOverallProductsExcel = async () => {
        if (!auth?.token) {
            toast.error("Please sign in again.");
            return;
        }
        setExportingProductsExcel(true);
        const batchSize = 500;
        const allOrders = [];
        try {
            let pageNum = 1;
            let totalCount = 0;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const qs = buildAdminOrdersQueryString(pageNum, batchSize);
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/user/admin-orders?${qs}`,
                    { headers: { Authorization: auth.token }, timeout: 120000 }
                );
                const batch = response.data?.orders || [];
                totalCount = response.data?.totalCount ?? 0;
                allOrders.push(...batch);
                if (batch.length < batchSize || allOrders.length >= totalCount) break;
                pageNum += 1;
            }

            if (allOrders.length === 0) {
                toast.error("No orders to export for the current filters.");
                return;
            }

            const rows = [];
            for (const order of allOrders) {
                const buyerName = order.buyer?.name ?? "";
                const empName = order.employeeId?.name ?? "";
                const ship = order.shippingInfo;
                const shippingAddress = ship
                    ? [ship.address, ship.city, ship.state, ship.pincode, ship.country]
                          .filter(Boolean)
                          .join(", ")
                    : "";
                const orderDate = order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : "";
                const products = order.products || [];

                if (products.length === 0) {
                    rows.push({
                        "Order ID": String(order._id),
                        "Order Date": orderDate,
                        "Order Status": order.orderStatus ?? "",
                        "Order Amount": order.amount ?? "",
                        "Buyer Name": buyerName,
                        "Assigned Employee": empName,
                        "Shipping Address": shippingAddress,
                        "Product Name": "",
                        Brand: "",
                        "Product ID": "",
                        Qty: "",
                        "Unit Price": "",
                        "Line Total": "",
                    });
                    continue;
                }

                for (const p of products) {
                    const qty = Number(p.quantity) || 1;
                    const hasDiscount =
                        p.discountPrice != null && p.discountPrice !== "";
                    const unit = Number(
                        hasDiscount ? p.discountPrice : p.price ?? 0
                    );
                    const lineTotal = qty * unit;
                    rows.push({
                        "Order ID": String(order._id),
                        "Order Date": orderDate,
                        "Order Status": order.orderStatus ?? "",
                        "Order Amount": order.amount ?? "",
                        "Buyer Name": buyerName,
                        "Assigned Employee": empName,
                        "Shipping Address": shippingAddress,
                        "Product Name": p.name ?? "",
                        Brand: p.brandName ?? "",
                        "Product ID": p.productId ?? "",
                        Qty: qty,
                        "Unit Price": unit,
                        "Line Total": lineTotal,
                    });
                }
            }

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Overall Products");
            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], {
                type: "application/octet-stream",
            });
            const stamp = new Date().toISOString().slice(0, 10);
            saveAs(blob, `admin_orders_overall_products_${stamp}.xlsx`);
            toast.success(
                `Downloaded ${rows.length} product line(s) from ${allOrders.length} order(s).`
            );
        } catch (error) {
            console.error("Excel export error:", error);
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Failed to export Excel."
            );
        } finally {
            setExportingProductsExcel(false);
        }
    };

    return (
        <>
            <SeoData title="Admin Orders | Flipkart" />

            <main className="w-full px-4 sm:px-10 py-4 ">
                {/* <!-- row --> */}
                {/* <!-- orders column --> */}
                <div className="flex gap-3.5 w-full ">
                    {loading ? (
                        <Spinner />
                    ) : (
                        <div className="flex flex-col gap-3 w-full pb-5 overflow-hidden">
                            {/* <!-- searchbar and filters --> */}
                            <div className="flex flex-col gap-4 mb-4">
                                <form
                                    className="flex items-center justify-between mx-auto w-full sm:w-10/12 bg-white border border-[#019ee3] rounded-2xl shadow hover:shadow-lg transition"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleApplyFilters();
                                    }}
                                >
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        type="search"
                                        name="search"
                                        placeholder="Search orders by ID, Customer, Address..."
                                        className="p-3 text-sm outline-none flex-1 rounded-l-2xl bg-[#f7fafd]"
                                    />
                                    <button
                                        type="submit"
                                        className="h-full text-sm px-4 py-3 text-white bg-gradient-to-r from-[#019ee3] to-[#afcb09] rounded-r-2xl flex items-center gap-2 font-semibold hover:from-[#afcb09] hover:to-[#019ee3] transition"
                                    >
                                        <SearchIcon sx={{ fontSize: "20px" }} />
                                        <span className="text-xs sm:text-sm">Search</span>
                                    </button>
                                </form> 
                                
                                {/* Advanced Filters */}
                                <div className="bg-white border border-[#019ee3] rounded-2xl shadow p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                            <input
                                                type="date"
                                                value={fromDate}
                                                onChange={(e) => setFromDate(e.target.value)}
                                                className="w-full p-2 border rounded-md text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                            <input
                                                type="date"
                                                value={toDate}
                                                onChange={(e) => setToDate(e.target.value)}
                                                className="w-full p-2 border rounded-md text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                                            <input
                                                type="text"
                                                value={buyerNameFilter}
                                                onChange={(e) => setBuyerNameFilter(e.target.value)}
                                                placeholder="Filter by buyer name"
                                                className="w-full p-2 border rounded-md text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                            <select
                                                value={employeeIdFilter}
                                                onChange={(e) => setEmployeeIdFilter(e.target.value)}
                                                className="w-full p-2 border rounded-md text-sm"
                                                disabled={isEmployee}
                                            >
                                                {!isEmployee && <option value="">All Employees</option>}
                                                {salesEmployees.map((employee) => (
                                                    <option key={employee._id} value={employee._id}>
                                                        {employee.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                                            <select
                                                value={orderStatusFilter}
                                                onChange={(e) => setOrderStatusFilter(e.target.value)}
                                                className="w-full p-2 border rounded-md text-sm"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleApplyFilters}
                                            className="px-4 py-2 bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white rounded-md font-semibold hover:from-[#afcb09] hover:to-[#019ee3] transition"
                                        >
                                            Apply Filters
                                        </button>
                                        <button
                                            onClick={handleClearFilters}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* <!-- search bar and filters --> */}

                            {/* OVERALL PRODUCTS — Excel export (respects current filters) */}
                            {hasPermission("salesOrders") ? (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gradient-to-r from-[#e6fbff] to-[#f0fff4] border border-[#019ee3] rounded-2xl shadow">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-800">
                                            OVERALL PRODUCTS
                                        </h3>
                                        <p className="text-xs text-gray-600 mt-1 max-w-xl">
                                            Download every product line from all orders that match your
                                            current search and filters (dates, buyer, employee, status)
                                            as an Excel file.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleDownloadOverallProductsExcel}
                                        disabled={exportingProductsExcel}
                                        className={`shrink-0 px-5 py-2.5 rounded-lg font-semibold text-white text-sm transition whitespace-nowrap ${
                                            exportingProductsExcel
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-gradient-to-r from-[#019ee3] to-[#afcb09] hover:from-[#afcb09] hover:to-[#019ee3]"
                                        }`}
                                    >
                                        {exportingProductsExcel
                                            ? "Preparing Excel…"
                                            : "Download in Excel"}
                                    </button>
                                </div>
                            ) : null}

                            {/* Assignment Controls */}
                            {hasPermission("salesOrders") ? <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 p-4 bg-white rounded-xl shadow justify-between">
                                <span className="font-semibold text-gray-700">Assign Selected Orders:</span>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        className="p-2 border rounded-md text-sm w-full sm:w-auto"
                                    >
                                        <option value="">-- Select Employee --</option>
                                        {salesEmployees.map((employee) => (
                                            <option key={employee._id} value={employee._id}>
                                                {employee.name} ({Array.isArray(employee.employeeType) ? employee.employeeType.join(", ") : employee.employeeType})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAssignOrders}
                                        disabled={selectedOrderIds.length === 0 || !selectedEmployeeId}
                                        className={`p-2 px-4 rounded-md text-white font-semibold transition w-full sm:w-auto
                                        ${selectedOrderIds.length === 0 || !selectedEmployeeId
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-[#019ee3] to-[#afcb09] hover:from-[#afcb09] hover:to-[#019ee3]'
                                            }`}
                                    >
                                        Assign
                                    </button>
                                </div> </div> : null}


                            {orders?.length === 0 && !loading && (
                                <div className="flex flex-col items-center gap-3 p-10 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] rounded-2xl shadow">
                                    <img
                                        draggable="false"
                                        src="https://rukminim1.flixcart.com/www/100/100/promos/23/08/2020/c5f14d2a-2431-4a36-b6cb-8b5b5e283d4f.png"
                                        alt="Empty Orders"
                                        className="mb-2"
                                    />
                                    <span className="text-lg font-semibold text-[#019ee3]">
                                        Sorry, no orders found
                                    </span>
                                    <p className="text-gray-500">Check your search or filters</p>
                                </div>
                            )}

                            {/* Orders Table */}
                            {orders?.length > 0 && (
                                <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                                                {hasPermission("salesOrders") ? <th className="py-2 px-3 text-left">
                                                    {/* Select All Checkbox (Optional) */}
                                                    {/* <input
                                                        type="checkbox"
                                                        className="form-checkbox h-4 w-4 text-blue-600"
                                                        checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                                                        onChange={() => {
                                                            if (selectedOrderIds.length === filteredOrders.length) {
                                                                setSelectedOrderIds([]); // Deselect all
                                                            } else {
                                                                setSelectedOrderIds(filteredOrders.map(order => order._id)); // Select all
                                                            }
                                                        }}
                                                    /> */}
                                                </th> : null}
                                                <th className="py-2 px-3 text-left">Order ID</th>
                                                <th className="py-2 px-3 text-left">Status</th>
                                                <th className="py-2 px-3 text-left">Assigned Users</th>
                                                <th className="py-2 px-3 text-left">Amount</th>
                                                <th className="py-2 px-3 text-left">Products</th>
                                                <th className="py-2 px-3 text-left">Order Date</th>
                                                {hasPermission("salesOrders") ? (
                                                    <th className="py-2 px-3 text-left whitespace-nowrap">Actions</th>
                                                ) : null}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders?.map(order => (
                                                <tr key={order._id} className="border-b last:border-b-0 hover:bg-gray-50">
                                                    {hasPermission("salesOrders") ? <td className="py-2 px-3">
                                                        <input
                                                            type="checkbox"
                                                            className="form-checkbox h-4 w-4 text-blue-600"
                                                            checked={selectedOrderIds.includes(order._id)}
                                                            onChange={() => handleOrderSelect(order._id)}
                                                        />
                                                    </td> : null}
                                                    <td className="py-2 px-3">
                                                        <Link to={`../order_details/${order._id}`} className="text-blue-600 hover:underline">
                                                            {order._id}
                                                        </Link>
                                                    </td>
                                                    <td className="py-2 px-3">{order.orderStatus}</td>
                                                    <td className="py-2 px-3">
                                                        <Link // {{ edit_2 }}
                                                            to={`../employee_details/${order.employeeId?._id}`} // Link to employee details page // {{ edit_2 }}
                                                            className="text-blue-600 hover:underline" // Add styling to make it look like a link // {{ edit_2 }}
                                                        > {/* {{ edit_2 }} */}
                                                            {order.employeeId?.name} {/* {{ edit_2 }} */}
                                                        </Link>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        ₹ {order.amount || '0'}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        {/* Display product count or list */}
                                                        {order.products?.length > 0 ? (
                                                            <span className="text-gray-600">{order.products.length} items</span>
                                                            // Or list product names:
                                                            // <div className="flex flex-col">
                                                            //     {order.products.map(product => (
                                                            //         <span key={product._id} className="text-xs">{product.name}</span>
                                                            //     ))}
                                                            // </div>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                                                    {hasPermission("salesOrders") ? (
                                                        <td className="py-2 px-3 align-top">
                                                            <div className="flex flex-col sm:flex-row gap-1.5">
                                                                {/* <button
                                                                    type="button"
                                                                    disabled={invoiceLoadingKey === `${order._id}-send` || invoiceLoadingKey === `${order._id}-download`}
                                                                    onClick={() => handleSendInvoice(order)}
                                                                    className="px-2 py-1 text-xs font-semibold rounded-md bg-[#019ee3] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                                >
                                                                    {invoiceLoadingKey === `${order._id}-send` ? "Sending…" : "Send invoice"}
                                                                </button> */}
                                                                <button
                                                                    type="button"
                                                                    disabled={invoiceLoadingKey === `${order._id}-send` || invoiceLoadingKey === `${order._id}-download`}
                                                                    onClick={() => handleDownloadInvoice(order)}
                                                                    className="px-2 py-1 text-xs font-semibold rounded-md border border-[#afcb09] text-gray-800 bg-[#f7fafd] hover:bg-[#e6fbff] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                                >
                                                                    {invoiceLoadingKey === `${order._id}-download` ? "Downloading…" : "Download invoice"}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {/* Pagination */}
                                    <div className="mt-4">
                                        <TablePagination
                                            rowsPerPageOptions={[5, 10, 25, 50]}
                                            component="div"
                                            count={totalCount}
                                            rowsPerPage={rowsPerPage}
                                            page={page}
                                            onPageChange={handleChangePage}
                                            onRowsPerPageChange={handleChangeRowsPerPage}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* <!-- orders column --> */}
                {/* <!-- row --> */}
            </main>
        </>
    );
};

export default AdminOrders;
