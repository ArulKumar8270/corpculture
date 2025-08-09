import { useEffect, useState } from "react";
// import OrderItem from "./OrderItem"; // We will refactor to use a table directly
import SearchIcon from "@mui/icons-material/Search";
import Spinner from "../../components/Spinner";
import axios from "axios";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";
import { Link } from "react-router-dom"; // Import Link for navigation

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
    }, [auth?.token, refetchOrders]); // Re-run effect if auth token changes

    // Fetch employees
    useEffect(() => {
        if (auth?.token) {
            fetchEmployees();
        } else {
            setEmployees([]); // Clear employees if no token
        }
    }, [auth?.token]); // Re-run effect if auth token changes


    // fetch orders from server
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL
                }/api/v1/user/admin-orders`, // *** Verify this is the correct endpoint for ALL orders ***
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            if (response?.data?.orders) {
                // Assuming the backend returns an array of order objects
                setOrders(response.data.orders);
                setLoading(false);
            } else {
                setOrders([]); // Ensure orders is an array even if response is empty
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

        setRefetchOrders(true);

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
            fetchOrders(); // You might want to refetch orders to update assignment status
        } catch (error) {
            console.error("Error assigning orders:", error);
            alert("Failed to assign orders.");
        }
    };


    // Filter orders based on search input (optional, basic filtering)
    const filteredOrders = orders.filter(order =>
        order._id.toLowerCase().includes(search.toLowerCase()) ||
        order.buyer?.name.toLowerCase().includes(search.toLowerCase()) ||
        order.shippingInfo?.address.toLowerCase().includes(search.toLowerCase())
        // Add more fields to search if needed
    );


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
                            {/* <!-- searchbar --> */}
                            <form
                                className="flex items-center justify-between mx-auto w-full sm:w-10/12 bg-white border border-[#019ee3] rounded-2xl mb-4 shadow hover:shadow-lg transition"
                                onSubmit={(e) => e.preventDefault()} // Prevent default form submission
                            >
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    type="search"
                                    name="search"
                                    placeholder="Search orders by ID, Customer, Address..."
                                    className="p-3 text-sm outline-none flex-1 rounded-l-2xl bg-[#f7fafd]"
                                />
                                {/* Search button is now just visual, filtering happens onChange */}
                                <div className="h-full text-sm px-4 py-3 text-white bg-gradient-to-r from-[#019ee3] to-[#afcb09] rounded-r-2xl flex items-center gap-2 font-semibold">
                                    <SearchIcon sx={{ fontSize: "20px" }} />
                                    <span className="text-xs sm:text-sm">Search</span>
                                </div>
                            </form>
                            {/* <!-- search bar --> */}

                            {/* Assignment Controls */}
                            {hasPermission("salesOrders") ? <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 p-4 bg-white rounded-xl shadow">
                                <span className="font-semibold text-gray-700">Assign Selected Orders:</span>
                                <select
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    className="p-2 border rounded-md text-sm w-full sm:w-auto"
                                >
                                    <option value="">-- Select Employee --</option>
                                    {employees
                                        ?.filter(employee => employee.employeeType === 'Service') // {{ edit_1 }} Filter employees by type 'Service'
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
                            </div> : null}


                            {filteredOrders?.length === 0 && (
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
                            {filteredOrders?.length > 0 && (
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
                                                <th className="py-2 px-3 text-left">Customer</th>
                                                <th className="py-2 px-3 text-left">Amount</th>
                                                <th className="py-2 px-3 text-left">Products</th>
                                                <th className="py-2 px-3 text-left">Order Date</th>
                                                {/* Add more headers as needed */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredOrders.map(order => (
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
                                                        <Link to={`./order_details/${order._id}`} className="text-blue-600 hover:underline">
                                                            {order._id}
                                                        </Link>
                                                    </td>
                                                    <td className="py-2 px-3">{order.orderStatus}</td>
                                                    <td className="py-2 px-3">
                                                        <Link // {{ edit_2 }}
                                                            to={`/admin/employee_details/${order.employeeId}`} // Link to employee details page // {{ edit_2 }}
                                                            className="text-blue-600 hover:underline" // Add styling to make it look like a link // {{ edit_2 }}
                                                        > {/* {{ edit_2 }} */}
                                                            {order.employeeId} {/* {{ edit_2 }} */}
                                                        </Link>
                                                    </td>
                                                    <td className="py-2 px-3">{order.buyer?.name || 'N/A'}</td>
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
