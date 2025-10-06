/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/images/logo.png";
import { BiHomeSmile, BiLogoProductHunt } from "react-icons/bi";
import { AiOutlineUser, AiOutlineHeart } from "react-icons/ai";
import { BsCart2, BsBox } from "react-icons/bs";
import { RiArrowDropDownLine } from "react-icons/ri";
import { MdLogin, MdLogout } from "react-icons/md";
import { useAuth } from "../../context/auth";
import SearchBar from "./SearchBar";
import { useCart } from "../../context/cart";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

const Header = () => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const headerRef = useRef(null);
    const [commissions, setCommissions] = useState([]);
    const { auth, setAuth, LogOut, isCompanyEnabled, setIsCompanyEnabled, companyDetails, setSelectedCompany, selectedCompany } = useAuth();
    const [cartItems, setCartItems] = useCart();

    // Initialize isCompanyEnabled from localStorage
    useEffect(() => {
        const storedCompanyEnabled = localStorage.getItem('isCompanyEnabled');
        if (storedCompanyEnabled !== null) {
            setIsCompanyEnabled(JSON.parse(storedCompanyEnabled));
        }
    }, []);

    // Update localStorage whenever isCompanyEnabled changes
    useEffect(() => {
        localStorage.setItem('isCompanyEnabled', JSON.stringify(isCompanyEnabled));
    }, [isCompanyEnabled]);

    // Initialize selectedCompany from localStorage
    useEffect(() => {
        const storedSelectedCompany = localStorage.getItem('selectedCompany');
        if (storedSelectedCompany !== null) {
            setSelectedCompany(storedSelectedCompany);
        }
    }, []);

    // Update localStorage whenever selectedCompany changes
    useEffect(() => {
        localStorage.setItem('selectedCompany', selectedCompany);
    }, [selectedCompany]);

    useEffect(() => {
        if (auth?.token) {
            getCommisionDetails();
        }
    }, [auth?.token]);

    const handleChange = (event) => {
        setSelectedCompany(event.target.value);
    };

    let closeTimeout;
    const toggleDropdown = () => {
        clearTimeout(closeTimeout);
        setDropdownOpen(true);
    };
    const closeDropdown = () => {
        closeTimeout = setTimeout(() => {
            setDropdownOpen(false);
        }, 200);
    };

    const handleLogout = () => {
        LogOut();
    };

    const handleStickyHeader = () => {
        if (
            document.body.scrollTop > 0 ||
            document.documentElement.scrollTop > 0
        ) {
            headerRef.current.classList.add("sticky__header");
        } else {
            headerRef.current.classList.remove("sticky__header");
        }
    };

    const getCommisionDetails = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/commissions/user/${auth?.user?._id}`,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            if (response?.data?.commissions) {
                setCommissions(response.data.commissions);
            } else {
                setCommissions([]);
            }
        } catch (error) {
            console.error("Error fetching commissions:", error);
        }
    }
    useEffect(() => {
        window.addEventListener("scroll", handleStickyHeader);
        return () => {
            window.removeEventListener("scroll", handleStickyHeader);
        };

    }, []);

    return (
        <header ref={headerRef} className="relative bg-gradient-to-r from-[#0c115d] to-[#1a237e] shadow-lg">
            <nav className="max-w-8xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between">
                {/* Left: Logo */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                    <Link to="/" className="transition-transform hover:scale-105">
                        <img
                            src={logo}
                            alt="logo"
                            className="h-12 md:h-14 object-contain drop-shadow-lg"
                        />
                    </Link>
                </div>
                
                {/* Center: Search Bar */}
                {/* <div className="w-full md:w-1/3 flex justify-center my-3 md:my-0">
                    <SearchBar />
                </div> */}
                
                {/* Right: Navigation/Actions */}
                <div className="flex items-center gap-2 md:gap-2 w-full md:w-auto justify-center md:justify-end flex-wrap">
                    {/* Home */}
                    <NavLink 
                        to="/" 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 hover:text-cyan-300 transition-all duration-200 group"
                    >
                        <BiHomeSmile className="text-xl md:text-2xl group-hover:scale-110 transition-transform" />
                        <span className="text-base md:text-lg hidden md:block font-medium">Home</span>
                    </NavLink>
                    
                    {/* Products */}
                    <NavLink 
                        to="/products" 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 hover:text-cyan-300 transition-all duration-200 group"
                    >
                        <BiLogoProductHunt className="text-xl md:text-2xl group-hover:scale-110 transition-transform" />
                        <span className="text-base md:text-lg hidden md:block font-medium">Products</span>
                    </NavLink>
                    
                    {/* Cart */}
                    {auth?.user?.role !== 1 && (
                        <NavLink
                            to="/cart"
                            className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 hover:text-cyan-300 transition-all duration-200 group"
                        >
                            <span className="absolute -top-1 -right-1 w-5 h-5 text-xs text-center font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                {cartItems?.length}
                            </span>
                            <BsCart2 className="text-xl md:text-2xl group-hover:scale-110 transition-transform" />
                            <span className="hidden md:block text-base md:text-lg font-medium">Cart</span>
                        </NavLink>
                    )}
                    
                    {/* Commission */}
                    {auth?.user?.isCommissionEnabled ? (
                        <div className="flex items-center gap-3 bg-white/10 rounded-lg px-3 py-2">
                            <span className="text-white text-sm md:text-base font-medium">Commission:</span>
                            <span className="font-bold text-lg md:text-xl text-green-400 drop-shadow-lg">
                                ₹{commissions
                                    .reduce((sum, item) => sum + (item.commissionAmount || 0), 0)
                                    .toFixed(2)}
                            </span>
                        </div>
                    ) : null}

                    {/* Company Select */}
                    {isCompanyEnabled ? (
                        <FormControl sx={{ m: 1, minWidth: 140 }} size="small">
                            <InputLabel id="company-select-label" sx={{ color: 'white', fontSize: '0.875rem' }}>Companies</InputLabel>
                            <Select
                                labelId="company-select-label"
                                id="company-select"
                                value={selectedCompany}
                                onChange={handleChange}
                                autoWidth
                                label="Companies"
                                sx={{
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    '.MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'white',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'white',
                                    },
                                    '.MuiSvgIcon-root': {
                                        color: 'white',
                                    },
                                    '& .MuiSelect-select': {
                                        padding: '8px 12px',
                                    }
                                }}
                            >
                                <MenuItem value="new">
                                    <em>New Company</em>
                                </MenuItem>
                                {companyDetails?.map((res) =>
                                    <MenuItem key={res?._id} value={res?._id}>{res?.companyName}</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    ) : null}

                    {/* Enable Company Account Checkbox */}
                    {auth?.user?.role !== 1 && (
                        <label className="flex items-center gap-2 text-white text-sm font-medium cursor-pointer hover:bg-white/10 rounded-lg px-3 py-2 transition-all duration-200">
                            <input
                                type="checkbox"
                                checked={isCompanyEnabled}
                                className="accent-cyan-300 w-4 h-4 rounded focus:ring-2 focus:ring-cyan-400"
                                onChange={() => setIsCompanyEnabled(!isCompanyEnabled)}
                            />
                            <span className="hidden lg:block">Enable Company</span>
                            <span className="lg:hidden">Company</span>
                        </label>
                    )}
                    
                    {/* Account Dropdown */}
                    <div
                        className="relative group"
                        onMouseEnter={toggleDropdown}
                        onMouseLeave={closeDropdown}
                    >
                        {auth.user ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 hover:text-cyan-300 transition-all duration-200 cursor-pointer group">
                                <AiOutlineUser className="text-xl md:text-2xl group-hover:scale-110 transition-transform" />
                                <span className="text-base md:text-lg hidden md:block font-medium">{auth.user.name.split(" ")[0]}</span>
                                <RiArrowDropDownLine className="text-xl md:text-2xl group-hover:rotate-180 transition-transform duration-200" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 hover:text-cyan-300 transition-all duration-200 cursor-pointer">
                                <Link to="/login" className="flex items-center gap-2">
                                    <AiOutlineUser className="text-xl md:text-2xl" />
                                    <span className="text-base md:text-lg hidden md:block font-medium">Sign in</span>
                                </Link>
                            </div>
                        )}
                        
                        {/* Enhanced Dropdown */}
                        {isDropdownOpen && (
                            <div
                                className="absolute top-12 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-2 w-48 transform origin-top-right transition-all duration-200 ease-out"
                                onMouseEnter={toggleDropdown}
                                onMouseLeave={closeDropdown}
                                style={{
                                    animation: 'dropdownSlide 0.2s ease-out',
                                    backdropFilter: 'blur(10px)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                }}
                            >
                                <style jsx>{`
                                    @keyframes dropdownSlide {
                                        from {
                                            opacity: 0;
                                            transform: translateY(-10px) scale(0.95);
                                        }
                                        to {
                                            opacity: 1;
                                            transform: translateY(0) scale(1);
                                        }
                                    }
                                `}</style>
                                <ul className="space-y-1">
                                    {!auth.user && (
                                        <li className="p-2 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 rounded-lg transition-all duration-150">
                                            <Link to="/register" className="flex items-center gap-3 text-gray-700 hover:text-cyan-600">
                                                <MdLogin className="text-base" />
                                                <span className="font-medium">Sign up</span>
                                            </Link>
                                        </li>
                                    )}
                                    <li className="p-2 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 rounded-lg transition-all duration-150">
                                        <Link
                                            to={`${auth?.user?.role === 1 || auth?.user?.role === 3
                                                ? "/admin"
                                                : "/user"
                                            }/dashboard`}
                                            className="flex items-center gap-3 text-gray-700 hover:text-cyan-600"
                                        >
                                            <AiOutlineUser className="text-base" />
                                            <span className="font-medium">My Profile</span>
                                        </Link>
                                    </li>
                                    {auth.user?.role !== 1 && (
                                        <li className="p-2 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 rounded-lg transition-all duration-150">
                                            <Link to="/user/wishlist" className="flex items-center gap-3 text-gray-700 hover:text-cyan-600">
                                                <AiOutlineHeart className="text-base" />
                                                <span className="font-medium">Wishlist</span>
                                            </Link>
                                        </li>
                                    )}
                                    <li className="p-2 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 rounded-lg transition-all duration-150">
                                        <Link
                                            to={`${auth?.user?.role === 1
                                                ? "/admin"
                                                : "/user"
                                            }/orders`}
                                            className="flex items-center gap-3 text-gray-700 hover:text-cyan-600"
                                        >
                                            <BsBox className="text-base" />
                                            <span className="font-medium">Orders</span>
                                        </Link>
                                    </li>
                                    {auth.user && (
                                        <li className="p-2 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-lg transition-all duration-150">
                                            <Link
                                                onClick={handleLogout}
                                                to="/login"
                                                className="flex items-center gap-3 text-red-600 hover:text-red-700"
                                            >
                                                <MdLogout className="text-base" />
                                                <span className="font-medium">Logout</span>
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
