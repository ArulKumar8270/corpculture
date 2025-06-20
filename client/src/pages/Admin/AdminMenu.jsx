import { useAuth } from "../../context/auth";
import { Link, NavLink, useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import BarChartIcon from "@mui/icons-material/BarChart";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { GiCrossMark } from "react-icons/gi";
import SupportAgentIcon from '@mui/icons-material/SupportAgent'; // Import an icon for services
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'; // Import icon for Orders
import MenuBookIcon from '@mui/icons-material/MenuBook'; // Import icon for Menu
import FlagIcon from '@mui/icons-material/Flag'; // Import icon for Mission
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'; // Import icon for expand/collapse
import { useState } from 'react';

const AdminMenu = ({ toggleMenu }) => {
    const { auth, setAuth, LogOut } = useAuth();
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
        account: true, // Start with Account Settings expanded
        dashboard: true, // Start with Admin Dashboard expanded
    });

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
                            <NavLink
                                to="./profile"
                                onClick={scrollToTop}
                                className={({ isActive }) =>
                                    `rounded-lg mx-2 my-1 transition-all ${
                                        isActive
                                            ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                            : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                    }`
                                }
                            >
                                <div className="h-10 px-8 flex items-center">
                                    Profile Information
                                </div>
                            </NavLink>
                            <NavLink
                                to="./address"
                                onClick={scrollToTop}
                                className={({ isActive }) =>
                                    `rounded-lg mx-2 my-1 transition-all ${
                                        isActive
                                            ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                            : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                    }`
                                }
                            >
                                <div className="h-10 px-8 flex items-center">
                                    Manage Addresses
                                </div>
                            </NavLink>
                            <NavLink
                                to="./pan"
                                onClick={scrollToTop}
                                className={({ isActive }) =>
                                    `rounded-lg mx-2 my-1 transition-all ${
                                        isActive
                                            ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                            : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                    }`
                                }
                            >
                                <div className="h-10 px-8 flex items-center">
                                    Pan Card
                                </div>
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* Dashboard */}
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
                            <NavLink
                                to="./all-products"
                                onClick={scrollToTop}
                                className={({ isActive }) =>
                                    `rounded-lg mx-2 my-1 transition-all ${
                                        isActive
                                            ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                            : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                    }`
                                }
                            >
                                <div className="h-10 px-8 flex items-center">
                                    All Products
                                </div>
                            </NavLink>
                            <NavLink
                                to="./all-category"
                                onClick={scrollToTop}
                                className={({ isActive }) =>
                                    `rounded-lg mx-2 my-1 transition-all ${
                                        isActive
                                            ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                            : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                    }`
                                }
                            >
                                <div className="h-10 px-8 flex items-center">
                                    All Category
                                </div>
                            </NavLink>
                            <NavLink
                                to="/admin/users"
                                onClick={scrollToTop}
                                className={({ isActive }) =>
                                    `rounded-lg mx-2 my-1 transition-all ${
                                        isActive
                                            ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                            : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                    }`
                                }
                            >
                                <div className="h-10 px-8 flex items-center">
                                    Users
                                </div>
                            </NavLink>
                            <NavLink
                                to="/admin/AdminEmployees"
                                onClick={scrollToTop}
                                className={({ isActive }) =>
                                    `rounded-lg mx-2 my-1 transition-all ${
                                        isActive
                                            ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                            : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                    }`
                                }
                            >
                                <div className="h-10 px-8 flex items-center">
                                    Employee
                                </div>
                            </NavLink>
                             {/* Add the new links for Orders, Menu, and Mission */}
                            <NavLink
                                to="/admin/orders"
                                onClick={scrollToTop}
                                className={({ isActive }) =>
                                    `rounded-lg mx-2 my-1 transition-all ${
                                        isActive
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
                            <NavLink
                                to="./service-enquiries"
                                onClick={scrollToTop}
                                className={({ isActive }) =>
                                    `rounded-lg mx-2 my-1 transition-all ${
                                        isActive
                                            ? "font-semibold text-[#019ee3] bg-[#e6fbff]"
                                            : "hover:bg-[#e6fbff] hover:text-[#019ee3]"
                                    }`
                                }
                            >
                                <div className="h-10 px-8 flex items-center gap-3">
                                    <SupportAgentIcon sx={{ fontSize: "20px" }} />
                                    Service Enquiries
                                </div>
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* Logout */}
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

                {/* Frequently Visited */}
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
        </div>
    );
};

export default AdminMenu;
