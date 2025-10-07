import React, { useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import Spinner from "../../components/Spinner";
import axios from "axios";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";
import { Link, useParams, useLocation } from "react-router-dom"; // Keep Link if you plan to link to commission/employee/order details
// import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'; // Removed {{ edit_1 }}
// import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'; // Removed {{ edit_1 }}

const AdminCommission = () => {
    const { auth } = useAuth();
    const params = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const commissionFrom = queryParams.get("commissionFrom") || "Sales";
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [commissions, setCommissions] = useState([]); // State to store commissions
    const [expandedUsers, setExpandedUsers] = useState(new Set()); // {{ edit_1 }} State to manage expanded/collapsed user groups, now a Set

    useEffect(() => {
        if (auth?.token) {
            fetchCommissions();
        } else {
            setCommissions([]); // Clear commissions if no token
            setLoading(false);
        }
    }, [auth?.token, commissionFrom]); // Re-run effect if auth token changes

    // fetch commissions from server
    const fetchCommissions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/commissions?commissionFrom=${commissionFrom}`, // *** IMPORTANT: You need to implement this backend API endpoint ***
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            if (response?.data?.commissions) { // Assuming the backend returns an array of commission objects
                setCommissions(response.data.commissions);
                setLoading(false);
                // {{ edit_1 }} Initialize all users as expanded by default
                const initialExpanded = new Set();
                response.data.commissions.forEach(commission => {
                    const userId = commission.userId || 'Unassigned';
                    initialExpanded.add(userId); // Add all unique user IDs to the set
                });
                setExpandedUsers(initialExpanded);
            } else {
                setCommissions([]); // Ensure commissions is an array even if response is empty
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching commissions:", error);
            setLoading(false);
            // Handle error display if needed, e.g., using toast
        }
    };

    // Filter commissions based on search input
    const filteredCommissions = commissions.filter(commission =>
        commission._id.toLowerCase().includes(search.toLowerCase()) ||
        commission.userId?.toLowerCase().includes(search.toLowerCase()) || // Assuming commission has employeeName
        commission.orderId?.toLowerCase().includes(search.toLowerCase()) || // Assuming commission is linked to an order
        commission.status?.toLowerCase().includes(search.toLowerCase())
        // Add more fields to search if needed, e.g., commission.notes
    );

    // Group commissions by userId
    const groupedCommissions = filteredCommissions.reduce((acc, commission) => {
        const userId = commission.userId?.name || 'Unassigned'; // Use 'Unassigned' for commissions without a userId
        if (!acc[userId]) {
            acc[userId] = [];
        }
        acc[userId].push(commission);
        return acc;
    }, {});

    console.log(groupedCommissions, "groupedCommissions3424");

    // {{ edit_1 }} Function to toggle expand/collapse for a user ID
    const toggleExpand = (userId) => {
        setExpandedUsers(prev => {
            const newSet = new Set(prev); // Create a new Set from the previous one
            if (newSet.has(userId)) {
                newSet.delete(userId); // If already expanded, collapse it
            } else {
                newSet.add(userId); // If collapsed, expand it
            }
            return newSet; // Return the new Set to update state
        });
    };

    return (
        <>
            <SeoData title="Admin Commissions" />

            <main className="w-full px-4 sm:px-10 py-4">
                <div className="flex gap-3.5 w-full">
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
                                    placeholder="Search commissions by ID, Employee, Order ID, Status..."
                                    className="p-3 text-sm outline-none flex-1 rounded-l-2xl bg-[#f7fafd]"
                                />
                                <div className="h-full text-sm px-4 py-3 text-white bg-gradient-to-r from-[#019ee3] to-[#afcb09] rounded-r-2xl flex items-center gap-2 font-semibold">
                                    <SearchIcon sx={{ fontSize: "20px" }} />
                                    <span className="text-xs sm:text-sm">Search</span>
                                </div>
                            </form>
                            {/* <!-- search bar --> */}

                            {Object.keys(groupedCommissions).length === 0 && (
                                <div className="flex flex-col items-center gap-3 p-10 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] rounded-2xl shadow">
                                    <img
                                        draggable="false"
                                        src="https://rukminim1.flixcart.com/www/100/100/promos/23/08/2020/c5f14d2a-2431-4a36-b6cb-8b5b5e283d4f.png"
                                        alt="Empty Commissions"
                                        className="mb-2"
                                    />
                                    <span className="text-lg font-semibold text-[#019ee3]">
                                        Sorry, no commissions found
                                    </span>
                                    <p className="text-gray-500">Check your search or filters</p>
                                </div>
                            )}

                            {/* Commissions Table */}
                            {Object.keys(groupedCommissions).length > 0 && (
                                <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                                                <th className="py-2 px-3 text-left">User Id</th>
                                                <th className="py-2 px-3 text-left">Order ID</th>
                                                <th className="py-2 px-3 text-left">Amount</th>
                                                <th className="py-2 px-3 text-left">Paid</th>
                                                <th className="py-2 px-3 text-left">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(groupedCommissions).map(([userId, userCommissions]) => (
                                                <React.Fragment key={userId}>
                                                    <tr
                                                        className="bg-gray-200 font-semibold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                                        onClick={() => toggleExpand(userId)}
                                                    >
                                                        <td colSpan="6" className="py-2 px-3 text-left flex items-center gap-2"> {/* {{ edit_2 }} Adjusted for SVG icon */}
                                                            {/* {{ edit_2 }} SVG Icon for expand/collapse */}
                                                            <svg
                                                                className={`w-4 h-4 transform transition-transform ${expandedUsers.has(userId) ? 'rotate-90' : 'rotate-0'}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                                            </svg>
                                                            <span>User ID: {userId}</span>
                                                        </td>
                                                    </tr>
                                                    {expandedUsers.has(userId) && ( // {{ edit_2 }} Conditionally render commission rows based on Set
                                                        userCommissions.map(commission => (
                                                            <tr key={commission._id} className="border-b last:border-b-0 hover:bg-gray-50">
                                                                <td className="py-2 px-3">
                                                                    {/* <Link to={`#`} className="text-blue-600 hover:underline"> */}
                                                                        {commission.userId?.name || commission?.userId}
                                                                    {/* </Link> */}
                                                                </td>
                                                                <td className="py-2 px-3">
                                                                    {/* Link to order details if commission is tied to an order */}
                                                                    {commission.orderId ? (
                                                                        <Link to={`../order_details/${commission.orderId || commission?.serviceInvoiceId || commission?.rentalInvoiceId}`} className="text-blue-600 hover:underline">
                                                                            {commission.orderId }
                                                                        </Link>
                                                                    ) : commission?.serviceInvoiceId || commission?.rentalInvoiceId ? (
                                                                        <Link to={`../addServiceInvoice/${commission?.serviceInvoiceId || commission?.rentalInvoiceId}`} className="text-blue-600 hover:underline">
                                                                            {commission?.serviceInvoiceId || commission?.rentalInvoiceId}
                                                                        </Link>
                                                                    ) : 'N/A'}
                                                                </td>
                                                                <td className="py-2 px-3">₹ {commission.commissionAmount || '0.00'}</td>
                                                                <td className="py-2 px-3">{commission.isPaid ? "Yes" : "No"}</td>
                                                                <td className="py-2 px-3">{commission.createdAt}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
};

export default AdminCommission;