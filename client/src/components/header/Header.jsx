/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { BiHomeSmile, BiLogoProductHunt } from "react-icons/bi";
import { AiOutlineUser, AiOutlineHeart } from "react-icons/ai";
import { BsCart2, BsBox } from "react-icons/bs";
import { RiArrowDropDownLine } from "react-icons/ri";
import { MdLogin, MdLogout } from "react-icons/md";
import { useAuth } from "../../context/auth";
import SearchBar from "./SearchBar";
import { useCart } from "../../context/cart";
// import { toast } from "react-toastify";
// import LogOut from "../../pages/Auth/LogOut";

const Header = () => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const headerRef = useRef(null);

    const { auth, setAuth, LogOut } = useAuth();
    const [cartItems, setCartItems] = useCart();

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

    useEffect(() => {
        window.addEventListener("scroll", handleStickyHeader);
        return () => {
            window.removeEventListener("scroll", handleStickyHeader);
        };
    }, []);

    return (
        <header ref={headerRef} className="relative bg-[#8b1414]">
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
                {/* Left: Logo */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                    <Link to="/">
                        <img
                            src={logo}
                            alt="logo"
                            className="h-12 md:h-14 object-contain"
                        />
                    </Link>
                </div>
                {/* Center: Search Bar */}
                <div className="w-full md:w-1/2 flex justify-center my-4 md:my-0">
                    <SearchBar />
                </div>
                {/* Right: Navigation/Actions */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-center md:justify-end">
                    {/* Home */}
                    <NavLink to="/" className="flex items-center gap-1 text-white hover:text-cyan-300 transition">
                        <BiHomeSmile className="text-2xl" />
                        <span className="text-lg hidden md:block">Home</span>
                    </NavLink>
                    <NavLink to="/products" className="flex items-center gap-1 text-white hover:text-cyan-300 transition">
                        <BiLogoProductHunt className="text-2xl" />
                        <span className="text-lg hidden md:block">Products</span>
                    </NavLink>
                    {/* Account */}
                    <div
                        className={`relative group`}
                        onMouseEnter={toggleDropdown}
                        onMouseLeave={closeDropdown}
                    >
                        {auth.user ? (
                            <div className="flex items-center gap-1 text-white cursor-pointer hover:text-cyan-300 transition">
                                <AiOutlineUser className="text-2xl" />
                                <span className="text-lg hidden md:block">{auth.user.name.split(" ")[0]}</span>
                                <RiArrowDropDownLine className="text-2xl group-hover:rotate-180 transition" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-white cursor-pointer hover:text-cyan-300 transition">
                                <Link to="/login" className="flex items-center gap-1">
                                    <AiOutlineUser className="text-2xl" />
                                    <span className="text-lg hidden md:block">Sign in</span>
                                </Link>
                                <RiArrowDropDownLine className="text-2xl" />
                            </div>
                        )}
                        {/* Dropdown */}
                        {isDropdownOpen && (
                            <div
                                className="absolute top-10 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-44"
                                onMouseEnter={toggleDropdown}
                                onMouseLeave={closeDropdown}
                            >
                                <ul>
                                    {!auth.user && (
                                        <li className="p-2 hover:bg-cyan-50 rounded">
                                            <Link to="/register" className="flex items-center gap-2 text-gray-700">
                                                <MdLogin className="text-base" />
                                                <span>Sign up</span>
                                            </Link>
                                        </li>
                                    )}
                                    <li className="p-2 hover:bg-cyan-50 rounded">
                                        <Link
                                            to={`${
                                                auth?.user?.role === 1
                                                    ? "/admin"
                                                    : "/user"
                                            }/dashboard`}
                                            className="flex items-center gap-2 text-gray-700"
                                        >
                                            <AiOutlineUser className="text-base" />
                                            <span>My Profile</span>
                                        </Link>
                                    </li>
                                    {auth.user?.role !== 1 && (
                                        <li className="p-2 hover:bg-cyan-50 rounded">
                                            <Link to="/user/wishlist" className="flex items-center gap-2 text-gray-700">
                                                <AiOutlineHeart className="text-base" />
                                                <span>Wishlist</span>
                                            </Link>
                                        </li>
                                    )}
                                    <li className="p-2 hover:bg-cyan-50 rounded">
                                        <Link
                                            to={`${
                                                auth?.user?.role === 1
                                                    ? "/admin"
                                                    : "/user"
                                            }/orders`}
                                            className="flex items-center gap-2 text-gray-700"
                                        >
                                            <BsBox className="text-base" />
                                            <span>Orders</span>
                                        </Link>
                                    </li>
                                    {auth.user && (
                                        <li className="p-2 hover:bg-cyan-50 rounded">
                                            <Link
                                                onClick={handleLogout}
                                                to="/login"
                                                className="flex items-center gap-2 text-gray-700"
                                            >
                                                <MdLogout className="text-base" />
                                                <span>Logout</span>
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                    {/* Cart */}
                    {auth?.user?.role !== 1 && (
                        <NavLink
                            to="/cart"
                            className="relative flex items-center gap-1 text-white hover:text-cyan-300 transition"
                        >
                            <span className="absolute -top-2 -right-3 w-5 h-5 text-xs text-center font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                                {cartItems?.length}
                            </span>
                            <BsCart2 className="text-2xl" />
                            <span className="hidden md:block text-lg">Cart</span>
                        </NavLink>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
