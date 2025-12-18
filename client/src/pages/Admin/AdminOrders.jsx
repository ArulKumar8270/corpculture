import { useEffect, useState } from "react";
// import OrderItem from "./OrderItem"; // We will refactor to use a table directly
import SearchIcon from "@mui/icons-material/Search";
import Spinner from "../../components/Spinner";
import axios from "axios";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";
import { Link } from "react-router-dom"; // Import Link for navigation
import { TablePagination } from "@mui/material";

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

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    useEffect(() => {
        if (auth?.token) {
            fetchOrders();
        } else {
            setOrders([]); // Clear orders if no token
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.token, refetchOrders, page, rowsPerPage]); // Re-run effect when pagination changes or refetch is triggered

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
                employeeId: currentEmployeeId || "",
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
            // Assuming you have an endpoint to get all employees
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`, // *** Verify this endpoint ***
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            setEmployees(response.data.employees || []);
        } catch (error) {
            console.error("Error fetching employees:", error);
            // Handle error display if needed
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
                                            >
                                                <option value="">All Employees</option>
                                                {employees
                                                    ?.filter(employee => employee.employeeType === 'Sales')
                                                    .map(employee => (
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
                                        {employees
                                            ?.filter(employee => employee.employeeType === 'Sales') // {{ edit_1 }} Filter employees by type 'Service'
                                            .map(employee => (
                                                <option key={employee._id} value={employee._id}>
                                                    {employee.name} ({employee.employeeType})
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
                                                {/* Add more headers as needed */}
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
                                                    {/* Add more cells as needed */}
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
