import React, { useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import Spinner from "../../components/Spinner";
import axios from "axios";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";
import { Link, useLocation } from "react-router-dom";
import {
    getCommissionGroupKey,
    getCommissionGroupLabel,
    getCommissionProductLabel,
    isCompanyBasedCommission,
} from "../../utils/commissionDisplay";
// import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'; // Removed {{ edit_1 }}
// import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'; // Removed {{ edit_1 }}

const AdminCommission = () => {
    const { auth } = useAuth();
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
                const initialExpanded = new Set();
                response.data.commissions.forEach((commission) => {
                    initialExpanded.add(getCommissionGroupKey(commission, commissionFrom));
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

    const searchLower = search.toLowerCase();
    const groupLabel = getCommissionGroupLabel(commissionFrom);
    const isCompanyBased = isCompanyBasedCommission(commissionFrom);

    const filteredCommissions = commissions.filter((commission) => {
        if (!(Number(commission.commissionAmount) > 0)) return false;

        const groupKey = getCommissionGroupKey(commission, commissionFrom);
        const userName =
            commission.userId?.name ||
            (typeof commission.userId === 'string' ? commission.userId : '');
        const companyName =
            commission.companyId?.companyName ||
            (typeof commission.companyId === 'string' ? commission.companyId : '');
        const orderId = String(commission.orderId?._id || commission.orderId || '');
        const serviceInvoiceId = String(
            commission.serviceInvoiceId?._id || commission.serviceInvoiceId || ''
        );
        const rentalInvoiceId = String(
            commission.rentalInvoiceId?._id || commission.rentalInvoiceId || ''
        );

        return (
            commission._id.toLowerCase().includes(searchLower) ||
            groupKey.toLowerCase().includes(searchLower) ||
            userName.toLowerCase().includes(searchLower) ||
            companyName.toLowerCase().includes(searchLower) ||
            orderId.toLowerCase().includes(searchLower) ||
            serviceInvoiceId.toLowerCase().includes(searchLower) ||
            rentalInvoiceId.toLowerCase().includes(searchLower)
        );
    });

    const groupedCommissions = filteredCommissions.reduce((acc, commission) => {
        const groupKey = getCommissionGroupKey(commission, commissionFrom);
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(commission);
        return acc;
    }, {});

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
                                    placeholder={
                                        isCompanyBased
                                            ? "Search commissions by company, invoice ID..."
                                            : "Search commissions by ID, employee, order ID..."
                                    }
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
                                                <th className="py-2 px-3 text-left">{groupLabel}</th>
                                                <th className="py-2 px-3 text-left">
                                                    {commissionFrom === 'Sales' ? 'Order ID' : 'Invoice ID'}
                                                </th>
                                                <th className="py-2 px-3 text-left">Product</th>
                                                <th className="py-2 px-3 text-left">Amount</th>
                                                <th className="py-2 px-3 text-left">Paid</th>
                                                <th className="py-2 px-3 text-left">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(groupedCommissions).map(([groupKey, groupCommissions]) => (
                                                <React.Fragment key={groupKey}>
                                                    <tr
                                                        className="bg-gray-200 font-semibold text-gray-800 cursor-pointer hover:bg-gray-300 transition-colors"
                                                        onClick={() => toggleExpand(groupKey)}
                                                    >
                                                        <td colSpan="6" className="py-2 px-3 text-left flex items-center gap-2">
                                                            <svg
                                                                className={`w-4 h-4 transform transition-transform ${expandedUsers.has(groupKey) ? 'rotate-90' : 'rotate-0'}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                                            </svg>
                                                            <span>{groupLabel}: {groupKey}</span>
                                                        </td>
                                                    </tr>
                                                    {expandedUsers.has(groupKey) && (
                                                        groupCommissions.map(commission => (
                                                            <tr key={commission._id} className="border-b last:border-b-0 hover:bg-gray-50">
                                                                <td className="py-2 px-3">
                                                                    {getCommissionGroupKey(commission, commissionFrom)}
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
                                                                <td className="py-2 px-3">
                                                                    {getCommissionProductLabel(commission)}
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