import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const EmployeeDetails = () => {
    const { auth } = useAuth();
    const { id } = useParams(); // Get employee ID from URL
    const [employee, setEmployee] = useState(null);
    const [assignedOrderDetails, setAssignedOrderDetails] = useState([]); // State to store order details {{ edit_1 }}
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEmployeeAndOrders = async () => { // Combined fetch function {{ edit_2 }}
            try { // {{ edit_2 }}
                setLoading(true); // {{ edit_2 }}
                setError(null); // Clear previous errors {{ edit_2 }}
                setEmployee(null); // Clear previous employee data {{ edit_2 }}
                setAssignedOrderDetails([]); // Clear previous order data {{ edit_2 }}

                // 1. Fetch Employee Details
                const employeeResponse = await axios.get( // {{ edit_2 }}
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/get/${id}`, // {{ edit_2 }}
                    { // {{ edit_2 }}
                        headers: { // {{ edit_2 }}
                            Authorization: auth?.token, // {{ edit_2 }}
                        }, // {{ edit_2 }}
                    } // {{ edit_2 }}
                ); // {{ edit_2 }}

                if (employeeResponse.status === 200 && employeeResponse.data.employee) { // {{ edit_2 }}
                    const fetchedEmployee = employeeResponse.data.employee; // {{ edit_2 }}
                    setEmployee(fetchedEmployee); // {{ edit_2 }}

                    // 2. If employee has assigned orders, fetch their details
                        try { // {{ edit_2 }}
                            // *** Use the new endpoint to get orders by employee ID *** // {{ edit_2 }}
                            const ordersResponse = await axios.get( // {{ edit_2 }}
                                `${import.meta.env.VITE_SERVER_URL}/api/v1/user/ordersByEmpId/${id}`, // {{ edit_2 }}
                                { // {{ edit_2 }}
                                    headers: { // {{ edit_2 }}
                                        Authorization: auth?.token, // {{ edit_2 }}
                                    }, // {{ edit_2 }}
                                } // {{ edit_2 }}
                            ); // {{ edit_2 }}

                            if (ordersResponse.status === 200 && ordersResponse.data.orders) { // {{ edit_2 }}
                                setAssignedOrderDetails(ordersResponse.data.orders); // {{ edit_2 }}
                            } else { // {{ edit_2 }}
                                // Handle case where endpoint returns 200 but no orders (should be caught by backend 404) // {{ edit_2 }}
                                console.warn("Backend returned 200 for employee orders but no orders data."); // {{ edit_2 }}
                            } // {{ edit_2 }}
                        } catch (orderFetchError) { // {{ edit_2 }}
                            // Handle errors specifically for fetching orders // {{ edit_2 }}
                            console.error("Error fetching assigned orders:", orderFetchError); // {{ edit_2 }}
                            // Decide if this is a critical error or just means no orders were found // {{ edit_2 }}
                            // For now, we'll just log and continue showing employee details // {{ edit_2 }}
                            toast.warning("Could not fetch assigned order details."); // {{ edit_2 }}
                        } // {{ edit_2 }}

                } else { // {{ edit_2 }}
                    setError("Employee not found"); // {{ edit_2 }}
                    toast.error("Employee not found."); // {{ edit_2 }}
                } // {{ edit_2 }}

            } catch (err) { // Catch errors from fetching employee details // {{ edit_2 }}
                console.error("Error fetching employee details:", err); // {{ edit_2 }}
                setError(err.response?.data?.message || "Failed to fetch employee details."); // {{ edit_2 }}
                toast.error(err.response?.data?.message || "Failed to fetch employee details."); // {{ edit_2 }}
            } finally { // {{ edit_2 }}
                setLoading(false); // Ensure loading is false after both fetches (or initial employee fetch fails) // {{ edit_2 }}
            } // {{ edit_2 }}
        }; // {{ edit_2 }}

        if (auth?.token && id) {
            fetchEmployeeAndOrders(); // Call the combined function {{ edit_3 }}
        } else if (!id) {
            setLoading(false);
            setError("No employee ID provided.");
            toast.error("No employee ID provided.");
        }
    }, [auth?.token, id]); // Re-run effect if auth token or ID changes

    if (loading) {
        return (
            <div className="text-center py-10 text-lg text-gray-500 min-h-screen bg-gradient-to-br from-[#e6fbff] to-[#f7fafd]">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-lg text-red-600 min-h-screen bg-gradient-to-br from-[#e6fbff] to-[#f7fafd]">
                <p>{error}</p>
            </div>
        );
    }

    if (!employee) {
        return (
             <div className="text-center py-10 text-lg text-gray-500 min-h-screen bg-gradient-to-br from-[#e6fbff] to-[#f7fafd]">
                <p>Employee data not available.</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
            <SeoData title={`${employee.name} Details - Admin`} />
            <h1 className="text-2xl font-bold mb-6 text-[#019ee3]">Employee Details</h1>

            <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-gray-600 font-semibold">Name:</p>
                        <p className="text-gray-800">{employee.name}</p>
                    </div>
                    <div>
                        <p className="text-gray-600 font-semibold">Email:</p>
                        <p className="text-gray-800">{employee.email}</p>
                    </div>
                    <div>
                        <p className="text-gray-600 font-semibold">Phone:</p>
                        <p className="text-gray-800">{employee.phone}</p>
                    </div>
                    <div>
                        <p className="text-gray-600 font-semibold">Employee Type:</p>
                        <p className="text-gray-800">{employee.employeeType}</p>
                    </div>
                    <div className="md:col-span-2">
                        <p className="text-gray-600 font-semibold">Address:</p>
                        <p className="text-gray-800">{employee.address}</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-3 text-[#019ee3]">Assigned Orders</h2>
                    {assignedOrderDetails && assignedOrderDetails.length > 0 ? ( // Use assignedOrderDetails state {{ edit_4 }}
                        <ul className="list-disc list-inside space-y-1">
                            {assignedOrderDetails.map((order) => ( // Map over order objects {{ edit_4 }}
                                <li key={order._id}> {/* Use order._id as key {{ edit_4 }} */}
                                    <Link
                                        to={`/admin/orders/order_details/${order._id}`} // Link to individual order details {{ edit_4 }}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Order ID: {order._id}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No orders assigned or failed to load orders.</p>
                    )
                }
                </div>

                {/* Add more sections for other details if needed */}
            </div>
        </div>
    );
};

export default EmployeeDetails;