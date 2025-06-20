import { Route, Routes, useNavigate } from "react-router-dom";
import AdminMenu from "./AdminMenu";
import UserProfile from "../UserProfile";
import AddressComponent from "../AddressComponent";
import PanCardComponent from "../PanCardComponent";
import CreateProduct from "./CreateProduct";
import AllProducts from "./AllProducts";
import AllCategories from "./AllCategories";
import Users from "./Users";
import Deactivate from "../Auth/Deactivate";
import EditProduct from "./EditProduct";
import SeoData from "../../SEO/SeoData";
import { useEffect, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import AdminServices from "./AdminServices"; // Import the new component

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State to manage menu visibility

    useEffect(() => {
        if (window.location.pathname === "/admin/dashboard") {
            navigate("./profile");
        }
    }, [navigate]);

    const toggleMenu = () => {
        setIsMenuOpen((prevState) => !prevState);
    };

    return (
        <>
            <SeoData title="Admin Dashboard" />
            <div className="min-h-screen bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] py-8">
                <div className="flex flex-col sm:flex-row items-start justify-center gap-6  mx-auto px-2 sm:px-8">
                    {/* Sidebar */}
                    <div
                        className={`w-full sm:w-[260px] mb-4 sm:mb-0 ${
                            isMenuOpen
                                ? "block z-50"
                                : "hidden"
                        } sm:block`}
                    >
                        <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-8">
                            <AdminMenu toggleMenu={toggleMenu} />
                        </div>
                    </div>
                    {/* Main Content */}
                    <div className="flex-1 w-full p-4 min-h-[60vh] relative">
                        <button
                            onClick={toggleMenu}
                            className="sm:hidden absolute top-4 right-4 bg-[#019ee3] text-white rounded-full p-2 shadow-md transition hover:bg-[#afcb09]"
                        >
                            {isMenuOpen ? "Close" : <GiHamburgerMenu size={22} />}
                        </button>
                        <Routes>
                            <Route path="" element={<UserProfile />} />
                            <Route path="profile" element={<UserProfile />} />
                            <Route path="address" element={<AddressComponent />} />
                            <Route path="pan" element={<PanCardComponent />} />
                            <Route path="add-product" element={<CreateProduct />} />
                            <Route path="all-products" element={<AllProducts />} />
                            <Route path="all-category" element={<AllCategories />} />
                            <Route path="users" element={<Users />} />
                            {/* Add the new route for Service Enquiries */}
                            <Route path="service-enquiries" element={<AdminServices />} />
                            <Route path="profile/deactivate" element={<Deactivate />} />
                            <Route path="product/:productId" element={<EditProduct />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
