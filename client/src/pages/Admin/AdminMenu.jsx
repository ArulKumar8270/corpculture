import { useAuth } from "../../context/auth";
import { Link, NavLink, useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import BarChartIcon from "@mui/icons-material/BarChart";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { GiCrossMark } from "react-icons/gi";
import SupportAgentIcon from '@mui/icons-material/SupportAgent'; // Import an icon for services
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'; // Import icon for Orders
import MenuBookIcon from '@mui/icons-material/MenuBook'; // Import icon for Menu (not used in new structure, but kept if needed elsewhere)
import FlagIcon from '@mui/icons-material/Flag'; // Import icon for Mission (not used in new structure, but kept if needed elsewhere)
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'; // Import icon for expand/collapse
import HomeWorkIcon from '@mui/icons-material/HomeWork'; // Import icon for Rental
import ReceiptIcon from '@mui/icons-material/Receipt'; // Import icon for Invoice
import UploadFileIcon from '@mui/icons-material/UploadFile'; // Import icon for Upload Invoice
import AssessmentIcon from '@mui/icons-material/Assessment'; // Import icon for Reports
import StoreIcon from '@mui/icons-material/Store'; // Import icon for Vendor
import SettingsIcon from '@mui/icons-material/Settings'; // Import icon for Other Settings
import { useState, useEffect } from 'react'; // {{ edit_1 }} Added useEffect
import axios from 'axios'; // {{ edit_1 }} Added axios

const AdminMenu = ({ toggleMenu }) => {
    const { auth, setAuth, LogOut, userPermissions } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        navigate("/");
        LogOut();
    };
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    // State to manage expanded sections
    const [expandedSections, setExpandedSections] = useState({
        account: false, // Start with Account Settings expanded
        dashboard: false, // Start with Admin Dashboard expanded
        sales: false, // New section, default to collapsed
        service: false, // New section, default to collapsed
        rental: false, // New section, default to collapsed
        reports: false, // New section, default to collapsed
        vendor: false, // New section, default to collapsed
        otherSettings: true, // New section, default to collapsed
    });

    // {{ edit_2 }}
    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('view')) || auth?.user?.role === 1;
    };
    // {{ edit_2 }}

    // Function to toggle section expansion
    const toggleSection = (sectionName) => {
        setExpandedSections(prevState => ({
            ...prevState,
            [sectionName]: !prevState[sectionName]
        }));
    };

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* User Info */}
            <div className="flex relative items-center gap-4 p-4 bg-gradient-to-r from-[#019ee3] to-[#afcb09] rounded-2xl shadow-lg">
                <img
                    src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/profile-pic-male_4811a1.svg"
                    alt="user svg"
                    className="w-14 h-14 rounded-full border-4 border-white shadow"
                />
                <div className="flex flex-col justify-center p-1 text-white">
                    <div className="text-xs opacity-80">Hello,</div>
                    <div className="font-bold text-base">{auth?.user?.name}</div>
                </div>
                <div
                    className="hover:scale-105 absolute right-4 top-2 cursor-pointer sm:hidden text-white"
                    onClick={toggleMenu}
                >
                    <GiCrossMark size={22} />
                </div>
            </div>

            {/* Menu Sections */}
            <div className="bg-white flex flex-col justify-center rounded-2xl shadow-lg overflow-y-auto">
                {/* Account Settings */}
                {/* {{ edit_3 }} */}
                {hasPermission('accountSettings') && (
                    <div className="flex flex-col justify-center border-b">
                        {/* Clickable Header */}
                        <button
                            className="flex flex-row items-center justify-between w-full gap-3 pl-4 pr-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleSection('account')}
                        >
                            <div className="flex items-center gap-3">
                                <PersonIcon className="text-[#019ee3]" />
                                <div className="font-semibold text-sm text-gray-600 tracking-wide">
                                    ACCOUNT SETTINGS
                                </div>
                            </div>
                            <KeyboardArrowDownIcon
                                className={`text-gray-600 transition-transform ${expandedSections.account ? 'rotate-180' : 'rotate-0'}`}
                            />
                        </button>
                        {/* Links conditionally rendered */}
                        {expandedSections.account && (
                            <div className="flex flex-col text-black font-light text-sm mb-2">
                                {hasPermission('accountSettings') && (
                                    <NavLink
                                        to="./profile"
                                        onClick={scrollToTop}
                                        className={({ isActive }) =>
                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                            }`
                                        }
                                    >
                                        <div className="h-10 px-8 flex items-center">
                                            Profile Information
                                        </div>
                                    </NavLink>
                                )}
                                {/* Removed Manage Addresses and Pan Card as per new structure */}
                            </div>
                        )}
                    </div>
                )}
                {/* {{ edit_3 }} */}

                {/* Dashboard */}
                {/* {{ edit_4 }} */}
                {hasPermission('adminDashboard') && (
                    <div className="flex flex-col justify-center border-b">
                        {/* Clickable Header */}
                        <button
                            className="flex flex-row items-center justify-between w-full gap-3 pl-4 pr-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleSection('dashboard')}
                        >
                            <div className="flex items-center gap-3">
                                <BarChartIcon className="text-[#019ee3]" />
                                <div className="font-semibold text-sm text-gray-600 tracking-wide">
                                    ADMIN DASHBOARD
                                </div>
                            </div>
                            <KeyboardArrowDownIcon
                                className={`text-gray-600 transition-transform ${expandedSections.dashboard ? 'rotate-180' : 'rotate-0'}`}
                            />
                        </button>
                        {/* Links conditionally rendered */}
                        {expandedSections.dashboard && (
                            <div className="flex flex-col text-black font-light text-sm mb-2">
                                {/* Sales Section */}
                                {hasPermission('sales') && (
                                    <div className="flex flex-col justify-center">
                                        <button
                                            className="flex flex-row items-center justify-between w-full gap-3 pl-4 pr-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => toggleSection('sales')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <ShoppingBagIcon className="text-[#019ee3]" />
                                                <div className="font-semibold text-sm text-gray-600 tracking-wide">
                                                    Sales
                                                </div>
                                            </div>
                                            <KeyboardArrowDownIcon
                                                className={`text-gray-600 transition-transform ${expandedSections.sales ? 'rotate-180' : 'rotate-0'}`}
                                            />
                                        </button>
                                        {expandedSections.sales && (
                                            <div className="flex flex-col text-black font-light text-sm mb-2">
                                                {hasPermission('salesAllProducts') && (
                                                    <NavLink
                                                        to="./all-products"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Products
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {hasPermission('salesAllCategory') && (
                                                    <NavLink
                                                        to="./all-category"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Category
                                                        </div>
                                                    </NavLink>
                                                )}

                                                {/* Orders Link */}
                                                {hasPermission('salesOrders') && (
                                                    <NavLink
                                                        to="/admin/orders"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center gap-3">
                                                            <ShoppingBagIcon sx={{ fontSize: "20px" }} />
                                                            Orders
                                                        </div>
                                                    </NavLink>
                                                )}

                                                {/* Commission Link (Direct) */}
                                                {hasPermission('salesCommission') && (
                                                    <NavLink
                                                        to="/admin/commission"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center gap-3">
                                                            <BarChartIcon sx={{ fontSize: "20px" }} /> {/* Reusing BarChartIcon for Commission */}
                                                            Commission
                                                        </div>
                                                    </NavLink>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Service Section */}
                                {hasPermission('service') && (
                                    <div className="flex flex-col justify-center">
                                        <button
                                            className="flex flex-row items-center justify-between w-full gap-3 pl-4 pr-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => toggleSection('service')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <SupportAgentIcon className="text-[#019ee3]" />
                                                <div className="font-semibold text-sm text-gray-600 tracking-wide">
                                                    Service
                                                </div>
                                            </div>
                                            <KeyboardArrowDownIcon
                                                className={`text-gray-600 transition-transform ${expandedSections.service ? 'rotate-180' : 'rotate-0'}`}
                                            />
                                        </button>
                                        {expandedSections.service && (
                                            <div className="flex flex-col text-black font-light text-sm mb-2">
                                                {hasPermission('serviceEnquiries') && (
                                                    <NavLink
                                                        to="./service-enquiries"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Enquiries
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {/* All Products under Service */}
                                                {hasPermission('serviceAllProducts') && (
                                                    <NavLink
                                                        to="./serviceProductList"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Products
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {hasPermission('serviceInvoice') && (
                                                    <NavLink
                                                        to="./serviceInvoiceList"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Invoices
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {hasPermission('serviceQuotation') && (
                                                    <NavLink
                                                        to="./ServiceQuotationList"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Quotations
                                                        </div>
                                                    </NavLink>
                                                )}
                                                <NavLink
                                                    to="./serviceReportlist"
                                                    onClick={scrollToTop}
                                                    className={({ isActive }) =>
                                                        `rounded-lg mx-2 my-1 transition-all ${isActive
                                                            ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                            : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                        }`
                                                    }
                                                >
                                                    <div className="h-10 px-8 flex items-center">
                                                        Report & Gatpass
                                                    </div>
                                                </NavLink>
                                                {/* Commission under Service */}
                                                {hasPermission('serviceCommission') && (
                                                    <NavLink
                                                        to="/admin/commission"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Commissions
                                                        </div>
                                                    </NavLink>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Rental Section */}
                                {hasPermission('rental') && (
                                    <div className="flex flex-col justify-center">
                                        <button
                                            className="flex flex-row items-center justify-between w-full gap-3 pl-4 pr-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => toggleSection('rental')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <HomeWorkIcon className="text-[#019ee3]" />
                                                <div className="font-semibold text-sm text-gray-600 tracking-wide">
                                                    Rental
                                                </div>
                                            </div>
                                            <KeyboardArrowDownIcon
                                                className={`text-gray-600 transition-transform ${expandedSections.rental ? 'rotate-180' : 'rotate-0'}`}
                                            />
                                        </button>
                                        {expandedSections.rental && (
                                            <div className="flex flex-col text-black font-light text-sm mb-2">
                                                {/* Commission under Rental */}
                                                {hasPermission('rentalEnquiries') && (
                                                    <NavLink
                                                        to="./rental-enquiries"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Enquiries
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {/* All Products under Rental */}
                                                {hasPermission('rentalAllProducts') && (
                                                    <NavLink
                                                        to="./rentalProductList"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Products
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {/* Invoice Link */}
                                                {hasPermission('rentalInvoice') && (
                                                    <NavLink
                                                        to="./rentalInvoiceList"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center gap-3">
                                                            <ReceiptIcon sx={{ fontSize: "20px" }} />
                                                            Invoices
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {hasPermission('rentalQuotation') && (
                                                    <NavLink
                                                        to="./rentalQuotationList"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center gap-3">
                                                            <ReceiptIcon sx={{ fontSize: "20px" }} />
                                                            Quotations
                                                        </div>
                                                    </NavLink>
                                                )}
                                                <NavLink
                                                    to="./RentalReportlist"
                                                    onClick={scrollToTop}
                                                    className={({ isActive }) =>
                                                        `rounded-lg mx-2 my-1 transition-all ${isActive
                                                            ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                            : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                        }`
                                                    }
                                                >
                                                    <div className="h-10 px-8 flex items-center">
                                                        Report & Gatpass
                                                    </div>
                                                </NavLink>
                                                {hasPermission('rentalCommission') && (
                                                    <NavLink
                                                        to="/admin/commission"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Commissions
                                                        </div>
                                                    </NavLink>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Vendor Section */}
                                {hasPermission('vendor') && (
                                    <div className="flex flex-col justify-center">
                                        <button
                                            className="flex flex-row items-center justify-between w-full gap-3 pl-4 pr-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => toggleSection('vendor')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <StoreIcon className="text-[#019ee3]" />
                                                <div className="font-semibold text-sm text-gray-600 tracking-wide">
                                                    Vendors
                                                </div>
                                            </div>
                                            <KeyboardArrowDownIcon
                                                className={`text-gray-600 transition-transform ${expandedSections.vendor ? 'rotate-180' : 'rotate-0'}`}
                                            />
                                        </button>
                                        {expandedSections.vendor && (
                                            <div className="flex flex-col text-black font-light text-sm mb-2">
                                                {hasPermission('vendorList') && (
                                                    <NavLink
                                                        to="./vendorList"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Vendors
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {hasPermission('vendorProducts') && (
                                                    <NavLink
                                                        to="./vendorProductList"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Vendor Products
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {hasPermission('vendorPurchaseList') && (
                                                    <NavLink
                                                        to="./purchaseList"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Purchase List
                                                        </div>
                                                    </NavLink>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {hasPermission('reports') && (
                                    <div className="flex flex-col justify-center">
                                        <button
                                            className="flex flex-row items-center justify-between w-full gap-3 pl-4 pr-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => toggleSection('reports')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <AssessmentIcon className="text-[#019ee3]" />
                                                <div className="font-semibold text-sm text-gray-600 tracking-wide">
                                                    Reports
                                                </div>
                                            </div>
                                            <KeyboardArrowDownIcon
                                                className={`text-gray-600 transition-transform ${expandedSections.reports ? 'rotate-180' : 'rotate-0'}`}
                                            />
                                        </button>
                                        {expandedSections.reports && (
                                            <div className="flex flex-col text-black font-light text-sm mb-2">
                                                {hasPermission('reportsCompanyList') && (
                                                    <NavLink
                                                        to="./companyList"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Company list
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {hasPermission('reportsService') && (
                                                    <NavLink
                                                        to="./serviceReports"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Service
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {hasPermission('reportsSales') && (
                                                    <NavLink
                                                        to="/admin/reports/sales-reports"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Sales
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {hasPermission('reportsEmployeeList') && (
                                                    <NavLink
                                                        to="./employee"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Employee list
                                                        </div>
                                                    </NavLink>
                                                )}
                                                {hasPermission('reportsUserList') && (
                                                    <NavLink
                                                        to="./Users"
                                                        onClick={scrollToTop}
                                                        className={({ isActive }) =>
                                                            `rounded-lg mx-2 my-1 transition-all ${isActive
                                                                ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                                : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                            }`
                                                        }
                                                    >
                                                        <div className="h-10 px-8 flex items-center">
                                                            Users list
                                                        </div>
                                                    </NavLink>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Removed Users and Employee links as they are not in the new structure */}
                            </div>
                        )}
                    </div>
                )}
                {/* {{ edit_4 }} */}

                {/* {{ edit_5 }} */}
                {hasPermission('otherSettings') && (
                    <div className="flex flex-col justify-center border-b">
                        <button
                            className="flex flex-row items-center justify-between w-full gap-3 pl-4 pr-3 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleSection('otherSettings')}
                        >
                            <div className="flex items-center gap-3">
                                <SettingsIcon className="text-[#019ee3]" />
                                <div className="font-semibold text-sm text-gray-600 tracking-wide">
                                    OTHER SETTINGS
                                </div>
                            </div>
                            <KeyboardArrowDownIcon
                                className={`text-gray-600 transition-transform ${expandedSections.otherSettings ? 'rotate-180' : 'rotate-0'}`}
                            />
                        </button>
                        {expandedSections.otherSettings && (
                            <div className="flex flex-col text-black font-light text-sm mb-2">
                                {hasPermission('otherSettingsGst') && (
                                    <>
                                        <NavLink
                                            to="./gst"
                                            onClick={scrollToTop}
                                            className={({ isActive }) =>
                                                `rounded-lg mx-2 my-1 transition-all ${isActive
                                                    ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                    : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                }`
                                            }
                                        >
                                            <div className="h-10 px-8 flex items-center">
                                                GST
                                            </div>
                                        </NavLink>
                                        <NavLink
                                            to="./employee"
                                            onClick={scrollToTop}
                                            className={({ isActive }) =>
                                                `rounded-lg mx-2 my-1 transition-all ${isActive
                                                    ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                    : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                }`
                                            }
                                        >
                                            <div className="h-10 px-8 flex items-center">
                                                Employee
                                            </div>
                                        </NavLink>
                                        <NavLink
                                            to="./menuSetting"
                                            onClick={scrollToTop}
                                            className={({ isActive }) =>
                                                `rounded-lg mx-2 my-1 transition-all ${isActive
                                                    ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                    : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                }`
                                            }
                                        >
                                            <div className="h-10 px-8 flex items-center">
                                                Menu setting
                                            </div>
                                        </NavLink>
                                        <NavLink
                                            to="/admin/settings/credit"
                                            onClick={scrollToTop}
                                            className={({ isActive }) =>
                                                `rounded-lg mx-2 my-1 transition-all ${isActive
                                                    ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                    : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                }`
                                            }
                                        >
                                            <div className="h-10 px-8 flex items-center">
                                                Credit
                                            </div>
                                        </NavLink>
                                        <NavLink
                                            to="/admin/settings/gift"
                                            onClick={scrollToTop}
                                            className={({ isActive }) =>
                                                `rounded-lg mx-2 my-1 transition-all ${isActive
                                                    ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                                    : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                                }`
                                            }
                                        >
                                            <div className="h-10 px-8 flex items-center">
                                                Gift
                                            </div>
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col justify-center border-b">
                <div className="flex flex-row items-center gap-3 pl-4 py-3 group">
                    <PowerSettingsNewIcon className="text-[#019ee3]" />
                    <button
                        className="font-semibold text-sm w-full h-10 flex items-center text-gray-600 group-hover:text-[#019ee3] transition"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="flex flex-col items-start gap-2 p-4 bg-[#f7fafd] rounded-2xl shadow mt-3">
                <span className="text-xs font-medium text-gray-600">
                    Frequently Visited:
                </span>
                <div className="flex gap-3 text-xs text-[#019ee3] font-semibold">
                    <Link to="/forgot-password" className="hover:underline">Change Password</Link>
                    <Link to="/admin/orders" className="hover:underline">Track Order</Link>
                    <Link to="/" className="hover:underline">Help Center</Link>
                </div>
            </div>
        </div>
    );
};

export default AdminMenu;
